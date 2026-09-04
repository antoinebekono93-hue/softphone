/**
 * Tests de la logique PURE de négociation WebRTC APP_TO_APP (lib/webrtc-negotiation.ts).
 * Exécution : npx tsx scripts/test-webrtc-negotiation.ts
 *
 * Couvre : isPolitePair, decideIncomingOffer, canApplyRemoteDescription,
 * canMakeOffer, decideIceCandidate.
 */

import {
  isPolitePair,
  decideIncomingOffer,
  canApplyRemoteDescription,
  canMakeOffer,
  decideIceCandidate,
  canAttemptIceRestart,
  decideIceFailure,
  ICE_RESTART_MAX_ATTEMPTS,
  SIGNALING_STATES,
} from "../lib/webrtc-negotiation";

let failures = 0;
let passed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}`);
  }
};

const S = SIGNALING_STATES;

// ── isPolitePair ────────────────────────────────────────────────────────────

check(
  "pair déterministe : A < B → A polite",
  isPolitePair({ myId: "user-a", peerId: "user-b" }) === true
);

check(
  "pair déterministe : B > A → B impolite",
  isPolitePair({ myId: "user-b", peerId: "user-a" }) === false
);

check(
  "pair symétrique : même résultat des deux côtés",
  isPolitePair({ myId: "user-a", peerId: "user-b" }) ===
    !isPolitePair({ myId: "user-b", peerId: "user-a" })
);

check(
  "pair avec id vide → false (jamais polite)",
  isPolitePair({ myId: "", peerId: "user-b" }) === false
);

check(
  "pair avec peerId vide → false",
  isPolitePair({ myId: "user-a", peerId: "" }) === false
);

check(
  "pair avec les deux ids vides → false",
  isPolitePair({ myId: "", peerId: "" }) === false
);

check(
  "pair avec même id → false (pas de comparaison stricte)",
  isPolitePair({ myId: "user-a", peerId: "user-a" }) === false
);

// ── decideIncomingOffer ─────────────────────────────────────────────────────

check(
  "pas de collision → appliquer",
  decideIncomingOffer({ signalingState: S.STABLE, polite: true }) === "apply"
);

check(
  "pas de collision (impolite) → appliquer",
  decideIncomingOffer({ signalingState: S.STABLE, polite: false }) === "apply"
);

check(
  "collision + polite → appliquer (polite cède)",
  decideIncomingOffer({ signalingState: S.HAVE_LOCAL_OFFER, polite: true }) === "apply"
);

check(
  "collision + impolite → rollback (impolite perd)",
  decideIncomingOffer({ signalingState: S.HAVE_LOCAL_OFFER, polite: false }) === "rollback"
);

check(
  "collision explicite (override) + impolite → rollback",
  decideIncomingOffer({ signalingState: S.STABLE, polite: false, collision: true }) === "rollback"
);

check(
  "collision explicite + polite → apply",
  decideIncomingOffer({ signalingState: S.STABLE, polite: true, collision: true }) === "apply"
);

check(
  "signalingState CLOSED → collision détectée",
  decideIncomingOffer({ signalingState: S.CLOSED, polite: false }) === "rollback"
);

// ── canApplyRemoteDescription ───────────────────────────────────────────────

check(
  "stable, session active → vrai",
  canApplyRemoteDescription({ signalingState: S.STABLE, sessionTerminal: false }) === true
);

check(
  "session terminal → faux",
  canApplyRemoteDescription({ signalingState: S.STABLE, sessionTerminal: true }) === false
);

check(
  "closed → faux",
  canApplyRemoteDescription({ signalingState: S.CLOSED, sessionTerminal: false }) === false
);

check(
  "closed + terminal → faux",
  canApplyRemoteDescription({ signalingState: S.CLOSED, sessionTerminal: true }) === false
);

check(
  "have-local-offer, session active → vrai",
  canApplyRemoteDescription({ signalingState: S.HAVE_LOCAL_OFFER, sessionTerminal: false }) === true
);

// ── canMakeOffer ────────────────────────────────────────────────────────────

check(
  "pas d'offre en cours → vrai",
  canMakeOffer({ makingOffer: false }) === true
);

check(
  "offre en cours → faux",
  canMakeOffer({ makingOffer: true }) === false
);

// ── decideIceCandidate ──────────────────────────────────────────────────────

check(
  "stable, pas de remote desc → queue",
  decideIceCandidate({
    signalingState: S.STABLE,
    remoteDescriptionPresent: false,
    sessionTerminal: false,
  }) === "queue"
);

check(
  "stable, remote desc présente → apply",
  decideIceCandidate({
    signalingState: S.STABLE,
    remoteDescriptionPresent: true,
    sessionTerminal: false,
  }) === "apply"
);

check(
  "session terminal → ignore",
  decideIceCandidate({
    signalingState: S.STABLE,
    remoteDescriptionPresent: true,
    sessionTerminal: true,
  }) === "ignore"
);

check(
  "closed → ignore",
  decideIceCandidate({
    signalingState: S.CLOSED,
    remoteDescriptionPresent: false,
    sessionTerminal: false,
  }) === "ignore"
);

check(
  "closed + terminal → ignore",
  decideIceCandidate({
    signalingState: S.CLOSED,
    remoteDescriptionPresent: true,
    sessionTerminal: true,
  }) === "ignore"
);

check(
  "have-remote-offer, pas de remote desc → queue",
  decideIceCandidate({
    signalingState: S.HAVE_REMOTE_OFFER,
    remoteDescriptionPresent: false,
    sessionTerminal: false,
  }) === "queue"
);

check(
  "have-remote-offer, remote desc présente → apply",
  decideIceCandidate({
    signalingState: S.HAVE_REMOTE_OFFER,
    remoteDescriptionPresent: true,
    sessionTerminal: false,
  }) === "apply"
);

// ── canAttemptIceRestart ────────────────────────────────────────────────────

check(
  "MAX_ICE_RESTART_ATTEMPTS = 2",
  ICE_RESTART_MAX_ATTEMPTS === 2
);

check(
  "1ère restart autorisée (0 tentatives, pas en cours)",
  canAttemptIceRestart({
    inProgress: false,
    attempts: 0,
    maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
    sessionTerminal: false,
    signalingState: S.STABLE,
  }) === true
);

check(
  "2ème restart autorisé (1 tentative, pas en cours)",
  canAttemptIceRestart({
    inProgress: false,
    attempts: 1,
    maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
    sessionTerminal: false,
    signalingState: S.STABLE,
  }) === true
);

check(
  "3ème restart REJETÉ (2 tentatives atteintes)",
  canAttemptIceRestart({
    inProgress: false,
    attempts: 2,
    maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
    sessionTerminal: false,
    signalingState: S.STABLE,
  }) === false
);

check(
  "restart concurrent REJETÉ (déjà en cours)",
  canAttemptIceRestart({
    inProgress: true,
    attempts: 0,
    maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
    sessionTerminal: false,
    signalingState: S.STABLE,
  }) === false
);

check(
  "restart après session terminal REJETÉ",
  canAttemptIceRestart({
    inProgress: false,
    attempts: 0,
    maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
    sessionTerminal: true,
    signalingState: S.STABLE,
  }) === false
);

check(
  "restart sur PC closed REJETÉ",
  canAttemptIceRestart({
    inProgress: false,
    attempts: 0,
    maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
    sessionTerminal: false,
    signalingState: S.CLOSED,
  }) === false
);

check(
  "restart en have-local-offer AUTORISÉ (pas terminal/closed)",
  canAttemptIceRestart({
    inProgress: false,
    attempts: 0,
    maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
    sessionTerminal: false,
    signalingState: S.HAVE_LOCAL_OFFER,
  }) === true
);

check(
  "restart en have-remote-offer AUTORISÉ (pas terminal/closed)",
  canAttemptIceRestart({
    inProgress: false,
    attempts: 0,
    maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
    sessionTerminal: false,
    signalingState: S.HAVE_REMOTE_OFFER,
  }) === true
);

check(
  "canAttemptIceRestart ne bloque PAS sur signalingState non-stable " +
    "(le cleanup du flag inProgress est du ressort du IIFE appelant)",
  canAttemptIceRestart({
    inProgress: false,
    attempts: 0,
    maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
    sessionTerminal: false,
    signalingState: S.HAVE_LOCAL_OFFER,
  }) === true &&
    canAttemptIceRestart({
      inProgress: false,
      attempts: 0,
      maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
      sessionTerminal: false,
      signalingState: S.HAVE_REMOTE_OFFER,
    }) === true
);

// ── decideIceFailure ────────────────────────────────────────────────────────

check(
  "connectionState=failed → terminal",
  decideIceFailure({ iceConnectionState: "connected", connectionState: "failed" }) === "terminal"
);

check(
  "iceConnectionState=failed → restart",
  decideIceFailure({ iceConnectionState: "failed", connectionState: "connected" }) === "restart"
);

check(
  "iceConnectionState=disconnected → wait",
  decideIceFailure({ iceConnectionState: "disconnected", connectionState: "connected" }) === "wait"
);

check(
  "connectionState=closed → terminal",
  decideIceFailure({ iceConnectionState: "closed", connectionState: "closed" }) === "terminal"
);

check(
  "iceConnectionState=closed → terminal",
  decideIceFailure({ iceConnectionState: "closed", connectionState: "new" }) === "terminal"
);

check(
  "iceConnectionState=connected → wait",
  decideIceFailure({ iceConnectionState: "connected", connectionState: "connected" }) === "wait"
);

check(
  "iceConnectionState=new → wait",
  decideIceFailure({ iceConnectionState: "new", connectionState: "new" }) === "wait"
);

check(
  "iceConnectionState=checking → wait",
  decideIceFailure({ iceConnectionState: "checking", connectionState: "connecting" }) === "wait"
);

// ── Résumé ──────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
