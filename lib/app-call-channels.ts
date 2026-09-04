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
