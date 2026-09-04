import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Service de transition/concurrence des sessions d'appel APP_TO_APP.
 *
 * GARDE ANTI-RACE (sans migration DB) :
 *  - On rejette le motif "count() puis create()" qui laisse une fenêtre de
 *    course. À la place, la vérification d'occupation + la création de la
 *    session + l'incrément `activeCallsCount` sont exécutés dans une MÊME
 *    transaction SERIALIZABLE, avec RETRY sur les échecs de sérialisation
 *    (Prisma P2034).
 *  - En SERIALIZABLE, deux transactions qui lisent puis écrivent les mêmes
 *    lignes n'aboutissent pas en même temps : l'une est annulée, on retente et
 *    on relit l'état frais → un seul appel approuvé.
 *
 * Limite documentée : sans contrainte DB unique, la garantie repose sur
 * l'isolation SERIALIZABLE. Une future migration Nhost pourra ajouter une
 * contrainte partielle (ex : UNIQUE sur (calleeId) WHERE status IN actifs) pour
 * un verrou encore plus fort ; documenté, non créé maintenant.
 */

const BUSY_STATUSES = ["OFFERING", "RINGING", "CONNECTING", "ACTIVE"] as const;
const TERMINAL = ["ENDED", "MISSED", "DECLINED", "FAILED"] as const;

export type CreateSessionResult =
  | { status: "CREATED"; sessionId: string }
  | {
      status: "BUSY";
      reason:
        | "CALLEE_BUSY"
        | "CALLER_BUSY"
        | "ORGANIZATION_MAX_CONCURRENT"
        | "SERIALIZATION_CONFLICT";
    };

const MAX_RETRIES = 5;

/**
 * Crée une session APP_TO_APP de façon ATOMIQUE (garde anti-race).
 *
 * @param args.callerId utilisateur appelant (authentifié).
 * @param args.calleeId utilisateur appelé (résolu côté serveur).
 * @param args.organizationId organisation des deux participants.
 * @param args.maxConcurrentCalls limite fair-use de l'organisation (>=1).
 */
export async function createAppCallSession(args: {
  callerId: string;
  calleeId: string;
  organizationId: string;
  maxConcurrentCalls: number;
}): Promise<CreateSessionResult> {
  const { callerId, calleeId, organizationId, maxConcurrentCalls } = args;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      const created = await prisma.$transaction(
        async (tx) => {
          // Comptage des sessions ACTIVES impliquant le callee OU le caller.
          const activeForCallee = await tx.appCallSession.count({
            where: {
              organizationId,
              status: { in: [...BUSY_STATUSES] },
              OR: [{ callerId: calleeId }, { calleeId: calleeId }],
            },
          });
          if (activeForCallee > 0) {
            return { status: "BUSY", reason: "CALLEE_BUSY" } as const;
          }

          const activeForCaller = await tx.appCallSession.count({
            where: {
              organizationId,
              status: { in: [...BUSY_STATUSES] },
              OR: [{ callerId: callerId }, { calleeId: callerId }],
            },
          });
          if (activeForCaller > 0) {
            return { status: "BUSY", reason: "CALLER_BUSY" } as const;
          }

          // Fair-use : limite de sessions actives de l'organisation.
          const orgActive = await tx.appCallSession.count({
            where: { organizationId, status: { in: [...BUSY_STATUSES] } },
          });
          if (orgActive >= maxConcurrentCalls) {
            return { status: "BUSY", reason: "ORGANIZATION_MAX_CONCURRENT" } as const;
          }

          const session = await tx.appCallSession.create({
            data: {
              callType: "APP_TO_APP",
              status: "OFFERING",
              callerId,
              calleeId,
              organizationId,
            },
            select: { id: true },
          });

          // Incrément du compteur d'appels actifs (fair-use), dans la même tx.
          await tx.organization.update({
            where: { id: organizationId },
            data: { activeCallsCount: { increment: 1 } },
          });

          return { status: "CREATED", sessionId: session.id } as const;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10000 }
      );

      return created;
    } catch (err) {
      // P2034 = serialization failure → on retente avec lecture fraîche.
      const serialized = isSerializationFailure(err);
      if (attempt < MAX_RETRIES && serialized) {
        continue;
      }
      // Toute autre erreur ou après épuisement des retries : on signale un
      // conflit de sérialisation (pas un crash) pour que le demandeur recoive
      // BUSY et termine proprement la tentative.
      return { status: "BUSY", reason: "SERIALIZATION_CONFLICT" };
    }
  }
  return { status: "BUSY", reason: "SERIALIZATION_CONFLICT" };
}

export function isSerializationFailure(err: unknown): boolean {
  const e = err as { code?: string } | null;
  return e?.code === "P2034";
}

// ── Timeout de sonnerie (M4) ────────────────────────────────────────────────
// Une session qui n'a jamais atteint ACTIVE (OFFERING / RINGING / CONNECTING)
// et qui dépasse RING_TIMEOUT_MS est considérée MISSED (appel non répond).
// Le timeout est IDEMPOTENT (guard updateMany) et libère activeCallsCount.
export const RING_TIMEOUT_MS = 60_000; // 60 s de sonnerie avant MISSED

export type ExpiredSession = {
  sessionId: string;
  callerId: string;
  calleeId: string;
  organizationId: string;
  status: string;
};

const RINGING_STATUSES = ["OFFERING", "RINGING", "CONNECTING"] as const;

/**
 * Expire les sessions de sonnerie devenues obsolètes. IDEMPOTENT : un coup
 * d'oeil concurrent ne déclenche pas de double transition car le passage à MISSED
 * est fait via `updateMany` conditionnel — seule la transaction dont le WHERE
 * matche décrémente le compteur.
 *
 * Renvoie la liste des sessions expirées (pour notifier le peer via Pusher).
 */
export async function expireStaleRingingSessions(args?: {
  now?: Date;
}): Promise<ExpiredSession[]> {
  const now = args?.now ?? new Date();
  const cutoff = new Date(now.getTime() - RING_TIMEOUT_MS);
  const expired: ExpiredSession[] = [];
  let cursor: string | null = null;
  const page = 100;

  type DirtyRow = {
    id: string;
    callerId: string;
    calleeId: string;
    organizationId: string;
    status: string;
  };

  for (;;) {
    const sessions: DirtyRow[] = await prisma.appCallSession.findMany({
      where: {
        status: { in: [...RINGING_STATUSES] },
        startedAt: { lt: cutoff },
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      select: { id: true, callerId: true, calleeId: true, organizationId: true, status: true },
      orderBy: { id: "asc" },
      take: page,
    });
    if (sessions.length === 0) break;

    for (const s of sessions) {
      const res = await prisma.appCallSession.updateMany({
        where: { id: s.id, status: { in: [...RINGING_STATUSES] } },
        data: { status: "MISSED", endedAt: now, durationSeconds: 0 },
      });
      if (res.count === 1) {
        await prisma.organization.update({
          where: { id: s.organizationId },
          data: { activeCallsCount: { decrement: 1 } },
        });
        expired.push({
          sessionId: s.id,
          callerId: s.callerId,
          calleeId: s.calleeId,
          organizationId: s.organizationId,
          status: s.status,
        });
      }
    }
    cursor = sessions[sessions.length - 1].id;
  }

  return expired;
}

export { BUSY_STATUSES as APP_CALL_BUSY_STATUSES };
export { TERMINAL as APP_CALL_TERMINAL_STATUSES };
export { RINGING_STATUSES as APP_CALL_RINGING_STATUSES };
