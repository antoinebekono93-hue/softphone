import { prisma } from "@/lib/prisma";

/**
 * Plan snapshot & fair-use enforcement — Phase 2 (Appels APP_TO_APP).
 *
 * Règles (contractuelles) :
 *  - `unlimitedCalls` ne concerne QUE les appels APP_TO_APP (WebRTC natif P2P).
 *    Il ne supprime JAMAIS le quota, la réservation ou la facturation APP_TO_PSTN
 *    (qui restent gérés par Telnyx / wallet existants).
 *  - Les limites maxCallDurationSeconds / maxConcurrentCalls / maxCallsPerHour /
 *    maxCallsPerDay sont des PROTECTIONS TECHNIQUES / fair-use, PAS le quota
 *    commercial APP_TO_APP. Elles ne transforment jamais unlimitedCalls en quota.
 *  - allowedDestinations/blockedDestinations : "" = aucune restriction configurée.
 */

export type CallPolicyDecision = {
  authorized: boolean;
  reason?: string;
  planName?: string | null;
  planId?: string | null;
  unlimitedCalls: boolean;
  internationalEnabled: boolean;
  // Fair-use (protections techniques) — toujours appliquées
  maxCallDurationSeconds: number;
  maxConcurrentCalls: number;
  maxCallsPerHour: number;
  maxCallsPerDay: number;
  // Concurrence / volumes mesurés
  activeCalls: number;
  callsLastHour: number;
  callsToday: number;
};

const ACTIVE_STATUSES = ["OFFERING", "RINGING", "CONNECTING", "ACTIVE"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/**
 * Évalue la politique d'appel APP_TO_APP pour une organisation au moment T
 * (snapshot du plan) et applique les protections technique / fair-use.
 * N'effectue AUCUNE charge wallet (APP_TO_APP n'est jamais facturé au wallet).
 */
export async function evaluateAppCallPolicy(
  organizationId: string
): Promise<CallPolicyDecision> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { pricingPlan: true },
  });

  const plan = org?.pricingPlan ?? null;
  const now = new Date();

  const [activeCalls, callsLastHour, callsToday] = await Promise.all([
    prisma.appCallSession.count({
      where: { organizationId, status: { in: [...ACTIVE_STATUSES] } },
    }),
    prisma.appCallSession.count({
      where: { organizationId, startedAt: { gte: new Date(now.getTime() - HOUR_MS) } },
    }),
    prisma.appCallSession.count({
      where: { organizationId, startedAt: { gte: new Date(now.getTime() - DAY_MS) } },
    }),
  ]);

  const base = {
    planId: plan?.id ?? null,
    planName: plan?.name ?? null,
    unlimitedCalls: plan?.unlimitedCalls ?? false,
    internationalEnabled: plan?.internationalEnabled ?? false,
    maxCallDurationSeconds: plan?.maxCallDurationSeconds ?? 3600,
    maxConcurrentCalls: plan?.maxConcurrentCalls ?? 1,
    maxCallsPerHour: plan?.maxCallsPerHour ?? 20,
    maxCallsPerDay: plan?.maxCallsPerDay ?? 100,
    activeCalls,
    callsLastHour,
    callsToday,
  };

  if (!org) {
    return { ...base, authorized: false, reason: "ORGANIZATION_NOT_FOUND" };
  }
  if (!plan) {
    return { ...base, authorized: false, reason: "NO_PLAN" };
  }
  if (org.planStatus === "UNPAID" || org.planStatus === "SUSPENDED") {
    return { ...base, authorized: false, reason: "PLAN_INACTIVE" };
  }

  // Fair-use / protections techniques.
  // (La limite `maxConcurrentCalls` est appliquée de façon ATOMIQUE dans
  // app-call-session.ts — SERIALIZABLE + retry — pas ici : compter puis créer ici
  // laisserait une fenêtre de course. Seules les limites par volume horaire /
  // journalier restent ici, suffisantes pour le fair-use.)
  if (callsLastHour >= base.maxCallsPerHour) {
    return { ...base, authorized: false, reason: "MAX_CALLS_PER_HOUR" };
  }
  if (callsToday >= base.maxCallsPerDay) {
    return { ...base, authorized: false, reason: "MAX_CALLS_PER_DAY" };
  }

  // APP_TO_APP commercial-unlimited : pas de contrôle wallet ici.
  return { ...base, authorized: true };
}

/**
 * Créé l'entrée UsageLog correspondant à une décision (audit trail).
 */
export async function logAppCallDecision(
  organizationId: string,
  userId: string | null,
  action: string,
  details: Record<string, unknown>,
  destination?: string | null,
  callControlId?: string | null
) {
  try {
    await prisma.usageLog.create({
      data: {
        organizationId,
        userId,
        action,
        destination: destination ?? undefined,
        callControlId: callControlId ?? undefined,
        details: details as any,
      },
    });
  } catch (err) {
    // L'audit ne doit pas bloquer le flux d'appel
    console.error("[app-call-policy] usageLog failed", err);
  }
}

export { ACTIVE_STATUSES as APP_CALL_ACTIVE_STATUSES };
