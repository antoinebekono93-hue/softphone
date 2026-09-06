/**
 * Tests de la logique PURE de sécurité / anti-abus APP_TO_APP.
 * Exécution : npx tsx scripts/test-app-call-security.ts
 *
 * Couvre :
 *  - validateSignalPayload (input validation : tailles SDP/candidat/payload)
 *  - createTokenBucket / createSignalRateGuard (garde anti-flood + audit borné)
 *  - canApplyStatusTransition (matrice + rôles, anti-replay de transitions)
 *  - shouldForceEndActiveSession (fair-use durée serveur)
 *  - classifyCandidates + MAX_TARGET_LENGTH (input validation routage)
 */

import {
  validateSignalPayload,
  CALL_SIGNAL_TYPES,
  MAX_SDP_CHARS,
  MAX_CANDIDATE_CHARS,
  MAX_REASON_CHARS,
} from "../lib/app-call-signals";
import {
  createTokenBucket,
  createSignalRateGuard,
} from "../lib/rate-limiter";
import {
  canApplyStatusTransition,
  shouldForceEndActiveSession,
} from "../lib/app-call-session";
import {
  classifyCandidates,
  MAX_TARGET_LENGTH,
} from "../lib/call-routing";

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

// ── validateSignalPayload ────────────────────────────────────────────────────
check(
  "READY (sans sdp) → valide",
  validateSignalPayload({ type: S.READY }).valid === true
);
check(
  "OFFER avec sdp string → valide",
  validateSignalPayload({ type: S.OFFER, sdp: "v=0\r\n..." }).valid === true
);
check(
  "ANSWER avec sdp string → valide",
  validateSignalPayload({ type: S.ANSWER, sdp: "v=0\r\n..." }).valid === true
);
check(
  "OFFER sans sdp → invalide (SDP_REQUIRED)",
  (() => {
    const r = validateSignalPayload({ type: S.OFFER });
    return !r.valid && r.reason === "SDP_REQUIRED";
  })()
);
check(
  "OFFER avec sdp non-string → invalide",
  !validateSignalPayload({ type: S.OFFER, sdp: 42 }).valid
);
check(
  "OFFER avec sdp trop long → invalide (SDP_TOO_LARGE)",
  (() => {
    const r = validateSignalPayload({
      type: S.OFFER,
      sdp: "a".repeat(MAX_SDP_CHARS + 1),
    });
    return !r.valid && r.reason === "SDP_TOO_LARGE";
  })()
);
check(
  "ICE_CANDIDATE avec candidate.candidate string → valide",
  validateSignalPayload({
    type: S.ICE_CANDIDATE,
    candidate: { candidate: "candidate:1 1 udp ...", sdpMid: "0", sdpMLineIndex: 0 },
  }).valid === true
);
check(
  "ICE_CANDIDATE sans candidate → invalide",
  !validateSignalPayload({ type: S.ICE_CANDIDATE }).valid
);
check(
  "ICE_CANDIDATE candidate.candidate non-string → invalide",
  !validateSignalPayload({ type: S.ICE_CANDIDATE, candidate: { candidate: 7 } }).valid
);
check(
  "ICE_CANDIDATE candidate.candidate trop long → invalide",
  !validateSignalPayload({
    type: S.ICE_CANDIDATE,
    candidate: { candidate: "a".repeat(MAX_CANDIDATE_CHARS + 1) },
  }).valid
);
check(
  "type inconnu → invalide (UNKNOWN_SIGNAL_TYPE)",
  (() => {
    const r = validateSignalPayload({ type: "CALL_BOGUS" });
    return !r.valid && r.reason === "UNKNOWN_SIGNAL_TYPE";
  })()
);
check(
  "non-objet → invalide",
  !validateSignalPayload("READY").valid && !validateSignalPayload(null).valid
);
check(
  "HANGUP reason trop long → invalide",
  !validateSignalPayload({ type: S.HANGUP, reason: "a".repeat(MAX_REASON_CHARS + 1) })
    .valid
);
check(
  "payload JSON total trop gros → invalide",
  !validateSignalPayload({
    type: S.ICE_CANDIDATE,
    candidate: {
      candidate: "x",
      junk: "a".repeat(300_000),
    },
  }).valid
);

