import { randomUUID } from "node:crypto";

/**
 * Politique du dialer de campagnes (Voice) — IDEMPOTENCE + RETRY.
 *
 * Module PUR (aucun Prisma/env) : le worker résout `messageId`/`status` et
 * délègue à ces fonctions pures la construction du `command_id` et la
 * transition de statut de retry.
 */

export const CAMPAIGN_DIALER_STATUSES = ["PENDING", "RETRY_1", "RETRY_2", "RETRY_3"] as const;
export const DIALER_MAX_RETRIES = 3;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Le `messageId` d'un recipient Voice stocke (pendant le retry) l'`attemptId`
 * de la tentative LOGIQUE en cours. Rejoué tel quel lors d'un retry transitoire
 * → même `command_id` → une seule jambe par tentative logique.
 */
export function extractStoredAttemptId(messageId: string | null | undefined): string | null {
  if (typeof messageId === "string" && UUID_RE.test(messageId)) return messageId;
  return null;
}

export function newDialerAttemptId(): string {
  return randomUUID();
}

/**
 * command_id déterministe d'un appel de campagne : identique pour le même
 * attemptId ; différent quand une nouvelle tentative LOGIQUE est initiée.
 */
export function buildCampaignDialCommandId(input: {
  campaignId: string;
  recipientId: string;
  attemptId: string;
}): string {
  if (
    typeof input.campaignId !== "string" || input.campaignId.length === 0 ||
    typeof input.recipientId !== "string" || input.recipientId.length === 0 ||
    typeof input.attemptId !== "string" || input.attemptId.length === 0
  ) {
    throw new Error("buildCampaignDialCommandId: arguments requis");
  }
  return `campaign:${input.campaignId}:${input.recipientId}:${input.attemptId}`;
}

/**
 * Prochaine étape de retry après un échec transitoire. `null` → retries
 * épuisés (le worker passe en FAILED). Le `PENDING` initial est l'essai 1.
 */
export function nextCampaignDialerRetry(current: string): string | null {
  switch (current) {
    case "PENDING":
      return "RETRY_1";
    case "RETRY_1":
      return "RETRY_2";
    case "RETRY_2":
      return "RETRY_3";
    case "RETRY_3":
      return null;
    default:
      return null;
  }
}

/** Rang 0-based de retry (PENDING = essai initial, RETRY_1 = 1er retry). */
export function campaignDialerRetryRank(status: string): number {
  switch (status) {
    case "RETRY_1":
      return 1;
    case "RETRY_2":
      return 2;
    case "RETRY_3":
      return 3;
    default:
      return 0;
  }
}

/**
 * 429, 5xx et l'erreur Telnyx `90103` (DPS) sont TRANSITOIRES → requeue.
 * Les 4xx autres sont permanents → FAILED direct.
 */
export function isTransientDialFailure(
  status: number,
  body: { errors?: Array<{ code?: string }> } | null,
): boolean {
  if (status === 429) return true;
  if (status >= 500 && status < 600) return true;
  const code = Array.isArray(body?.errors) ? body.errors[0]?.code : undefined;
  if (typeof code === "string" && code === "90103") return true;
  return false;
}