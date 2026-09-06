/**
 * Couche PURE de gestion média/audio WebRTC APP_TO_APP.
 *
 * Équivalent de lib/webrtc-negotiation.ts pour la partie MÉDIA :
 * ces fonctions sont DÉPOURVUES de toute dépendance navigateur / DOM : elles
 * peuvent être testées unitairement sans getUserMedia ni RTCPeerConnection
 * (scripts/test-webrtc-media.ts).
 *
 * Elles modélisent :
 *  - la classification des erreurs getUserMedia (permission / dispositif) ;
 *  - la décision d'ajouter une piste locale (anti-doublon, anti-PC fermé) ;
 *  - l'application du mode muet sur les pistes audio ;
 *  - la décision de rejouer / détacher le flux audio distant.
 */

/** Erreurs getUserMedia normalisées (mappées sur les constantes navigateur). */
export type MediaErrorKind =
  | "permission-denied"
  | "not-found"
  | "not-readable"
  | "in-use"
  | "abort"
  | "unknown";

export const MEDIA_ERROR_CODES = {
  NOT_ALLOWED: "NotAllowedError",
  PERMISSION_DENIED: "PermissionDeniedError",
  NOT_FOUND: "NotFoundError",
  DEVICES_NOT_FOUND: "DevicesNotFoundError",
  NOT_READABLE: "NotReadableError",
  TRACK_START_UNSUPPORTED: "TrackStartUnsupported",
  IN_USE: "InUseError",
  ABORT: "AbortError",
} as const;

/**
 * Classifie une erreur getUserMedia en catégorie normalisée.
 * Robuste : lit `err.name`, avec repli sur `err.message`, et traitement des
 * DOMException/Overconstrained quelles que soient les variations entre
 * navigateurs.
 */
export function classifyGetUserMediaError(err: unknown): MediaErrorKind {
  const name =
    (err as DOMException)?.name ||
    (err as { message?: string })?.message ||
    "";
  if (
    name.includes(MEDIA_ERROR_CODES.NOT_ALLOWED) ||
    name.includes(MEDIA_ERROR_CODES.PERMISSION_DENIED) ||
    name.toLowerCase().includes("permission")
  ) {
    return "permission-denied";
  }
  if (
    name.includes(MEDIA_ERROR_CODES.NOT_FOUND) ||
    name.includes(MEDIA_ERROR_CODES.DEVICES_NOT_FOUND)
  ) {
    return "not-found";
  }
  if (name.includes(MEDIA_ERROR_CODES.NOT_READABLE)) {
    return "not-readable";
  }
  if (name.includes(MEDIA_ERROR_CODES.IN_USE) || name.includes("in use")) {
    return "in-use";
  }
  if (name.includes(MEDIA_ERROR_CODES.ABORT)) {
    return "abort";
  }
  return "unknown";
}

/**
 * Produit un failReason métier exploitable en fonction de la catégorie d'erreur.
 * Utilisé pour terminer proprement la session (jamais de blocage en CONNECTING).
 */
export function mediaFailReason(kind: MediaErrorKind): string {
  switch (kind) {
    case "permission-denied":
      return "microphone permission denied";
    case "not-found":
      return "microphone device not found";
    case "not-readable":
      return "microphone busy or not readable";
    case "in-use":
      return "microphone already in use";
    case "abort":
      return "microphone request aborted";
    default:
      return "microphone access failed";
  }
}

/** Libellé français destiné à l'affichage UI (toast). */
export function mediaErrorMessage(kind: MediaErrorKind): string {
  switch (kind) {
    case "permission-denied":
      return "Microphone refusé : autorisez l'accès au micro dans votre navigateur";
    case "not-found":
      return "Aucun microphone détecté sur cet appareil";
    case "not-readable":
      return "Microphone indisponible (utilisé par une autre application)";
    case "in-use":
      return "Microphone déjà utilisé par une autre application";
    case "abort":
      return "Demande de micro annulée";
    default:
      return "Impossible d'accéder au microphone";
  }
}

/**
 * Décide s'il faut ajouter une piste locale au PeerConnection.
 * Refuse si :
 *  - le PC est fermé ("closed" / "failed") ;
 *  - une piste de même kind est déjà attachée (anti-doublon, anti multi-micro).
 */
export function shouldAddTrack({
  pcState,
  alreadyHasAudioTrack,
}: {
  pcState: string;
  alreadyHasAudioTrack: boolean;
}): boolean {
  if (pcState === "closed" || pcState === "failed") return false;
  if (alreadyHasAudioTrack) return false;
  return true;
}

/**
 * Applique l'état muet sur les pistes audio uniquement.
 * N'affecte QUE `track.enabled` : jamais la PeerConnection, jamais le signaling,
 * jamais l'état de session. Ne touche jamais aux pistes non-audio (vidéo, etc).
 */
export function setAudioTracksEnabled(
  tracks: MediaStreamTrack[],
  enabled: boolean
): void {
  for (const track of tracks) {
    if (track.kind === "audio") {
      track.enabled = enabled;
    }
  }
}

/**
 * Décision de lecture d'un flux audio distant (autoplay / récupération).
 *
 * - Si un flux est fourni et non fermé → "play" (tentative de lecture).
 * - Si state de session n'est pas connecté/actif → "detach" (ne pas jouer
 *   d'audio quand la session est terminale : privacy).
 * - Sinon → "idle".
 */
export type RemoteAudioDecision = "play" | "detach" | "idle";

export function decideRemoteAudio({
  streamPresent,
  streamEnded,
  sessionActive,
}: {
  streamPresent: boolean;
  streamEnded: boolean;
  sessionActive: boolean;
}): RemoteAudioDecision {
  if (!streamPresent || streamEnded) return "detach";
  if (!sessionActive) return "detach";
  return "play";
}