// ── createTokenBucket ────────────────────────────────────────────────────────
const bucket = createTokenBucket({ max: 3, windowMs: 1_000 });
check("bucket : 3 acquisitions sous la limite", bucket.tryConsume("k", 0) && bucket.tryConsume("k", 1) && bucket.tryConsume("k", 2));
check("bucket : 4e acquisition refusée", !bucket.tryConsume("k", 3));
check("bucket : fenêtre expirée → jeton de nouveau disponible", bucket.tryConsume("k", 2_000));
check("bucket : clés indépendantes", bucket.tryConsume("other", 4));
check("bucket : prune vide les clés expirées", (() => { bucket.prune(9_000); return bucket.size() === 0; })());
// 2e bucket scellé : fenêtre coulissante visible.
const sliding = createTokenBucket({ max: 2, windowMs: 10 });
check("bucket scellé : max atteint", sliding.tryConsume("s", 0) && sliding.tryConsume("s", 5) && !sliding.tryConsume("s", 9));
check("bucket scellé : ancien jeton expiré → place", (sliding.tryConsume("s", 11)));

// ── createSignalRateGuard ────────────────────────────────────────────────────
const guard = createSignalRateGuard({ maxPerMinute: 5, logAfterRejections: 3 });
const k = "session:abc";
const allowN = (n: number, start: number) => {
  for (let i = 0; i < n; i++) guard.allow(k, start + i);
};
allowN(5, 1000);
check("garde : 6e signal dans la même fenêtre → refusé", guard.allow(k, 1100) === false);
check("garde : toujours refusé tant que la fenêtre n'a pas glissé", guard.allow(k, 1101) === false);
check(
  "garde : pas de log abuse avant le seuil de refus consécutifs",
  guard.shouldLogAbuse(k, 1200) === false && guard.shouldLogAbuse(k, 1201) === false
);
check(
  "garde : log abuse déclenché au 3e refus consécutif",
  guard.shouldLogAbuse(k, 1202) === true
);
check(
  "garde : cooldown — pas de nouveau log abuse dans la même minute",
  guard.shouldLogAbuse(k, 1300) === false
);
check(
  "garde : fenêtre glissante revenue → autorisé",
  (() => {
    guard.prune(70_000);
    return guard.allow(k, 70_000);
  })()
);

// ── canApplyStatusTransition ─────────────────────────────────────────────────
const tr = canApplyStatusTransition;
const trReason = (r: ReturnType<typeof canApplyStatusTransition>) =>
  r.ok ? null : r.reason;
check("OFFERING → CONNECTING par le callee → ok", tr({ currentStatus: "OFFERING", nextStatus: "CONNECTING", isCaller: false, isCallee: true }).ok);
check("OFFERING → CONNECTING par le caller → FORBIDDEN_ROLE", trReason(tr({ currentStatus: "OFFERING", nextStatus: "CONNECTING", isCaller: true, isCallee: false })) === "FORBIDDEN_ROLE");
check("RINGING → ACTIVE par le callee → ok", tr({ currentStatus: "RINGING", nextStatus: "ACTIVE", isCaller: false, isCallee: true }).ok);
check("RINGING → ACTIVE par le caller → FORBIDDEN_ROLE", trReason(tr({ currentStatus: "RINGING", nextStatus: "ACTIVE", isCaller: true, isCallee: false })) === "FORBIDDEN_ROLE");
check("OFFERING → OFFERING (auto) → INVALID_TRANSITION", trReason(tr({ currentStatus: "OFFERING", nextStatus: "OFFERING", isCaller: true, isCallee: false })) === "INVALID_TRANSITION");
check("ACTIVE → ENDED par le caller → ok", tr({ currentStatus: "ACTIVE", nextStatus: "ENDED", isCaller: true, isCallee: false }).ok);
check("ACTIVE → ENDED par le callee → ok", tr({ currentStatus: "ACTIVE", nextStatus: "ENDED", isCaller: false, isCallee: true }).ok);
check("ENDED → ENDED (replay double-end) → INVALID_TRANSITION", trReason(tr({ currentStatus: "ENDED", nextStatus: "ENDED", isCaller: true, isCallee: true })) === "INVALID_TRANSITION");
check("terminal → n'importe quoi → INVALID_TRANSITION", trReason(tr({ currentStatus: "MISSED", nextStatus: "ACTIVE", isCaller: true, isCallee: false })) === "INVALID_TRANSITION");
check("état inconnu → INVALID_TRANSITION", trReason(tr({ currentStatus: "GARBAGE", nextStatus: "ENDED", isCaller: true, isCallee: true })) === "INVALID_TRANSITION");
check("RINGING → MISSED par le caller → ok (participant)", tr({ currentStatus: "RINGING", nextStatus: "MISSED", isCaller: true, isCallee: false }).ok);
check("CONNECTING → FAILED par le callee → ok", tr({ currentStatus: "CONNECTING", nextStatus: "FAILED", isCaller: false, isCallee: true }).ok);
check("RINGING → DECLINED par le caller → FORBIDDEN_ROLE", trReason(tr({ currentStatus: "RINGING", nextStatus: "DECLINED", isCaller: true, isCallee: false })) === "FORBIDDEN_ROLE");

