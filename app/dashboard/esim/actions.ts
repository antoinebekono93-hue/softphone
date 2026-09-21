"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSimCards as getTelnyxSimCards, purchaseEsim as purchaseTelnyxEsim, getEsimActivationCode } from "@/lib/telnyx-esim";
import { revalidatePath } from "next/cache";

export async function getMySimCards() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Non autorisé" };
  }
  const orgId = session.user.organizationId;

  try {
    // 1. Fetch DB records for this organization
    const dbSims = await prisma.simCard.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" }
    });

    if (dbSims.length === 0) return { success: true, data: [] };

    // 2. Fetch live data from Telnyx to attach data usage
    // Using a list query with filter for the ICCIDs to avoid pulling entire fleet
    const iccids = dbSims.map(s => s.iccid);
    
    // Instead of sending 50 filter[iccid] params which might fail, we just fetch our DB records 
    // and optionally attach the latest data from a bulk Telnyx query or loop.
    // For performance, since the user likely only has a few eSIMs, we can just fetch all from Telnyx and filter.
    // Alternatively, we use `getTelnyxSimCards` with no params and map them.
    const telnyxRes = await getTelnyxSimCards();
    const telnyxMap = new Map();
    if (telnyxRes.success && telnyxRes.data) {
      for (const tSim of telnyxRes.data) {
        telnyxMap.set(tSim.iccid, tSim);
      }
    }

    // 3. Merge data
    const mergedSims = dbSims.map(dbSim => {
      const liveSim = telnyxMap.get(dbSim.iccid);
      return {
        ...dbSim,
        liveDataUsedMB: liveSim?.current_billing_period_consumed_data?.amount || 0,
        liveStatus: liveSim?.status || dbSim.status,
      };
    });

    return { success: true, data: mergedSims };

  } catch (error: any) {
    console.error("getMySimCards error:", error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function purchaseEsimForUser() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Non autorisé" };
  }
  const orgId = session.user.organizationId;

  try {
    // Check wallet and settings
    const [org, settings] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId } }),
      prisma.systemSettings.findUnique({ where: { id: 'default' } })
    ]);

    if (!org) return { success: false, error: "Organisation introuvable" };
    
    const esimCost = Number(settings?.eSimRate || 5.00); // 5$ par défaut
    if (Number(org.walletBalance) < esimCost) {
      return { success: false, error: "Solde insuffisant pour commander une eSIM." };
    }

    // Purchase via Telnyx
    const purchaseRes = await purchaseTelnyxEsim(1);
    if (!purchaseRes.success || !purchaseRes.data || purchaseRes.data.length === 0) {
      return { success: false, error: purchaseRes.error || "L'achat a échoué chez le fournisseur." };
    }

    const newSim = purchaseRes.data[0];

    // Transaction & Insert in Prisma
    await prisma.$transaction([
      prisma.organization.update({
        where: { id: orgId },
        data: {
          walletBalance: { decrement: esimCost }
        }
      }),
      prisma.walletTransaction.create({
        data: {
          amount: -esimCost,
          type: "ESIM_PURCHASE",
          description: `Achat d'une eSIM (ICCID: ${newSim.iccid})`,
          organizationId: orgId,
        }
      }),
      prisma.simCard.create({
        data: {
          iccid: newSim.iccid,
          telnyxSimId: newSim.id,
          type: "ESIM",
          status: newSim.status || "ACTIVE",
          organizationId: orgId,
        }
      })
    ]);

    revalidatePath("/dashboard/esim");
    return { success: true, data: newSim };

  } catch (error: any) {
    console.error("purchaseEsimForUser error:", error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function getMyActivationCode(simId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Non autorisé" };
  }
  
  // Verify ownership
  const sim = await prisma.simCard.findUnique({
    where: { telnyxSimId: simId }
  });

  if (!sim || sim.organizationId !== session.user.organizationId) {
    return { success: false, error: "Accès refusé" };
  }

  return await getEsimActivationCode(simId);
}

export async function activateMySimCard(simId: string, enable: boolean) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Non autorisé" };
  }

  // Verify ownership
  const sim = await prisma.simCard.findUnique({
    where: { telnyxSimId: simId }
  });

  if (!sim || sim.organizationId !== session.user.organizationId) {
    return { success: false, error: "Accès refusé" };
  }

  // Use Telnyx SDK function that exists in telnyx-esim.ts (setSimCardStatus)
  const { setSimCardStatus } = await import("@/lib/telnyx-esim");
  const result = await setSimCardStatus(simId, enable ? "enabled" : "standby");

  if (result.success) {
    // Update local DB status to match
    await prisma.simCard.update({
      where: { telnyxSimId: simId },
      data: { status: enable ? "enabled" : "standby" }
    });
    revalidatePath("/dashboard/esim");
  }

  return result;
}

export async function renameMySimCard(simId: string, name: string) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Non autorisé" };
  }

  // Verify ownership
  const sim = await prisma.simCard.findUnique({
    where: { telnyxSimId: simId }
  });

  if (!sim || sim.organizationId !== session.user.organizationId) {
    return { success: false, error: "Accès refusé" };
  }

  try {
    await prisma.simCard.update({
      where: { telnyxSimId: simId },
      data: { name: name.trim() || null }
    });
    revalidatePath("/dashboard/esim");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setSimDataCap(simId: string, limitGB: number | null) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Non autorisé" };
  }

  // Verify ownership
  const sim = await prisma.simCard.findUnique({
    where: { telnyxSimId: simId }
  });

  if (!sim || sim.organizationId !== session.user.organizationId) {
    return { success: false, error: "Accès refusé" };
  }

  try {
    const limitMB = limitGB !== null ? limitGB * 1024 : null;
    await prisma.simCard.update({
      where: { telnyxSimId: simId },
      data: { dataLimitMB: limitMB }
    });
    revalidatePath("/dashboard/esim");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
