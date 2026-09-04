/**
 * Protocole de signaling APP_TO_APP — messages TYPÉS du canal d'appel.
 *
 * Architecture de sécurité :
 *  - `senderId` reçu du navigateur n'est JAMAIS utilisé comme preuve d'identité.
 *    Le serveur détermine l'expéditeur depuis auth() et l'injecte lui-même.
 *  - Le client n'émet PAS directement sur le canal d'appel : il POSTe un signal
 *    sur `/api/app-calls/[id]/signal` ; le serveur valide (participant, org,
 *    session non terminale, ordre) puis publie sur Pusher. Donc le signal
 *    reçu par le pair est structurellement authentique (signé par le serviur).
 *  - Structure générique : { type, sessionId, senderId, toId, timestamp, payload }.
 *    `senderId`/`toId` sont positionnés côté serveur, jamais copiés du navigateur.
 *
 * L'audio ne transite jamais ici : ce module ne concerne QUE le signaling.
 */

export const CALL_SIGNAL_TYPES = {
  READY: "CALL_READY", // handshake : le callee a monté son RTCPeerConnection
  OFFER: "CALL_OFFER", // caller -> offer SDP
  ACCEPT: "CALL_ACCEPT", // callee -> acceptation (déclenchée, pas encore connecté)
  REJECT: "CALL_REJECT", // callee -> refus
  ANSWER: "CALL_ANSWER", // callee -> answer SDP
  ICE_CANDIDATE: "ICE_CANDIDATE", // échange de candidats ICE
  HANGUP: "CALL_HANGUP", // raccrochage
  BUSY: "CALL_BUSY", // le destinataire est déjà occupé
  TIMEOUT: "CALL_TIMEOUT", // sonnerie expirée côté serveur
  FAILED: "CALL_FAILED", // échec WebRTC / micro
} as const;

export type CallSignalType =
  (typeof CALL_SIGNAL_TYPES)[keyof typeof CALL_SIGNAL_TYPES];

/**
 * Signal candidat reçu du navigateur (PAYLOAD seulement — jamais d'identité
 * de confiance). Champs d'identité (senderId/toId/sessionId) sont absents ici :
 * ils sont injectés par le serveur.
 */
export type SignalPayload =
  | { type: typeof CALL_SIGNAL_TYPES.READY }
  | { type: typeof CALL_SIGNAL_TYPES.OFFER; sdp: RTCSessionDescriptionInit }
  | { type: typeof CALL_SIGNAL_TYPES.ACCEPT }
  | { type: typeof CALL_SIGNAL_TYPES.REJECT; reason?: string }
  | { type: typeof CALL_SIGNAL_TYPES.ANSWER; sdp: RTCSessionDescriptionInit }
  | { type: typeof CALL_SIGNAL_TYPES.ICE_CANDIDATE; candidate: RTCIceCandidateInit }
  | { type: typeof CALL_SIGNAL_TYPES.HANGUP; reason?: string }
  | { type: typeof CALL_SIGNAL_TYPES.BUSY; reason?: string }
  | { type: typeof CALL_SIGNAL_TYPES.TIMEOUT; reason?: string }
  | { type: typeof CALL_SIGNAL_TYPES.FAILED; reason?: string };

/**
 * Signal complet tel que publié par le serveur sur le canal d'appel.
 * senderId/toId/sessionId sont AUTHENTIFIÉS (posés par le serveur).
 */
export interface CallSignal {
  type: CallSignalType;
  sessionId: string;
  senderId: string; // authentifié côté serveur
  toId: string; // destinataire (autre participant) — authentifié côté serveur
  timestamp: number;
  payload: SignalPayload;
}

/**
 * Construit un signal authentifié à destination du pair, à partir du signal
 * reçu, de la session et de l'expéditeur authentifié. PURE.
 */
export function buildServerSignal(args: {
  sessionId: string;
  senderId: string; // identité authentifiée (auth())
  peerId: string; // autre participant
  payload: SignalPayload;
}): CallSignal {
  const { sessionId, senderId, peerId, payload } = args;
  return {
    type: payload.type,
    sessionId,
    senderId,
    toId: peerId,
    timestamp: Date.now(),
    payload,
  };
}

/**
 * Valide que le type de signal reçu est autorisé pour la session dans son état
 * courant. Empêche les signaux incohérents (ex : OFFER dans un état terminal,
 * ANSWER d'un non-callee...) côté serveur. PURE — testable.
 *
 * @param sessionStatus status actuel de la session en base.
 * @param isCaller       true si l'expéditeur authentifié est le caller.
 * @param signalType     type de signal reçu.
 */
export function isSignalAllowedForState(args: {
  sessionStatus: string;
  isCaller: boolean;
  signalType: CallSignalType;
}): boolean {
  const { sessionStatus, isCaller, signalType } = args;

  const isTerminal = ["ENDED", "MISSED", "DECLINED", "FAILED"].includes(sessionStatus);
  if (isTerminal) return false;

  switch (signalType) {
    case CALL_SIGNAL_TYPES.READY:
      // Le callee signale qu'il a monté son PC (état OFFERING/RINGING/CONNECTING).
      return !isCaller && ["OFFERING", "RINGING", "CONNECTING"].includes(sessionStatus);
    case CALL_SIGNAL_TYPES.OFFER:
      // Offer envoyé par le CALLER pendant le handshake. La session passe à
      // CONNECTING dès que le callee accepte (avant que le caller n'émette son
      // offer) : l'OFFER doit donc rester permis en OFFERING, RINGING et
      // CONNECTING, mais JAMAIS après ACTIVE (où seul ICE/HANGUP/ENDED sont
      // permis) ni dans un état terminal.
      return isCaller && ["OFFERING", "RINGING", "CONNECTING"].includes(sessionStatus);
    case CALL_SIGNAL_TYPES.ACCEPT:
      // Acceptation par le callee.
      return !isCaller && ["RINGING", "OFFERING"].includes(sessionStatus);
    case CALL_SIGNAL_TYPES.REJECT:
      // Refus par le callee.
      return !isCaller && ["RINGING", "OFFERING"].includes(sessionStatus);
    case CALL_SIGNAL_TYPES.ANSWER:
      // Answer SDP par le callee.
      return !isCaller && ["OFFERING", "RINGING", "CONNECTING"].includes(sessionStatus);
    case CALL_SIGNAL_TYPES.ICE_CANDIDATE:
      // Les deux participants échangent des candidats une fois le handshake lancé.
      return ["OFFERING", "RINGING", "CONNECTING", "ACTIVE"].includes(sessionStatus);
    case CALL_SIGNAL_TYPES.HANGUP:
      // L'un ou l'autre peut raccrocher à tout moment avant d'être terminal.
      return true;
    default:
      // BUSY/TIMEOUT/FAILED sont toujours émis par le SERVEUR, jamais par un client.
      return false;
  }
}
