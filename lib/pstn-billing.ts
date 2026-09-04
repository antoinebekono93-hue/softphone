import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSystemRates, debitWalletAtomically, creditWalletAtomically } from "@/lib/billing";
import { logAppCallDecision } from "@/lib/app-call-policy";
import { computePstnCost, computeSettleAdjustment } from "@/lib/pstn-cost";

const HOLD_TX_TYPE = "PSTN_CALL_HOLD"; // pré-déduction (initiated)
const SETTLE_TX_TYPE = "PSTN_CALL"; // coût réel (hangup)
const REFUND_TX_TYPE = "PSTN_CALL_REFUND"; // remboursement (release / ajustement)
const MINUTES_DIVISOR = 60;
const RESERVATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export type PstnRateProfile = "STANDARD" | "AI_AGENT";

export type PreAuthResult = {
  authorized: boolean;
  reservationId?: string;
  estimatedCost: number;
  heldAmount: number;
  reason?: string;
  planName?: string | null;
  walletBalance: number;
};

export type SettleResult = {
  billed: boolean;
  includedMinutesUsed: number;
  walletCost: number;
  totalCost: number;
  heldAmount: number;
  refunded: number;
  transactionIds: string[];
  reservationId?: string | null;
};

/**
 * Calcule le coût estimé d'un appel PSTN à des fins de pré-autorisation.
 * Est = tarif/minute × durée plafonnée (fair-use maxCallDurationSeconds, borné à 60 min).
 */
export async function estimatePstnCost(
  organizationId: string,
  rateProfile: PstnRateProfile = "STANDARD"
): Promise<{ estimatedCost: number; costPerMinute: number; maxDurationSeconds: number }> {
  const [rates, org] = await Promise.all([
    getSystemRates(),
    prisma.organization.findUnique({
      where: { id: organizationId },
      include: { pricingPlan: true },
    }),
  ]);

  const costPerMinute =
    rateProfile === "AI_AGENT"
      ? rates.aiAgentRatePerMinute.toNumber()
      : rates.callRatePerMinute.toNumber();

  const maxDurationSeconds = Math.min(
    org?.pricingPlan?.maxCallDurationSeconds ?? 3600,
    3600 // cap d'estimation prudent
  );

  const estimatedCost = costPerMinute * (maxDurationSeconds / 60);
  return { estimatedCost, costPerMinute, maxDurationSeconds };
}

/**
 * Minutes incluses déjà consommées (compteur atomique `minutesUsedThisMonth`).
 * NB : colonne Int → précision à la minute entière (voir rapport).
 */
async function readIncludedUsed(orgId: string): Promise<number> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { minutesUsedThisMonth: true },
  });
  return org?.minutesUsedThisMonth ?? 0;
}

/**
 * Consomme des minutes incluses de façon ATOMIQUE avec garde :
 *   UPDATE ... SET minutesUsedThisMonth = minutesUsedThisMonth + canUse
 *   WHERE id = org AND minutesUsedThisMonth <= includedMinutes - canUse
 * Renvoie le nombre de minutes incluses réellement consommées (0 si épuisées
 * en raison d'une course). Sûr en concurrence : deux settlements simultanés ne
 * peuvent pas consommer deux fois les mêmes minutes.
 */
async function consumeIncludedMinutes(
  tx: Prisma.TransactionClient,
  orgId: string,
  includedTotal: number,
  wantedMinutes: number
): Promise<number> {
  if (wantedMinutes <= 0) return 0;
  const canUse = Math.min(wantedMinutes, Math.max(includedTotal, 0));
  const toIncrement = Math.round(canUse);
  if (toIncrement <= 0) return 0;

  // Garde atomique : le cumul ne doit pas dépasser includedTotal.
  const res = await tx.organization.updateMany({
    where: {
      id: orgId,
      minutesUsedThisMonth: { lte: includedTotal - canUse },
    },
    data: { minutesUsedThisMonth: { increment: toIncrement } },
  });
  if (res.count === 1) return canUse;

  // Course : quelqu'un a consommé entre-temps. On retente avec le reste disponible.
  const fresh = await tx.organization.findUnique({
    where: { id: orgId },
    select: { minutesUsedThisMonth: true },
  });
  const usedNow = fresh?.minutesUsedThisMonth ?? 0;
  const remaining = Math.max(includedTotal - usedNow, 0);
  const canUse2 = Math.min(wantedMinutes, remaining);
  const toIncrement2 = Math.round(canUse2);
  if (toIncrement2 <= 0) return 0;
  const res2 = await tx.organization.updateMany({
    where: { id: orgId, minutesUsedThisMonth: { lte: includedTotal - canUse2 } },
    data: { minutesUsedThisMonth: { increment: toIncrement2 } },
  });
  return res2.count === 1 ? canUse2 : 0;
}

