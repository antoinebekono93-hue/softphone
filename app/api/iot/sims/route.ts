import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    });
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    // 1. Fetch Local SIMs
    const localSims = await prisma.simCard.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch Telnyx SIMs (Real API)
    let telnyxSims: any[] = [];
    if (process.env.TELNYX_API_KEY) {
      const res = await fetch("https://api.telnyx.com/v2/sim_cards", {
        headers: {
          "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
        }
      });
      if (res.ok) {
        const json = await res.json();
        telnyxSims = json.data || [];
      }
    }

    // 3. Merge Data
    const mergedSims = localSims.map(localSim => {
      const tSim = telnyxSims.find(s => s.id === localSim.telnyxSimId || s.iccid === localSim.iccid);
      
      // Map Telnyx status or fallback to local
      let status = localSim.status;
      if (tSim) {
        status = tSim.status; // 'enabled', 'disabled', 'standby', 'data_limit_exceeded'
      }

      // We could also fetch data usage per SIM via Telnyx SIM Card Data Usage endpoint,
      // but for this dashboard we use local mock or 0 if not available, since Telnyx Network
      // metrics might require a separate API call per SIM.
      // We will rely on local DB dataUsedMB for now, and real status from Telnyx.
      
      return {
        id: localSim.id,
        iccid: localSim.iccid,
        type: localSim.type,
        status: status, 
        name: localSim.name,
        dataUsedMB: localSim.dataUsedMB,
        dataLimitMB: localSim.dataLimitMB,
        alertEnabled: localSim.alertEnabled,
        lpaCode: localSim.lpaCode,
        telnyxSimId: localSim.telnyxSimId
      };
    });

    return NextResponse.json(mergedSims);
  } catch (error) {
    console.error("Error fetching SIMs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    });
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const { type, name, price } = await request.json();

    // Verify balance
    if (org.walletBalance < price) {
      return NextResponse.json({ error: "Fonds insuffisants. Veuillez recharger votre portefeuille." }, { status: 400 });
    }

    // Order real eSIM via Telnyx
    let telnyxSimId = "";
    let iccid = "";
    let activationCode = "";
    let simType = "PHYSICAL";

    if (type === 'ESIM') {
      if (!process.env.TELNYX_API_KEY) {
        return NextResponse.json({ error: "Configuration API Telnyx manquante" }, { status: 500 });
      }

      // Call Telnyx API to purchase eSIM
      // Note: Telnyx charges $0.70 for an eSIM.
      const res = await fetch("https://api.telnyx.com/v2/actions/purchase/esims", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: 1
        })
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Telnyx eSIM Purchase Error:", err);
        return NextResponse.json({ error: "Erreur lors de la commande de l'eSIM chez Telnyx." }, { status: 500 });
      }

      const json = await res.json();
      // Returns a list of eSIMs provisioned
      const esimData = json.data?.[0];
      if (esimData) {
        telnyxSimId = esimData.id;
        iccid = esimData.iccid;
        activationCode = esimData.activation_code || `LPA:1$smdp.plus.telnyx.com$${iccid}`; // fallback format if not directly provided
        simType = "ESIM";
      }
    } else {
      // For physical SIMs, they must be ordered via portal and registered.
      // This endpoint only supports eSIM programmatic purchase in this CRM.
      return NextResponse.json({ error: "La commande de SIM physiques via API n'est pas supportée. Veuillez utiliser des eSIMs." }, { status: 400 });
    }

    // Deduct from wallet
    await prisma.organization.update({
      where: { id: org.id },
      data: { walletBalance: org.walletBalance - price },
    });

    const sim = await prisma.simCard.create({
      data: {
        iccid: iccid,
        telnyxSimId: telnyxSimId,
        type: simType,
        status: 'registered', // Initial status before enabling
        name: name || "Nouvelle eSIM",
        dataUsedMB: 0,
        lpaCode: activationCode,
        organizationId: org.id,
      }
    });

    return NextResponse.json(sim);
  } catch (error) {
    console.error("Error ordering SIM:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
