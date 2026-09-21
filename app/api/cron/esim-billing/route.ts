import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSimCards as getTelnyxSimCards, setSimCardStatus } from "@/lib/telnyx-esim";

// Telnyx charges you around $0.005 to $0.01 per MB depending on zones.
// Set your markup rate here, e.g., $0.015 per MB
const RATE_PER_MB = 0.015;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 1. Fetch active SIMs from DB
    const activeSims = await prisma.simCard.findMany({
      where: { status: "enabled" },
      include: { organization: true },
    });

    if (activeSims.length === 0) {
      return NextResponse.json({ success: true, message: "No active SIMs to process" });
    }

    // 2. Fetch live data from Telnyx
    const telnyxRes = await getTelnyxSimCards();
    if (!telnyxRes.success || !telnyxRes.data) {
      return NextResponse.json({ success: false, error: "Failed to fetch Telnyx SIMs" }, { status: 500 });
    }

    const telnyxMap = new Map();
    for (const tSim of telnyxRes.data) {
      telnyxMap.set(tSim.iccid, tSim);
    }

    let processed = 0;
    let suspendedByWallet = 0;
    let suspendedByCap = 0;

    // 3. Compare and bill
    for (const sim of activeSims) {
      const liveSim = telnyxMap.get(sim.iccid);
      if (!liveSim) continue;

      const liveDataMB = Number(liveSim.current_billing_period_consumed_data?.amount || 0);
      const previouslyBilledMB = sim.dataUsedMB || 0;
      const unbilledMB = liveDataMB - previouslyBilledMB;

      // ── GUARD 1 : Plafond de data individuel ──────────────────────────
      // Check BEFORE billing — if the SIM has a cap and has exceeded it, suspend immediately.
      if (sim.dataLimitMB !== null && liveDataMB >= sim.dataLimitMB) {
        await setSimCardStatus(sim.telnyxSimId, "standby");
        await prisma.simCard.update({
          where: { id: sim.id },
          data: { status: "data_limit_exceeded", dataUsedMB: liveDataMB }
        });
        // Still create a transaction for the unbilled MB before the cut
        if (unbilledMB > 0) {
          const cost = unbilledMB * RATE_PER_MB;
          const orgWalletBalance = Number(sim.organization.walletBalance);
          const chargeAmount = Math.min(cost, orgWalletBalance);
          if (chargeAmount > 0) {
            await prisma.$transaction([
              prisma.organization.update({
                where: { id: sim.organizationId },
                data: { walletBalance: { decrement: chargeAmount } }
              }),
              prisma.walletTransaction.create({
                data: {
                  amount: -chargeAmount,
                  type: "ESIM_DATA_USAGE",
                  description: `Consommation eSIM ${sim.name || sim.iccid.slice(-8)} — Plafond ${(sim.dataLimitMB / 1024).toFixed(1)} GB atteint`,
                  organizationId: sim.organizationId,
                }
              }),
            ]);
          }
        }
        suspendedByCap++;
        continue; // Skip normal billing for this SIM
      }

      // ── GUARD 2 : Solde Wallet insuffisant ────────────────────────────
      if (unbilledMB > 0) {
        const cost = unbilledMB * RATE_PER_MB;
        const orgWalletBalance = Number(sim.organization.walletBalance);

        if (orgWalletBalance >= cost) {
          // Bill normally
          await prisma.$transaction([
            prisma.organization.update({
              where: { id: sim.organizationId },
              data: { walletBalance: { decrement: cost } }
            }),
            prisma.walletTransaction.create({
              data: {
                amount: -cost,
                type: "ESIM_DATA_USAGE",
                description: `Consommation Data eSIM ${sim.name || sim.iccid.slice(-8)} (${unbilledMB.toFixed(2)} MB)`,
                organizationId: sim.organizationId,
              }
            }),
            prisma.simCard.update({
              where: { id: sim.id },
              data: { dataUsedMB: liveDataMB }
            })
          ]);
          processed++;
        } else {
          // Drain remaining wallet, then suspend
          if (orgWalletBalance > 0) {
            await prisma.$transaction([
              prisma.organization.update({
                where: { id: sim.organizationId },
                data: { walletBalance: 0 }
              }),
              prisma.walletTransaction.create({
                data: {
                  amount: -orgWalletBalance,
                  type: "ESIM_DATA_USAGE",
                  description: `Dépassement Data eSIM ${sim.name || sim.iccid.slice(-8)} — Solde épuisé`,
                  organizationId: sim.organizationId,
                }
              }),
            ]);
          }
          await setSimCardStatus(sim.telnyxSimId, "standby");
          await prisma.simCard.update({
            where: { id: sim.id },
            data: { status: "standby", dataUsedMB: liveDataMB }
          });
          suspendedByWallet++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processedSims: processed, 
      suspendedByWallet,
      suspendedByCap,
    });

  } catch (error: any) {
    console.error("Cron eSIM billing error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
