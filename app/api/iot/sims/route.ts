import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Dans une vraie application, nous récupérerions l'organizationId via la session utilisateur
    // Pour l'instant, on prend la première organisation pour simplifier
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const sims = await prisma.simCard.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sims);
  } catch (error) {
    console.error("Error fetching SIMs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const { type, name, price } = await request.json();

    // Vérifier le solde
    if (org.walletBalance < price) {
      return NextResponse.json({ error: "Fonds insuffisants. Veuillez recharger votre portefeuille." }, { status: 400 });
    }

    // Déduire du wallet
    await prisma.organization.update({
      where: { id: org.id },
      data: { walletBalance: org.walletBalance - price },
    });

    // MOCK TELNYX API
    // On génère des fausses données d'eSIM
    const mockIccid = `894450${Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0')}`;
    const mockTelnyxId = `sim_${Math.random().toString(36).substring(2, 10)}`;
    const mockLpa = type === 'ESIM' ? `LPA:1$smdp.plus.telnyx.com$${mockTelnyxId}` : null;

    const sim = await prisma.simCard.create({
      data: {
        iccid: mockIccid,
        telnyxSimId: mockTelnyxId,
        type: type === 'ESIM' ? 'ESIM' : 'PHYSICAL',
        status: 'ACTIVE',
        name: name || "Nouvelle SIM",
        dataUsedMB: 0,
        lpaCode: mockLpa,
        organizationId: org.id,
      }
    });

    return NextResponse.json(sim);
  } catch (error) {
    console.error("Error ordering SIM:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
