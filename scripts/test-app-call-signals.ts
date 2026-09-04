/**
 * Tests de la logique PURE de signaling APP_TO_APP (lib/app-call-signals.ts).
 * Exécution : npx tsx scripts/test-app-call-signals.ts
 *
 * Couvre : isSignalAllowedForState (ordres autorisés selon le rôle et l'état de
 * la session) et buildServerSignal (injection serveur de senderId/toId).
 */

import {
  buildServerSignal,
  isSignalAllowedForState,
  CALL_SIGNAL_TYPES,
} from "../lib/app-call-signals";

let failures = 0;
const check = (name: string, cond: boolean) => {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}`);
  }
};

const S = CALL_SIGNAL_TYPES;

// ── isSignalAllowedForState ─────────────────────────────────────────────────
check(
  "terminal → aucun signal",
  !isSignalAllowedForState({
    sessionStatus: "ENDED",
    isCaller: true,
    signalType: S.HANGUP,
  })
);

check(
  "caller peut envoyer OFFER en OFFERING",
  isSignalAllowedForState({ sessionStatus: "OFFERING", isCaller: true, signalType: S.OFFER })
);
check(
  "le callee NE PEUT PAS envoyer OFFER",
  !isSignalAllowedForState({ sessionStatus: "RINGING", isCaller: false, signalType: S.OFFER })
);

// ── Scénario du bug bloquant : OFFER en CONNECTING ─────────────────────────
// session OFFERING → callee accepte (CONNECTING) → caller envoie CALL_OFFER.
// L'OFFER doit être ACCEPTÉ en CONNECTING pour que le handshake aboutisse.
check(
  "BUG FIX : caller peut envoyer OFFER en CONNECTING",
  isSignalAllowedForState({ sessionStatus: "CONNECTING", isCaller: true, signalType: S.OFFER })
);
check(
  "caller PEUT envoyer OFFER en OFFERING",
  isSignalAllowedForState({ sessionStatus: "OFFERING", isCaller: true, signalType: S.OFFER })
);
check(
  "caller PEUT envoyer OFFER en RINGING",
  isSignalAllowedForState({ sessionStatus: "RINGING", isCaller: true, signalType: S.OFFER })
);
// L'OFFER ne doit JAMAIS être permis hors handshake (ACTIVE ou terminal).
check(
  "caller NE PEUT PAS envoyer OFFER en ACTIVE",
  !isSignalAllowedForState({ sessionStatus: "ACTIVE", isCaller: true, signalType: S.OFFER })
);
check(
  "caller NE PEUT PAS envoyer OFFER en ENDED",
  !isSignalAllowedForState({ sessionStatus: "ENDED", isCaller: true, signalType: S.OFFER })
);
check(
  "caller NE PEUT PAS envoyer OFFER en MISSED",
  !isSignalAllowedForState({ sessionStatus: "MISSED", isCaller: true, signalType: S.OFFER })
);
check(
  "caller NE PEUT PAS envoyer OFFER en DECLINED",
  !isSignalAllowedForState({ sessionStatus: "DECLINED", isCaller: true, signalType: S.OFFER })
);
check(
  "caller NE PEUT PAS envoyer OFFER en FAILED",
  !isSignalAllowedForState({ sessionStatus: "FAILED", isCaller: true, signalType: S.OFFER })
);
// Le callee ne peut TOUJOURS PAS envoyer OFFER (restriction de rôle conservée),
// y compris en CONNECTING.
check(
  "callee NE PEUT PAS envoyer OFFER même en CONNECTING (rôle)",
  !isSignalAllowedForState({ sessionStatus: "CONNECTING", isCaller: false, signalType: S.OFFER })
);

// ── Cohérence : ANSWER / ICE en CONNECTING ─────────────────────────────────
check(
  "CONNECTING + callee + CALL_ANSWER → autorisé",
  isSignalAllowedForState({ sessionStatus: "CONNECTING", isCaller: false, signalType: S.ANSWER })
);
check(
  "CONNECTING + participant + ICE_CANDIDATE → autorisé",
  isSignalAllowedForState({ sessionStatus: "CONNECTING", isCaller: true, signalType: S.ICE_CANDIDATE }) &&
    isSignalAllowedForState({ sessionStatus: "CONNECTING", isCaller: false, signalType: S.ICE_CANDIDATE })
);
check(
  "CONNECTING + callee + CALL_READY → autorisé",
  isSignalAllowedForState({ sessionStatus: "CONNECTING", isCaller: false, signalType: S.READY })
);

check(
  "callee peut envoyer READY en RINGING",
  isSignalAllowedForState({ sessionStatus: "RINGING", isCaller: false, signalType: S.READY })
);
check(
  "caller NE PEUT PAS envoyer READY",
  !isSignalAllowedForState({ sessionStatus: "OFFERING", isCaller: true, signalType: S.READY })
);

check(
  "callee peut envoyer ANSWER en CONNECTING",
  isSignalAllowedForState({ sessionStatus: "CONNECTING", isCaller: false, signalType: S.ANSWER })
);
check(
  "caller NE PEUT PAS envoyer ANSWER",
  !isSignalAllowedForState({ sessionStatus: "RINGING", isCaller: true, signalType: S.ANSWER })
);

check(
  "callee peut ACCEPT en RINGING",
  isSignalAllowedForState({ sessionStatus: "RINGING", isCaller: false, signalType: S.ACCEPT })
);
check(
  "callee peut REJECT en OFFERING",
  isSignalAllowedForState({ sessionStatus: "OFFERING", isCaller: false, signalType: S.REJECT })
);

check(
  "ICE_CANDIDATE autorisé pour les 2 en ACTIVE",
  isSignalAllowedForState({ sessionStatus: "ACTIVE", isCaller: true, signalType: S.ICE_CANDIDATE }) &&
    isSignalAllowedForState({ sessionStatus: "ACTIVE", isCaller: false, signalType: S.ICE_CANDIDATE })
);

check(
  "BUSY toujours INTERDIT côté client (émission serveur)",
  !isSignalAllowedForState({ sessionStatus: "RINGING", isCaller: false, signalType: S.BUSY })
);
check(
  "TIMEOUT toujours INTERDIT côté client (émission serveur)",
  !isSignalAllowedForState({ sessionStatus: "RINGING", isCaller: true, signalType: S.TIMEOUT })
);

check(
  "HANGUP autorisé des deux côtés avant terminal",
  isSignalAllowedForState({ sessionStatus: "ACTIVE", isCaller: true, signalType: S.HANGUP }) &&
    isSignalAllowedForState({ sessionStatus: "RINGING", isCaller: false, signalType: S.HANGUP })
);

// ── buildServerSignal ───────────────────────────────────────────────────────
const sig = buildServerSignal({
  sessionId: "call1",
  senderId: "u-callee",
  peerId: "u-caller",
  payload: { type: S.READY },
});
check("senderId authentifié positionné par le serveur", sig.senderId === "u-callee");
check("toId = peer authentifié", sig.toId === "u-caller");
check("sessionId conservé", sig.sessionId === "call1");
check("timestamp présent", typeof sig.timestamp === "number" && sig.timestamp > 0);
check("type du payload propagé", sig.type === S.READY && sig.payload.type === S.READY);

console.log("");
console.log(
  failures === 0
    ? "TOUS LES TESTS PASSENT"
    : `${failures} TEST(S) EN ÉCHEC`
);
process.exit(failures === 0 ? 0 : 1);