/**
 * Pré-autorisation d'un appel PSTN à `call.initiated`.
 *
 *  - Crée une CallReservation (trace d'audit) SI un plan existe.
 *  - SI `plan.preAuthRequired` : PRÉ-DÉDUIT atomiquement la part wallet estimée
 *    (hold) avec garde `walletBalance >= amount`. Deux appels simultanés
 *    entrent en concurrence sur CE débit conditionnel : le second est refusé
 *    quand le solde est insuffisant. → bloque réellement la double conso du solde.
 *  - Sinon (pas de pré-auth obligatoire) : réservation d'audit de montant 0,
 *    le débit réel est garantie à la résolution (settle) par garde atomique.
 */
export async function preAuthorizeCall(params: {
  organizationId: string;
  callControlId: string;
  callLogId?: string | null;
  rateProfile?: PstnRateProfile;
}): Promise<PreAuthResult> {
  const { organizationId, callControlId, callLogId, rateProfile = "STANDARD" } = params;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { pricingPlan: true },
  });
  if (!org) {
    return { authorized: false, estimatedCost: 0, heldAmount: 0, reason: "ORGANIZATION_NOT_FOUND", walletBalance: 0 };
  }

  const walletBalance = org.walletBalance.toNumber();
  const plan = org.pricingPlan;
  if (!plan) {
    return { authorized: true, estimatedCost: 0, heldAmount: 0, planName: null, walletBalance };
  }

  const { estimatedCost, costPerMinute, maxDurationSeconds } = await estimatePstnCost(organizationId, rateProfile);
  const preAuthRequired = plan.preAuthRequired ?? false;

  const usedThisMonth = await readIncludedUsed(organizationId);
  // Part wallet estimée = estimation totale non couverte par les minutes incluses.
  const estimateMinutes = maxDurationSeconds / MINUTES_DIVISOR;
  const remainingIncluded = Math.max((plan.includedMinutes ?? 0) - usedThisMonth, 0);
  const walletEstimateMinutes = Math.max(estimateMinutes - remainingIncluded, 0);
  const holdAmount = walletEstimateMinutes * costPerMinute;

  // Réservation d'audit toujours créée (trace). Hold réel uniquement si preAuthRequired.
  let reservationId: string | undefined;
  const held = await prisma.$transaction(async (tx) => {
    if (preAuthRequired && holdAmount > 0) {
      const ok = await debitWalletAtomically(tx, organizationId, holdAmount);
      if (!ok) return false; // solde insuffisant → refus ; rien n'est retenu
    }
    const reservation = await tx.callReservation.create({
      data: {
        organizationId,
        callLogId: callLogId ?? null,
        amount: new Prisma.Decimal(preAuthRequired ? holdAmount : 0),
        status: "PENDING",
        expiresAt: new Date(Date.now() + RESERVATION_TTL_MS),
      },
    });
    reservationId = reservation.id;
    if (preAuthRequired && holdAmount > 0) {
      // Concurrence + idempotence : l'index unique (callControlId, HOLD) annule la
      // transaction en double (donc son débit) si initiated est rejoué.
      await tx.walletTransaction.create({
        data: {
          organizationId,
          amount: -holdAmount,
          type: HOLD_TX_TYPE,
          description: `Pré-autorisation appel PSTN (${rateProfile})`,
          callControlId,
        },
      });
    }
    return true;
  });

  if (!held) {
    await logAppCallDecision(
      organizationId,
      null,
      "CALL_PRE_AUTH_DENIED",
      { callControlId, estimatedCost, walletBalance },
      undefined,
      callControlId
    );
    return { authorized: false, estimatedCost, heldAmount: 0, reason: "INSUFFICIENT_FUNDS", planName: plan.name, walletBalance };
  }

  await logAppCallDecision(
    organizationId,
    null,
    "CALL_RESERVED",
    { callControlId, estimatedCost, holdAmount, planId: plan.id },
    undefined,
    callControlId
  );

  return { authorized: true, reservationId, estimatedCost, heldAmount: holdAmount, planName: plan.name, walletBalance };
}

/**
 * Minutes PSTN réellement consommées pour rapport (agrégat des CallLog COMPLETED).
 * Conservé à titre informatif ; l'autorité de facturation des minutes incluses est
 * le compteur atomique `Organization.minutesUsedThisMonth`.
 */
export async function usedPstnMinutes(organizationId: string): Promise<number> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { usageResetDate: true },
  });
  const since = org?.usageResetDate ?? new Date(0);

  const agg = await prisma.callLog.aggregate({
    where: {
      organizationId,
      status: { in: ["COMPLETED"] },
      endedAt: { gte: since },
    },
    _sum: { duration: true },
  });

  return (agg._sum.duration ?? 0) / MINUTES_DIVISOR;
}

