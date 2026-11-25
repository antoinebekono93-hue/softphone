/**
 * Pure tests for the native Incoming Call presentation model, reducer, fixtures
 * and boundaries (M3). No React / React Native / SDK / network required.
 *
 * Run: npx tsx scripts/test-native-incoming-call.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  callSourceLabel,
  callStatusLabel,
  callerPrimaryLabel,
  callerSecondaryLabel,
  initialsFromName,
  isDurationVisible,
  isIncomingState,
  isTerminalStatus,
  type NativeCallPresentationState,
} from "../apps/mobile/lib/call/presentation";
import { IDLE_CALL } from "../apps/mobile/lib/call/active-call-reducer";
import {
  createInitialIncomingState,
  incomingCallReducer,
  type IncomingCallAction,
} from "../apps/mobile/lib/call/incoming-call-reducer";
import {
  INCOMING_CALL_FIXTURES,
  incomingFixtureById,
} from "../apps/mobile/lib/call/fixtures";
import { NATIVE_PUSH_STATUS } from "../apps/mobile/lib/call/incoming-signal";
import {
  NATIVE_CALL_CAPABILITIES,
  NATIVE_CALL_ENGINE_STATUS,
} from "../apps/mobile/lib/call/native-call-engine";

let failures = 0;
let checks = 0;

function expect(name: string, actual: unknown, expected: unknown) {
  checks += 1;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` (attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)})`}`,
  );
}

function expectTrue(name: string, value: boolean) {
  expect(name, value, true);
}

function state(overrides: Partial<NativeCallPresentationState>): NativeCallPresentationState {
  return { ...IDLE_CALL, direction: "incoming", ...overrides };
}

const known = state({
  status: "INCOMING",
  displayName: "Marie Dupont",
  displayNumber: "+33 6 12 34 56 78",
  callType: "APP_TO_APP",
});

// --- A. known caller identity ------------------------------------------------
expect("A1. nom connu => principal = nom", callerPrimaryLabel(known), "Marie Dupont");
expect("A2. nom connu => secondaire = numéro", callerSecondaryLabel(known), "+33 6 12 34 56 78");

// --- B. unknown number fallback ----------------------------------------------
const unknown = state({ status: "INCOMING", displayName: "", displayNumber: "+237 6 55 44 33 22" });
expect("B1. inconnu => principal = numéro", callerPrimaryLabel(unknown), "+237 6 55 44 33 22");
expect("B2. inconnu => pas de secondaire", callerSecondaryLabel(unknown), null);
expect("B3. vide => repli", callerPrimaryLabel(state({ displayName: "", displayNumber: "" })), "Numéro inconnu");

// --- C. INCOMING label --------------------------------------------------------
expect("C1. INCOMING => Appel entrant", callStatusLabel(state({ status: "INCOMING" })), "Appel entrant");
expect("C2. ACCEPTING => Connexion…", callStatusLabel(state({ status: "ACCEPTING" })), "Connexion…");
expect("C3. DECLINING => Refus de l'appel…", callStatusLabel(state({ status: "DECLINING" })), "Refus de l'appel…");

// --- Source label (mission 8) -------------------------------------------------
expect("SRC1. APP_TO_APP => Buster Call", callSourceLabel(state({ callType: "APP_TO_APP" })), "Buster Call");
expect("SRC2. PSTN_TO_APP => Appel téléphonique", callSourceLabel(state({ callType: "PSTN_TO_APP" })), "Appel téléphonique");
expect("SRC3. APP_TO_PSTN => Appel téléphonique", callSourceLabel(state({ callType: "APP_TO_PSTN" })), "Appel téléphonique");
expect("SRC4. indéfini => Appel téléphonique", callSourceLabel(state({})), "Appel téléphonique");

// --- D. accept mock transition ------------------------------------------------
const accepting = incomingCallReducer(createInitialIncomingState(known), { type: "ACCEPT" });
expect("D1. INCOMING + ACCEPT => ACCEPTING", accepting.call.status, "ACCEPTING");
expectTrue("D2. ACCEPT ne produit pas ACTIVE", accepting.call.status !== "ACTIVE");
const acceptAgain = incomingCallReducer(accepting, { type: "ACCEPT" });
expect("D3. ACCEPT hors INCOMING => inchangé (garde)", acceptAgain.call.status, "ACCEPTING");
const connecting = incomingCallReducer(accepting, { type: "ADVANCE_CONNECTING" });
expect("D4. ACCEPTING + ADVANCE_CONNECTING => CONNECTING", connecting.call.status, "CONNECTING");
expectTrue("D5. CONNECTING n'est pas ACTIVE", connecting.call.status !== "ACTIVE");

// --- E. reject mock transition ------------------------------------------------
const declining = incomingCallReducer(createInitialIncomingState(known), { type: "DECLINE" });
expect("E1. INCOMING + DECLINE => DECLINING", declining.call.status, "DECLINING");
const declinedEnded = incomingCallReducer(declining, { type: "ADVANCE_ENDED" });
expect("E2. DECLINING + ADVANCE_ENDED => ENDED", declinedEnded.call.status, "ENDED");
expect("E3. DECLINE hors INCOMING => inchangé (garde)", incomingCallReducer(accepting, { type: "DECLINE" }).call.status, "ACCEPTING");

// --- F. MISSED presentation ---------------------------------------------------
const missed = incomingCallReducer(createInitialIncomingState(known), { type: "MARK_MISSED" });
expect("F1. MARK_MISSED => MISSED", missed.call.status, "MISSED");
expect("F2. MISSED => Appel manqué", callStatusLabel(missed.call), "Appel manqué");
expectTrue("F3. MISSED => terminal", isTerminalStatus("MISSED"));

// --- G. FAILED controlled message --------------------------------------------
const failed = incomingCallReducer(createInitialIncomingState(unknown), {
  type: "FAIL",
  failureReason: "Impossible de traiter cet appel.",
});
expect("G1. FAIL => FAILED", failed.call.status, "FAILED");
expect("G2. FAIL porte la raison", callStatusLabel(failed.call), "Impossible de traiter cet appel.");
const failedDefault = incomingCallReducer(createInitialIncomingState(unknown), { type: "FAIL" });
expectTrue("G3. FAIL sans raison => message contrôlé non vide", callStatusLabel(failedDefault.call).length > 0);
expectTrue("G4. messages contrôlés sans details techniques", !/error|exception|stack/i.test(callStatusLabel(failedDefault.call)));

// --- H. long caller identity safe (overflow itself is visual QA) --------------
const longName = "Alexandrine de la Rochefoucauld-Montmirail";
expect("H1. nom long => principal intact", callerPrimaryLabel(state({ displayName: longName })), longName);
expect("H2. initiales nom long = 2 lettres", initialsFromName(longName).length, 2);
expect("H3. initiales = AD", initialsFromName(longName), "AD");

// --- Fixtures: coverage & no ACTIVE ------------------------------------------
const ids = INCOMING_CALL_FIXTURES.map((f) => f.id);
for (const required of [
  "incoming-known",
  "incoming-unknown",
  "incoming-app-to-app",
  "incoming-pstn",
  "incoming-accepting",
  "incoming-declining",
  "incoming-missed",
  "incoming-failed",
  "incoming-long-name",
]) {
  expectTrue(`FIX.${required} présent`, ids.includes(required));
}
expectTrue("FIX. tous direction incoming", INCOMING_CALL_FIXTURES.every((f) => isIncomingState(f.state)));
expectTrue("FIX. aucune durée visible (aucun ACTIVE)", INCOMING_CALL_FIXTURES.every((f) => !isDurationVisible(f.state)));
expect("FIX. inconnu indisponible => repli known", incomingFixtureById("nope").id, "incoming-known");

// --- M. ACTIVE is never falsely produced -------------------------------------
const sequence: IncomingCallAction[] = [
  { type: "ACCEPT" },
  { type: "ADVANCE_CONNECTING" },
  { type: "DECLINE" },
  { type: "ADVANCE_ENDED" },
  { type: "MARK_MISSED" },
  { type: "FAIL" },
  { type: "DISMISS" },
];
let walked = createInitialIncomingState(known);
let producedActive = false;
for (const action of sequence) {
  walked = incomingCallReducer(walked, action);
  if (walked.call.status === "ACTIVE") producedActive = true;
}
expectTrue("M1. aucune action entrante ne produit ACTIVE", !producedActive);
expect("M2. DISMISS => IDLE", walked.call.status, "IDLE");

// --- I / J / K. source scans --------------------------------------------------
const dir = path.join(process.cwd(), "apps", "mobile", "lib", "call");
const pureFiles = [
  "presentation.ts",
  "active-call-reducer.ts",
  "fixtures.ts",
  "native-call-engine.ts",
  "incoming-call-reducer.ts",
  "incoming-signal.ts",
];
const forbidden = [
  /\bTelnyx\b/i,
  /\bwindow\b/,
  /\bdocument\b/,
  /HTMLAudioElement/,
  /from "next\//,
  /from "next-auth/,
  /react-native/,
];

for (const file of pureFiles) {
  const source = readFileSync(path.join(dir, file), "utf8");
  for (const pattern of forbidden) {
    expectTrue(`I/J. ${file} sans ${pattern.toString()}`, !pattern.test(source));
  }
}

const fixturesSource = readFileSync(path.join(dir, "fixtures.ts"), "utf8");
for (const network of [/\bfetch\b/, /XMLHttpRequest/, /\baxios\b/, /https?:\/\//, /WebSocket/]) {
  expectTrue(`K. fixtures sans ${network.toString()}`, !network.test(fixturesSource));
}

// --- L. capability flags remain honest ---------------------------------------
expect("L1. statut moteur NOT_IMPLEMENTED", NATIVE_CALL_ENGINE_STATUS, "NOT_IMPLEMENTED");
expect("L2. push NOT_IMPLEMENTED", NATIVE_PUSH_STATUS, "NOT_IMPLEMENTED");
expect("L3. media non implémenté", NATIVE_CALL_CAPABILITIES.media, false);
expect("L4. audio routing non implémenté", NATIVE_CALL_CAPABILITIES.audioRouting, false);
expect("L5. DTMF non implémenté", NATIVE_CALL_CAPABILITIES.dtmf, false);

console.log(`\n${checks} vérifications, ${failures} échec(s)`);
console.log(failures === 0 ? "TOUS LES TESTS PASSENT" : `${failures} TEST(S) EN ÉCHEC`);
process.exit(failures === 0 ? 0 : 1);
