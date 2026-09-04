/**
 * Tests de la logique PURE du service de session APP_TO_APP
 * (lib/app-call-session.ts).
 * Exécution : npx tsx scripts/test-app-call-session.ts
 *
 * Couvre la détection d'échec de sérialisation (retry) et les constantes de
 * transition exportées (busy / terminal / sonnerie). Les fonctions nécessitant
 * Prisma (createAppCallSession, expireStaleRingingSessions) ne sont pas testées
 * ici — elles nécessitent une DB.
 */

import {
  isSerializationFailure,
  RING_TIMEOUT_MS,
  APP_CALL_BUSY_STATUSES,
  APP_CALL_TERMINAL_STATUSES,
  APP_CALL_RINGING_STATUSES,
} from "../lib/app-call-session";

let failures = 0;
const check = (name: string, cond: boolean) => {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}`);
  }
};

// ── isSerializationFailure ──────────────────────────────────────────────────
check(
  "P2034 (Prisma serialization conflict) → true",
  isSerializationFailure({ code: "P2034" })
);
check(
  "sans code → false",
  isSerializationFailure({}) === false
);
check(
  "autre code → false",
  isSerializationFailure({ code: "P2002" }) === false
);
check("null / undefined → false", isSerializationFailure(null) === false);

// ── Constantes de transition ────────────────────────────────────────────────
check(
  "busy = états occupés (offering/ringing/connecting/active)",
  JSON.stringify(APP_CALL_BUSY_STATUSES) ===
    JSON.stringify(["OFFERING", "RINGING", "CONNECTING", "ACTIVE"])
);
check(
  "terminal = end/missed/declined/failed",
  JSON.stringify(APP_CALL_TERMINAL_STATUSES) ===
    JSON.stringify(["ENDED", "MISSED", "DECLINED", "FAILED"])
);
check(
  "sonnerie = states pre-connect (offering/ringing/connecting)",
  JSON.stringify(APP_CALL_RINGING_STATUSES) ===
    JSON.stringify(["OFFERING", "RINGING", "CONNECTING"])
);
check(
  "timeout sonnerie = 60000 ms",
  RING_TIMEOUT_MS === 60_000
);

console.log("");
console.log(
  failures === 0
    ? "TOUS LES TESTS PASSENT"
    : `${failures} TEST(S) EN ÉCHEC`
);
process.exit(failures === 0 ? 0 : 1);
