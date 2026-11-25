/**
 * Pure tests for the native Active Call presentation model, reducer, fixtures
 * and engine boundary (no React / React Native / SDK required).
 *
 * Run: npx tsx scripts/test-native-active-call.ts
 *
 * Covers mission checks A–I, K, L (J = long-name overflow is visual QA).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  callStatusLabel,
  callerPrimaryLabel,
  callerSecondaryLabel,
  formatDuration,
  initialsFromName,
  isDurationVisible,
  isTerminalStatus,
  type NativeCallPresentationState,
} from "../apps/mobile/lib/call/presentation";
import {
  activeCallReducer,
  createInitialUiState,
  IDLE_CALL,
} from "../apps/mobile/lib/call/active-call-reducer";
import { CALL_FIXTURES, fixtureById } from "../apps/mobile/lib/call/fixtures";
import { NATIVE_CALL_CAPABILITIES, NATIVE_CALL_ENGINE_STATUS } from "../apps/mobile/lib/call/native-call-engine";

let failures = 0;
let checks = 0;

function expect(name: string, actual: unknown, expected: unknown) {
  checks += 1;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` (attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)})`}`);
}

function expectTrue(name: string, value: boolean) {
  expect(name, value, true);
}

function call(overrides: Partial<NativeCallPresentationState>): NativeCallPresentationState {
  return { ...IDLE_CALL, ...overrides };
}

// --- A. ACTIVE shows a running duration -------------------------------------
expectTrue(
  "A1. ACTIVE + startedAt => durée visible",
  isDurationVisible(call({ status: "ACTIVE", startedAt: Date.now() - 1000 })),
);
expectTrue(
  "A2. ACTIVE sans startedAt => pas de durée",
  !isDurationVisible(call({ status: "ACTIVE", startedAt: null })),
);
expect("A3. formatDuration(137s) = 02:17", formatDuration(137), "02:17");
expect("A4. formatDuration(0) = 00:00", formatDuration(0), "00:00");
expect("A5. formatDuration(-5) = 00:00", formatDuration(-5), "00:00");
expect("A6. formatDuration(3661) = 1:01:01", formatDuration(3661), "1:01:01");
expectTrue("A7. ACTIVE pas terminal", !isTerminalStatus("ACTIVE"));

// --- B / C. RINGING & CONNECTING labels --------------------------------------
expect("B1. RINGING => Sonnerie…", callStatusLabel(call({ status: "RINGING" })), "Sonnerie…");
expect("C1. CONNECTING => Connexion…", callStatusLabel(call({ status: "CONNECTING" })), "Connexion…");
expect("A8. ACTIVE label vide (durée affichée à la place)", callStatusLabel(call({ status: "ACTIVE" })), "");
expect("B2. DIALING => Appel en cours…", callStatusLabel(call({ status: "DIALING" })), "Appel en cours…");
expect("B3. ENDING => Fin de l'appel…", callStatusLabel(call({ status: "ENDING" })), "Fin de l'appel…");
expect("B4. ENDED => Appel terminé", callStatusLabel(call({ status: "ENDED" })), "Appel terminé");

// --- D. FAILED controlled message -------------------------------------------
expect(
  "D1. FAILED utilise failureReason",
  callStatusLabel(call({ status: "FAILED", failureReason: "Le contact est injoignable." })),
  "Le contact est injoignable.",
);
expectTrue(
  "D2. FAILED sans raison => message contrôlé non vide",
  callStatusLabel(call({ status: "FAILED", failureReason: null })).length > 0,
);
expectTrue("D3. FAILED terminal", isTerminalStatus("FAILED"));

// --- E / F / G / H. reducer --------------------------------------------------
const start = call({ status: "ACTIVE", startedAt: Date.now() - 5000, displayName: "Marie" });

expectTrue("E1. TOGGLE_MUTE active le micro coupé", activeCallReducer(createInitialUiState(start), { type: "TOGGLE_MUTE" }).call.muted);
expectTrue(
  "E2. double TOGGLE_MUTE revient à l'état initial",
  !activeCallReducer(
    activeCallReducer(createInitialUiState(start), { type: "TOGGLE_MUTE" }),
    { type: "TOGGLE_MUTE" },
  ).call.muted,
);
expectTrue("F1. TOGGLE_SPEAKER active le haut-parleur", activeCallReducer(createInitialUiState(start), { type: "TOGGLE_SPEAKER" }).call.speaker);
expectTrue("G1. OPEN_KEYPAD ouvre le clavier", activeCallReducer(createInitialUiState(start), { type: "OPEN_KEYPAD" }).keypadOpen);
expectTrue(
  "G2. CLOSE_KEYPAD ferme le clavier",
  !activeCallReducer(
    activeCallReducer(createInitialUiState(start), { type: "OPEN_KEYPAD" }),
    { type: "CLOSE_KEYPAD" },
  ).keypadOpen,
);

const hungUp = activeCallReducer(
  activeCallReducer(
    activeCallReducer(createInitialUiState(start), { type: "TOGGLE_MUTE" }),
    { type: "TOGGLE_SPEAKER" },
  ),
  { type: "HANGUP" },
);
expect("H1. HANGUP => ENDED", hungUp.call.status, "ENDED");
expectTrue("H2. HANGUP remet muted à false", !hungUp.call.muted);
expectTrue("H3. HANGUP remet speaker à false", !hungUp.call.speaker);
expectTrue("H4. HANGUP ferme le clavier", !hungUp.keypadOpen);
expectTrue("H5. HANGUP efface startedAt (pas de durée figée)", !hungUp.call.startedAt);

const reset = activeCallReducer(hungUp, { type: "RESET", call: IDLE_CALL });
expect("H6. RESET => IDLE", reset.call.status, "IDLE");

const failed = activeCallReducer(createInitialUiState(start), {
  type: "SET_STATUS",
  status: "FAILED",
  failureReason: "Réseau indisponible.",
});
expect("H7. SET_STATUS FAILED porte la raison", failed.call.failureReason, "Réseau indisponible.");
expectTrue("H8. SET_STATUS FAILED remet muted à false", !failed.call.muted);

// --- I. identity: known contact vs unknown number ---------------------------
expect(
  "I1. contact connu => nom en principal",
  callerPrimaryLabel(call({ displayName: "Marie Dupont", displayNumber: "+33 6 12 34 56 78" })),
  "Marie Dupont",
);
expect(
  "I2. contact connu => numéro en secondaire",
  callerSecondaryLabel(call({ displayName: "Marie Dupont", displayNumber: "+33 6 12 34 56 78" })),
  "+33 6 12 34 56 78",
);
expect(
  "I3. numéro inconnu => numéro en principal",
  callerPrimaryLabel(call({ displayName: "", displayNumber: "+237 6 55 44 33 22" })),
  "+237 6 55 44 33 22",
);
expect("I4. numéro inconnu => pas de secondaire", callerSecondaryLabel(call({ displayName: "", displayNumber: "+237 6 55 44 33 22" })), null);
expect("I5. vide => libellé de repli", callerPrimaryLabel(call({ displayName: "", displayNumber: "" })), "Numéro inconnu");

// --- J. initials (overflow itself is visual QA) ------------------------------
expect("J1. initialsFromName('Marie Dupont') = MD", initialsFromName("Marie Dupont"), "MD");
expect("J2. initialsFromName('Marie') = M", initialsFromName("Marie"), "M");
expect("J3. initialsFromName('') = ''", initialsFromName(""), "");
expect("J4. initialsFromName('  ')= ''", initialsFromName("   "), "");

// --- Fixtures: presence, coverage, no side effects ---------------------------
const fixtureIds = CALL_FIXTURES.map((f) => f.id);
for (const required of ["dialing", "ringing", "connecting", "active", "unknown", "failed", "ended"]) {
  expectTrue(`FIX.${required} présent`, fixtureIds.includes(required));
}
expect("FIX. active => statut ACTIVE", fixtureById("active").state.status, "ACTIVE");
expectTrue("FIX. active => durée visible", isDurationVisible(fixtureById("active").state));
expect("FIX. inconnu indisponible => repli 'active'", fixtureById("nope").id, "active");

// --- K. no Telnyx display in presentation/fixtures ---------------------------
// --- L. no browser-only imports in the pure modules --------------------------
const dir = path.join(process.cwd(), "apps", "mobile", "lib", "call");
const pureFiles = ["presentation.ts", "active-call-reducer.ts", "fixtures.ts", "native-call-engine.ts"];
const forbidden = [/window\b/, /\bdocument\b/, /HTMLAudioElement/, /from "next\//, /from "next-auth/, /react-native/];

for (const file of pureFiles) {
  const source = readFileSync(path.join(dir, file), "utf8");
  expectTrue(`K. ${file} sans mention Telnyx`, !/telnyx/i.test(source));
  for (const pattern of forbidden) {
    expectTrue(`L. ${file} sans ${pattern.toString()}`, !pattern.test(source));
  }
}

// --- Engine boundary is honest ----------------------------------------------
expect("ENGINE. statut NOT_IMPLEMENTED", NATIVE_CALL_ENGINE_STATUS, "NOT_IMPLEMENTED");
expect("ENGINE. media non implémenté", NATIVE_CALL_CAPABILITIES.media, false);
expect("ENGINE. audio routing non implémenté", NATIVE_CALL_CAPABILITIES.audioRouting, false);
expect("ENGINE. DTMF non implémenté", NATIVE_CALL_CAPABILITIES.dtmf, false);

console.log(`\n${checks} vérifications, ${failures} échec(s)`);
console.log(failures === 0 ? "TOUS LES TESTS PASSENT" : `${failures} TEST(S) EN ÉCHEC`);
process.exit(failures === 0 ? 0 : 1);
