/**
 * Conventions de canaux Pusher pour les appels APP_TO_APP.
 *
 *  - `private-user-${userId}` : canal privé par utilisateur. Le serveur y pousse
 *    les appels entrants ("app-call:incoming") et les changements d'état.
 *  - `private-call-${callId}`  : canal privé partagé entre les 2 participants.
 *    Utilisé pour le signaling WebRTC (offer/answer/candidate). Les clients ne
 *    déclenchent JAMAIS directement dessus : ils POSTent sur
 *    `/api/app-calls/[id]/signal` et le SERVEUR valide puis publie (M2).
 *
 * Tous les canaux sont privés : leur abonnement passe par /api/pusher/auth qui
 * valide la session et vérifie que l'utilisateur est bien concerné.
 */
export const appCallChannels = {
  user: (userId: string) => `private-user-${userId}`,
  call: (callId: string) => `private-call-${callId}`,
};

export const APP_CALL_EVENTS = {
  INCOMING: "app-call:incoming", // -> callee : nouvelle sonnerie
  ACCEPTED: "app-call:accepted", // -> caller : le callee accepte
  DECLINED: "app-call:declined", // -> caller : le callee refuse
  CANCELLED: "app-call:cancelled", // -> callee : le caller annule
  SIGNAL: "app-call:signal", // signaling WebRTC (SDP / ICE)
  ENDED: "app-call:ended", // -> les deux : fin d'appel
} as const;

/**
 * Events Pusher pour les appels PSTN entrants (via Telnyx SIP).
 *
 * Le webhook Telnyx publie `pstn:incoming` sur le canal privé de
 * l'utilisateur destinataire. Le client TelnyxContext s'y abonne et
 * affiche l'UI d'appel entrant, puis répond via l'API Telnyx.
 *
 * Canal utilisé : même `private-user-{userId}` que les appels APP_TO_APP.
 */
export const PSTN_EVENTS = {
  INCOMING: "pstn:incoming", // -> user : appel PSTN entrant
  ACCEPTED: "pstn:accepted", // -> user : appel accepté (mise à jour état)
  REJECTED: "pstn:rejected", // -> user : appel refusé
  ENDED: "pstn:ended", // -> user : appel terminé
  MISSED: "pstn:missed", // -> user : appel entrant manqué sans message
  VOICEMAIL: "pstn:voicemail", // -> user : nouveau message vocal disponible
} as const;