/**
 * Libération ATOMIQUE et IDEMPOTENTE d'une réservation.
 * Appelée pour NO_ANSWER / BUSY / FAILED / CANCELLED / duration=0, ou si l'appel
 * sortant échoue après réservation.
 *
 *  - Transition PENDING → RELEASED et remboursement de `reservation.amount`
 *    (le montant réellement pré-déduit) DANS LA MÊME transaction.
 *  - Idempotent : n'agit QUE sur une réservation encore PENDING. Si déjà
 *    RELEASED/SETTLED → no-op (aucun double remboursement).
 */
export async function releasePstnReservation(params: {
  organizationId: string;
  callControlId: string;
  callLogId: string;
  reason: string;
}): Promise<boolean> {
  const { organizationId, callControlId, callLogId, reason } = params;
  let released = false;

  await prisma.$transaction(async (tx) => {
    const reservation = await tx.callReservation.findFirst({
      where: { callLogId, status: "PENDING" },
    });
    // Déjà réglée (settled) ou déjà libérée → on ne rembourse RIEN (idempotent).
    if (!reservation) return;

    const amount = reservation.amount.toNumber();
    if (amount > 0) {
      // Remboursement atomique dans la même transaction que le marquage RELEASED.
      await creditWalletAtomically(tx, organizationId, amount);
      // Garde anti-double : un second release concurrent échoue sur l'index unique
      // (callControlId, REFUND) → toute la transaction est annulée.
      await tx.walletTransaction.create({
        data: {
          organizationId,
          amount,
          type: REFUND_TX_TYPE,
          description: `Libération réservation PSTN (${reason})`,
          callControlId,
        },
      });
    }
    await tx.callReservation.update({
      where: { id: reservation.id },
      data: { status: "RELEASED", actualCost: reservation.amount, settledAt: new Date() },
    });
    released = true;
  });

  if (released) {
    await logAppCallDecision(
      organizationId,
      null,
      "CALL_RESERVATION_RELEASED",
      { callControlId, reason },
      undefined,
      callControlId
    );
  }
  return released;
}

/**
 * Règlement (settle) ATOMIQUE et IDEMPOTENT d'un appel PSTN à `call.hangup`.
 *
 * Débits/remboursements :
 *   - minutes incluses consommées atomiquement (compteur gardé) ;
 *   - wallet : réconciliation hold ↔ coût RÉEL via `computeSettleAdjustment` ;
 *     supplément débité avec garde `walletBalance >= amount`, surplus remboursé.
 *
 * Idempotence :
 *   - une seule WalletTransaction `unique_billing_per_call` (SETTLE) par appel →
 *     double settlement annulé (rollback complet, pas de double débit) ;
 *   - si la réservation est déjà RELEASED → on ne débite PAS le wallet ;
 *   - si déjà SETTLED → no-op.
 */