// ── shouldForceEndActiveSession (fair-use durée serveur) ─────────────────────
const t0 = new Date("2026-01-01T00:00:00Z");
const later = (sec: number) => new Date(t0.getTime() + sec * 1000);
check("durée sous le max → pas de force-end", !shouldForceEndActiveSession({ now: later(3599), connectedAt: t0, startedAt: t0, maxCallDurationSeconds: 3600 }));
check("durée == max → force-end", shouldForceEndActiveSession({ now: later(3600), connectedAt: t0, startedAt: t0, maxCallDurationSeconds: 3600 }));
check("durée > max → force-end", shouldForceEndActiveSession({ now: later(7200), connectedAt: t0, startedAt: t0, maxCallDurationSeconds: 3600 }));
check("base = connectedAt (pas startedAt)", !shouldForceEndActiveSession({ now: later(7000), connectedAt: later(3600), startedAt: t0, maxCallDurationSeconds: 3600 }));
check("connectedAt null → base = startedAt (défensif)", shouldForceEndActiveSession({ now: later(3600), connectedAt: null, startedAt: t0, maxCallDurationSeconds: 3600 }));

// ── classifyCandidates + MAX_TARGET_LENGTH ──────────────────────────────────
check("MAX_TARGET_LENGTH configuré", MAX_TARGET_LENGTH === 300);
const cand = (id: string) => ({
  id,
  name: null,
  email: null,
  callUsername: "alice",
  callExtension: null,
  isCallable: true,
  organizationId: "org1",
});
const failReason = (r: ReturnType<typeof classifyCandidates>) =>
  r.type === "ERROR" ? r.reason : null;
check("cible vide → EMPTY_TARGET", failReason(classifyCandidates({ target: "", callerId: "me", candidates: [] })) === "EMPTY_TARGET");
check("cible trop longue → INVALID_TARGET", failReason(classifyCandidates({ target: "a".repeat(MAX_TARGET_LENGTH + 1), callerId: "me", candidates: [] })) === "INVALID_TARGET");
check("candidat résolu + taille ok → APP_TO_APP", classifyCandidates({ target: "alice", callerId: "me", candidates: [cand("u1")] }).type === "APP_TO_APP");
check("self-call conservé (SELF_CALL)", failReason(classifyCandidates({ target: "alice", callerId: "u1", candidates: [cand("u1")] })) === "SELF_CALL");
check("aucun candidat → APP_TO_PSTN (inchangé)", classifyCandidates({ target: "+3314253647", callerId: "me", candidates: [] }).type === "APP_TO_PSTN");
check("cible juste sous la limite acceptée", classifyCandidates({ target: "a".repeat(MAX_TARGET_LENGTH), callerId: "me", candidates: [] }).type === "APP_TO_PSTN");

console.log("");
console.log(
  failures === 0
    ? "TOUS LES TESTS PASSENT"
    : `${failures} TEST(S) EN ÉCHEC`
);
process.exit(failures === 0 ? 0 : 1);