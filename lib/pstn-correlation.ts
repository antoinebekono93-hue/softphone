/**
 * Corrélation pure Pusher (callControlId) ↔ SDK Telnyx (Call object).
 *
 * Le SDK Telnyx v2.27.1 expose l'identifiant Call Control d'un appel sous
 * `call.telnyxIDs.telnyxCallControlId` (getter) et `call.options.telnyxCallControlId`
 * (valeurs liées au `telnyx_call_control_id` des messages invite/ringing/answer).
 *
 * On N'ACCEPTE JAMAIS un Call SDK non corrélé à l'appel PSTN en cours :
 * plusieurs organisations partagent le même credential WebRTC, et un événement
 * SDK d'un autre callControlId concerne un AUTRE appel / tenant.
 *
 * Fonctions 100% pures → testables sans serveur (scripts/test-pstn-incoming.ts).
 */

export type SdkCallState = string | undefined;

export interface SdkCallLike {
  id?: string;
  /** ancien alias utilisé dans TelnyxContext (légacy) */
  callId?: string;
  state?: SdkCallState;
  direction?: string;
  options?: { telnyxCallControlId?: string; [k: string]: unknown } | null;
  telnyxIDs?: { telnyxCallControlId?: string; telnyxSessionId?: string; telnyxLegId?: string } | null;
}

/** Extraction sûre du Call Control ID depuis un objet Call-like. Retourne null si inconnu. */
export function getCallControlId(call: SdkCallLike | null | undefined): string | null {
  if (!call) return null;
  const fromIds = call.telnyxIDs?.telnyxCallControlId;
  const fromOptions = call.options?.telnyxCallControlId;
  const value = fromIds || fromOptions;
  if (typeof value !== "string" || value.length === 0) return null;
  return value;
}

/** Deux objets référencent le même appel Verto (id généré par le SDK / callId legacy). */
export function sameSdkCall(a: SdkCallLike | null | undefined, b: SdkCallLike | null | undefined): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const aId = a.id || a.callId;
  const bId = b.id || b.callId;
  return !!aId && aId === bId;
}

/**
 * Corrélation EXACTE : le Call SDK n'est retenu que si son Call Control ID
 * correspond strictement au callControlId de l'appel PSTN (webhook/Pusher).
 * Toute autre valeur (ou inconnu) → false.
 */
export function correlateIncoming(call: SdkCallLike | null | undefined, expectedCallControlId: string | null | undefined): boolean {
  if (!call || !expectedCallControlId) return false;
  return getCallControlId(call) === expectedCallControlId;
}

/** États terminaux SDK (v2.27.1 : State.Hangup/Destroy/Purge). */
export function isTerminalSdkState(state: SdkCallState): boolean {
  return state === "hangup" || state === "destroy" || state === "purge";
}

/** Classification d'une notification callUpdate → ringing / active / terminated / autre. */
export type SdkCallEventKind = "ringing" | "active" | "terminated" | "other";
export function classifyCallUpdate(call: SdkCallLike | null | undefined): SdkCallEventKind {
  const state = call?.state;
  if (isTerminalSdkState(state)) return "terminated";
  if (state === "active") return "active";
  if (state === "ringing") return "ringing";
  return "other";
}

/**
 * Décision d'acceptation.
 *
 * - `sdk-answer`            : Call SDK corrélé disponible → `call.answer()` (média réel).
 * - `wait-for-sdk`          : aucun Call SDK corrélé encore → attente bornée, puis retenter.
 * - `no-sdk-no-answer`      : délai expiré sans Call SDK corrélé → on NE répond PAS via
 *                             l'API (un 200 Call Control n'apporte AUCUN média navigateur).
 *                             On reste en sonnerie + toast explicite.
 * - `guard-api-answer`      : Call SDK corrélé MAIS `answer()` a échoué → garde serveur
 *                             (lève la sonnerie côté Telnyx). ACTIVE reste piloté par le SDK.
 * - `refuse-no-context`     : aucune corrélation possible (pas de callControlId courant
 *                             ou pas de state ringing) → no-op.
 */
export type AcceptAction =
  | "sdk-answer"
  | "wait-for-sdk"
  | "no-sdk-no-answer"
  | "guard-api-answer"
  | "refuse-no-context";

export interface AcceptDecisionInput {
  /** état courant du client (idle/ringing/connecting/active/…) */
  callState: string;
  /** callControlId de l'appel PSTN courant (null si aucun) */
  expectedCallControlId: string | null;
  /** Call SDK potentiellement corrélé (null si aucun) */
  sdkCall: SdkCallLike | null | undefined;
  /** `call.answer()` a-t-il déjà été tenté/accepté pour CET appel ? */
  alreadyAnswered: boolean;
  /** le portage SDK d'answer a-t-il échoué sur ce Call ? */
  sdkAnswerFailed: boolean;
  /** le Call SDK est-il déjà marqué périmé (cleanup) ? */
  stale: boolean;
  /** le délai borné d'attente d'un Call SDK a-t-il expiré ? */
  waitExpired: boolean;
}