export async function settlePstnCall(params: {
  callControlId: string;
  organizationId: string;
  callLogId: string;
  durationSeconds: number;
  rateProfile?: PstnRateProfile;
}): Promise<SettleResult> {
  const { callControlId, organizationId, callLogId, durationSeconds, rateProfile = "STANDARD" } = params;

  // Idempotence : si déjà facturé (WalletTransaction SETTLE OU CallLog réglé), ne rien refaire.
  const existing = await prisma.walletTransaction.findUnique({
    where: { unique_billing_per_call: { callControlId, type: SETTLE_TX_TYPE } },
  });
  if (existing) {
    return { billed: false, includedMinutesUsed: 0, walletCost: 0, totalCost: 0, heldAmount: 0, refunded: 0, transactionIds: [existing.id] };
  }
  const alreadyBilledCallLog = await prisma.callLog.findUnique({
    where: { id: callLogId },
    select: { isBilled: true },
  });
  if (alreadyBilledCallLog?.isBilled) {
    return { billed: false, includedMinutesUsed: 0, walletCost: 0, totalCost: 0, heldAmount: 0, refunded: 0, transactionIds: [] };
  }

  const [rates, org] = await Promise.all([
    getSystemRates(),
    prisma.organization.findUnique({ where: { id: organizationId }, include: { pricingPlan: true } }),
  ]);
  if (!org) {
    throw new Error("Organization not found for PSTN settle");
  }

  const costPerMinute =
    rateProfile === "AI_AGENT" ? rates.aiAgentRatePerMinute.toNumber() : rates.callRatePerMinute.toNumber();
  const plan = org.pricingPlan;
  const planIdAtCallTime = plan?.id ?? null;
  const includedPerMinute = plan?.includedMinutes ?? 0;
  const totalCost = new Prisma.Decimal(durationSeconds / MINUTES_DIVISOR).mul(costPerMinute);

  const transactionIds: string[] = [];
  let settledReservationId: string | null = null;
  let settledHeldAmount = 0;
  let includedMinutesUsed = 0;
  let walletCost = new Prisma.Decimal(0);
  let refunded = 0;

  await prisma.$transaction(async (tx) => {
    // Source de concurrence n°2 : minutes incluses. On lit le compteur DANS la transaction.
    const usedThisMonth = (await tx.organization.findUnique({
      where: { id: organizationId },
      select: { minutesUsedThisMonth: true },
    }))?.minutesUsedThisMonth ?? 0;

    // 1. Répartition : minutes incluses d'abord (basée sur le compteur atomique).
    const calc = computePstnCost({ durationSeconds, costPerMinute, includedPerMinute, usedThisMonth });
    const includedWanted = calc.includedMinutesUsed;
    // Consommation atomique (garde). En cas de course, recoûte le reste au wallet.
    const includedActuallyUsed = await consumeIncludedMinutes(tx, organizationId, includedPerMinute, includedWanted);
    const walletMinutesUsed = Math.max(durationSeconds / MINUTES_DIVISOR - includedActuallyUsed, 0);
    walletCost = new Prisma.Decimal(walletMinutesUsed).mul(costPerMinute);
    includedMinutesUsed = includedActuallyUsed;

    // 2. Réservation : état et montant réellement retenu.
    const reservation = await tx.callReservation.findFirst({ where: { callLogId, status: "PENDING" } });
    if (!reservation) {
      // Réservation déjà libérée (RELEASED) → on ne débite PAS le wallet.
      // ou non-PENDING. On marque quand même le CallLog pour la restitution.
      await tx.callLog.update({
        where: { id: callLogId },
        data: {
          cost: totalCost.toDecimalPlaces(4),
          billedAmount: new Prisma.Decimal(0),
          isBilled: true,
          billedAt: new Date(),
          planIdAtCallTime,
        },
      });
      return;
    }

    settledReservationId = reservation.id;
    const heldAmount = reservation.amount.toNumber();
    settledHeldAmount = heldAmount;

    // 3. Réconciliation hold ↔ réel (logique pure, testée).
    const { extraDebit, refund } = computeSettleAdjustment({ heldAmount, actualWalletCost: walletCost.toNumber() });

    // 4. Débit supplémentaire ATOMIQUE avec garde `walletBalance >= amount`.
    if (extraDebit > 0) {
      const ok = await debitWalletAtomically(tx, organizationId, extraDebit);
      if (!ok) {
        throw new Error("INSUFFICIENT_FUNDS");
      }
    }

    // 5. Remboursement du surplus (hold > réel).
    if (refund > 0) {
      await creditWalletAtomically(tx, organizationId, refund);
      refunded = refund;
      await tx.walletTransaction.create({
        data: { organizationId, amount: refund, type: REFUND_TX_TYPE, description: "Ajustement settlement PSTN", callControlId },
      });
    }

    // 6. Enregistrement du coût réel (SETTLE) — clé unique d'idempotence.
    const txRecord = await tx.walletTransaction.create({
      data: {
        organizationId,
        amount: walletCost.neg().toDecimalPlaces(4),
        type: SETTLE_TX_TYPE,
        description: `Facturation appel PSTN (${durationSeconds}s, ${rateProfile})`,
        callControlId,
      },
    });
    transactionIds.push(txRecord.id);

    // 7. Régler la réservation (PENDING → SETTLED).
    await tx.callReservation.update({
      where: { id: reservation.id },
      data: { actualCost: totalCost.toDecimalPlaces(4), status: "SETTLED", settledAt: new Date() },
    });

    // 8. Marquer le CallLog facturé.
    await tx.callLog.update({
      where: { id: callLogId },
      data: {
        cost: totalCost.toDecimalPlaces(4),
        billedAmount: walletCost.toDecimalPlaces(4),
        isBilled: true,
        billedAt: new Date(),
        planIdAtCallTime,
      },
    });
  });

  await logAppCallDecision(
    organizationId,
    null,
    "CALL_BILLED",
    { callControlId, durationSeconds, totalCost: totalCost.toNumber(), walletCost: walletCost.toNumber(), includedMinutesUsed },
    undefined,
    callControlId
  );

  return {
    billed: true,
    includedMinutesUsed,
    walletCost: walletCost.toNumber(),
    totalCost: totalCost.toNumber(),
    heldAmount: settledHeldAmount,
    refunded,
    transactionIds,
    reservationId: settledReservationId,
  };
}
