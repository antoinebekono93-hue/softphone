/**
 * Couche PURE de négociation WebRTC APP_TO_APP — Perfect Negotiation.
 *
 * Ces fonctions sont DÉPOURVUES de toute dépendance navigateur / Prisma : elles
 * peuvent être testées unitairement sans RTCPeerConnection (scripts/test-*).
 *
 * Elles modélisent :
 *  - le rôle WebRTC polite/impolite DÉTERMINISTE (basé sur les IDs, identiques
 *    des deux côtés — jamais un état local aléatoire) ;
 *  - la décision face à une offre entrante en cas de collision ;
 *  - la validité d'une description distante selon signalingState ;
 *  - la décision pour un candidat ICE (queue vs apply vs ignore).
 *
 * Le rôle MÉTIER caller/callee n'est PAS le rôle WebRTC polite/impolite.
 */

/**
 * Détermine de façon DÉTERMINISTE si ce pair est "polite" dans la négociation.
 * Règle stable : le pair dont l'identifiant est "plus petit" au sens ordinal est
 * polite. Comme les deux navigateurs comparent les MÊMES IDs, le résultat est
 * identique des deux côtés (aucune divergence possible).
 */
export function isPolitePair({
  myId,
  peerId,
}: {
  myId: string;
  peerId: string;
}): boolean {
  if (!myId || !peerId) return false;
  return myId.localeCompare(peerId) < 0;
}

/** États signaling pertinents pour la négociation. */
export const SIGNALING_STATES = {
  STABLE: "stable",
  HAVE_LOCAL_OFFER: "have-local-offer",
  HAVE_REMOTE_OFFER: "have-remote-offer",
  CLOSED: "closed",
} as const;

export type OfferDecision = "apply" | "ignore" | "rollback";

/**
 * Prise de décision face à une OFFRE ENTRANTE (algorithme Perfect Negotiation).
 *
 * - Pas de collision (signalingState "stable") → toujours appliquer.
 * - Collision (une offre est déjà en vol) :
 *     . pair impolite → on perd, on ROLLBACK (annuler notre description locale)
 *       puis on trait la nouvelle offre ;
 *     . pair polite → on laisse la nouvelle offre "gagner", on l'applique.
 *
 * Note : "collision" signifie ici signalingState !== "stable". L'appelant peut
 * fournir `collision` explicitement (simplifie le test pur sans fake de PC).
 */
export function decideIncomingOffer({
  signalingState,
  polite,
  collision,
}: {
  signalingState: string;
  polite: boolean;
  collision?: boolean;
}): OfferDecision {
  const isCollision = collision ?? signalingState !== SIGNALING_STATES.STABLE;
  if (!isCollision) return "apply";
  return polite ? "apply" : "rollback";
}

/**
 * Indique si une description distante (offer OU answer) est valide à appliquer.
 * Une réponse ne doit jamais être appliquée si elle correspond à une négociation
 * devenue invalide (session terminale ou PC "closed").
 */
export function canApplyRemoteDescription({
  signalingState,
  sessionTerminal,
}: {
  signalingState: string;
  sessionTerminal: boolean;
}): boolean {
  if (sessionTerminal) return false;
  if (signalingState === SIGNALING_STATES.CLOSED) return false;
  return true;
}

/**
 * Garde anti-collision d'initiation d'offre : un seul `createOffer` en vol à la
 * fois (variable `makingOffer` du Perfect Negotiation).
 */
export function canMakeOffer({ makingOffer }: { makingOffer: boolean }): boolean {
  return !makingOffer;
}

export type IceDecision = "queue" | "apply" | "ignore";

/**
 * Décision pour un candidat ICE reçu :
 *  - session terminale ou PC fermé → "ignore" (candidat tardif).
 *  - pas encore de description distante → "queue" (trickle ICE).
 *  - description distante en place → "apply" directement.
 */
export function decideIceCandidate({
  signalingState,
  remoteDescriptionPresent,
  sessionTerminal,
}: {
  signalingState: string;
  remoteDescriptionPresent: boolean;
  sessionTerminal: boolean;
}): IceDecision {
  if (sessionTerminal || signalingState === SIGNALING_STATES.CLOSED) {
    return "ignore";
  }
  if (!remoteDescriptionPresent) return "queue";
  return "apply";
}

// ── ICE Restart ─────────────────────────────────────────────────────────────

export const ICE_RESTART_MAX_ATTEMPTS = 2;

/**
 * Indique si un ICE restart est autorisé.
 *
 * Conditions :
 *  - pas déjà en cours de restart (concurrence)
 *  - pas dépassé le maximum de tentatives
 *  - la session n'est pas terminale
 *  - le RTCPeerConnection n'est pas fermé
 */
export function canAttemptIceRestart({
  inProgress,
  attempts,
  maxAttempts,
  sessionTerminal,
  signalingState,
}: {
  inProgress: boolean;
  attempts: number;
  maxAttempts: number;
  sessionTerminal: boolean;
  signalingState: string;
}): boolean {
  if (inProgress) return false;
  if (attempts >= maxAttempts) return false;
  if (sessionTerminal) return false;
  if (signalingState === SIGNALING_STATES.CLOSED) return false;
  return true;
}

/**
 * Détermine si on doit tenter un ICE restart au vu des états ICE/connection.
 *
 * Retourne "restart" si l'état est définitivement échoué et qu'un restart est
 * pertinent, "terminal" si l'appel doit être terminé, ou "wait" si on laisse
 * le navigateur tenter de récupérer (disconnected est transitoire).
 */
export type IceFailureDecision = "restart" | "terminal" | "wait";

export function decideIceFailure({
  iceConnectionState,
  connectionState,
}: {
  iceConnectionState: string;
  connectionState: string;
}): IceFailureDecision {
  if (connectionState === "failed") return "terminal";
  if (iceConnectionState === "failed") return "restart";
  if (iceConnectionState === "disconnected") return "wait";
  if (connectionState === "closed") return "terminal";
  if (iceConnectionState === "closed") return "terminal";
  return "wait";
}