export function decideAcceptAction(input: AcceptDecisionInput): { action: AcceptAction; reason: string } {
  const { callState, expectedCallControlId, sdkCall, alreadyAnswered, sdkAnswerFailed, stale, waitExpired } = input;

  if (callState !== "ringing" && callState !== "connecting") {
    return { action: "refuse-no-context", reason: `state=${callState}` };
  }
  if (!expectedCallControlId) {
    return { action: "refuse-no-context", reason: "no pstn callControlId" };
  }
  if (alreadyAnswered) {
    return { action: "refuse-no-context", reason: "already answered (double-accept guard)" };
  }
  if (stale) {
    return { action: "refuse-no-context", reason: "sdk call marked stale after cleanup" };
  }
  if (sdkCall && correlateIncoming(sdkCall, expectedCallControlId)) {
    if (sdkAnswerFailed) {
      return { action: "guard-api-answer", reason: "sdk answer() threw; server guard only" };
    }
    return { action: "sdk-answer", reason: `correlated=${expectedCallControlId}` };
  }
  if (!waitExpired) {
    return { action: "wait-for-sdk", reason: `awaiting correlated call for ${expectedCallControlId}` };
  }
  // Call SDK jamais apparu/corrélé pendant la période d'attente :
  // répondre via l'API ne créerait AUCUN média dans le navigateur → refus honnête.
  return { action: "no-sdk-no-answer", reason: "no correlated sdk call after wait" };
}

/**
 * Résolution des appels SDK "en attente" (ordre A : Push avant SDK, ou id non encore
 * peuplé au premier callUpdate ringing — le SDK le lie sur les messages ringing/answer).
 *
 * Règle stricte : ne renvoyer un candidat QUE si son callControlId est EXACTEMENT
 * l'attendu. Un candidat dont l'id est encore inconnu reste en attente (on ne répond
 * jamais à un Call non identifié). Deux candidats connus sur le même attendu =
 * anomalie → aucun.
 */
export interface PendingCall {
  call: SdkCallLike;
  /** verto id utilisé comme clé stable */
  key: string;
  controlId: string | null;
  timestamp: number;
}
export interface PendingResolution {
  matched: PendingCall | null;
  /** true si la corrélation est définitivement impossible (pas de MATCH futur) */
  impossible: boolean;
  reason: "matched" | "waiting" | "ambiguous" | "no-candidate";
}

export function resolvePendingIncoming(
  pending: PendingCall[],
  expectedCallControlId: string | null,
  now: number,
  pendingWindowMs: number,
): PendingResolution {
  if (!expectedCallControlId) {
    return { matched: null, impossible: false, reason: "waiting" };
  }

  const live = pending.filter((p) => now - p.timestamp <= pendingWindowMs);

  const exact = live.filter((p) => p.controlId === expectedCallControlId);
  if (exact.length === 1) {
    return { matched: exact[0], impossible: false, reason: "matched" };
  }
  if (exact.length > 1) {
    return { matched: null, impossible: true, reason: "ambiguous" };
  }

  const known = live.filter((p) => p.controlId !== null && p.controlId !== expectedCallControlId);
  const unknown = live.filter((p) => p.controlId === null);

  // Un candidat non identifié est TOUJOURS susceptible de MATCHER plus tard
  // (l'id est lié au message ringing/answer) → on attend.
  if (unknown.length > 0) {
    return { matched: null, impossible: false, reason: "waiting" };
  }
  // Tous les candidats connus ne correspondent pas → aucun MATCH futur possible.
  if (known.length > 0) {
    return { matched: null, impossible: true, reason: "no-candidate" };
  }
  return { matched: null, impossible: false, reason: "no-candidate" };
}

/**
 * pstn:ended : ne ferme QUE l'appel dont le callControlId correspond au courant.
 * ABC ne doit JAMAIS clore DEF (appel suivant). Donne la décision pure.
 */
export function shouldEndIncoming(endedCallControlId: string | null | undefined, currentCallControlId: string | null | undefined): boolean {
  if (!endedCallControlId || !currentCallControlId) return false;
  return endedCallControlId === currentCallControlId;
}

/** Double answer / double accept : un seul `answer()` par appel. */
export function shouldProceedToAnswer(input: { alreadyAnswered: boolean; acceptInFlight: boolean; callUsable: boolean }): boolean {
  const { alreadyAnswered, acceptInFlight, callUsable } = input;
  return !alreadyAnswered && !acceptInFlight && callUsable;
}

/**
 * Un Call SDK est-il encore utilisable (answer/hangup) ?
 * Après un cleanup (hangup/ended/stale), un vieux Call ne doit plus être accepté ni pendu.
 */
export function isCallUsable(call: SdkCallLike | null | undefined, staleControlIds: string[]): boolean {
  if (!call) return false;
  const cc = getCallControlId(call);
  if (cc && staleControlIds.includes(cc)) return false;
  return !isTerminalSdkState(call.state);
}