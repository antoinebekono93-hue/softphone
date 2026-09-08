/**
 * Gardes PURES pour l'API de contrôle d'appels PSTN entrants
 * (`/api/telnyx/answer` et `/api/telnyx/hangup`).
 *
 * Séparées des route handlers pour être testables sans serveur ni DB
 * (import relatif dans les scripts de test). Toute la logique d'autorisation
 * et de validation d'état vit ici :
 *
 *  - isolation multi-tenant : le user n'agit que si le callLog appartient à
 *    SON organisation ET que le destinataire du webhook (assignedUser sinon
 *    membre de l'org) correspond à sa session ;
 *  - anti-replay / double action : les statuts terminaux bloquent answer et
 *    hangup (409 Conflict), et Telnyx rejette lui-même un answer/hangup sur un
 *    appel déjà muté (doublon retourné en 409 côté route).
 */

export const PSTN_TERMINAL_STATUSES = [
  "COMPLETED",
  "NO_ANSWER",
  "FAILED",
  "BUSY",
  "CANCELLED",
] as const;

export const PSTN_ANSWERABLE_STATUSES = ["INITIATED", "RINGING"] as const;

export type PstnAuthorization = "ok" | "no-session" | "not-found" | "forbidden";

export interface PstnCallGuardContext {
  user: { id: string; organizationId?: string | null } | null;
  callLog: {
    organizationId: string;
    status?: string | null;
    phoneNumber?: {
      assignedUser?: { id: string } | null;
    } | null;
  } | null;
}

/**
 * Autorise l'action (answer/hangup) pour le user courant sur ce callLog.
 * Miroir EXACT du routage du webhook `call.initiated` :
 *  - le numéro a un assignedUser  → seul cet utilisateur agit ;
 *  - sinon (fallback 1er user de l'org) → tout membre de l'org agit.
 */
export function authorizePstnCallAction(ctx: PstnCallGuardContext): PstnAuthorization {
  if (!ctx.user || !ctx.user.id) return "no-session";
  if (!ctx.callLog) return "not-found";

  const assignedUserId = ctx.callLog.phoneNumber?.assignedUser?.id ?? null;

  let allowed = false;
  if (assignedUserId) {
    allowed = assignedUserId === ctx.user.id;
  } else {
    allowed =
      !!ctx.user.organizationId &&
      ctx.user.organizationId === ctx.callLog.organizationId;
  }

  return allowed ? "ok" : "forbidden";
}

export function canAnswerCall(status?: string | null): boolean {
  return (PSTN_ANSWERABLE_STATUSES as readonly string[]).includes(status ?? "");
}

export function canHangupCall(status?: string | null): boolean {
  if (!status) return true;
  return !(PSTN_TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function isValidCallControlId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 200 &&
    !/\s/.test(value.trim())
  );
}