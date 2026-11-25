/**
 * Tests M4 — Native Media Engine (adaptateur Telnyx, sans SDK ni appel réel).
 *
 * Run: npx tsx scripts/test-native-media-engine.ts
 *
 * Couvre la mission §25 (A–P) et §26 (mapping d'états fournisseur). Aucun appel
 * téléphonique réel n'est effectué : un faux port fournisseur + un flux
 * d'événements simulé alimentent l'adaptateur.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  NATIVE_MEDIA_ENGINE_STATUS,
  NATIVE_UNSUPPORTED_ERROR,
  TelnyxNativeCallEngine,
} from "../apps/mobile/lib/call/telnyx-native-call-engine";
import {
  isProviderFailureState,
  isProviderTerminalState,
  mapTelnyxCallState,
} from "../apps/mobile/lib/call/telnyx-event-map";
import {
  createGrantedMicrophonePermission,
  MICROPHONE_PERMISSION_DENIED,
  type MicrophonePermissionPort,
} from "../apps/mobile/lib/call/microphone-permission";
import { createNativeCallAuthorization } from "../apps/mobile/lib/call/native-call-authorization";
import {
  createNativeTelnyxTokenProvider,
  NATIVE_TELNYX_AUTH_STATUS,
} from "../apps/mobile/lib/call/native-telnyx-token";
import { NATIVE_CALL_CAPABILITIES, NATIVE_CALL_ENGINE_STATUS } from "../apps/mobile/lib/call/native-call-engine";
import type {
  TelnyxNewCallParams,
  TelnyxVoiceCallPort,
  TelnyxVoiceClientPort,
  TelnyxVoiceDirection,
} from "../apps/mobile/lib/call/telnyx-voice-port";
import type { ApiClient } from "../apps/mobile/lib/api";

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

async function expectThrows(name: string, code: string, run: () => Promise<unknown>) {
  checks += 1;
  try {
    await run();
    failures += 1;
    console.log(`FAIL ${name} (aucune erreur levée, attendu ${code})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const ok = message === code;
    if (!ok) failures += 1;
    console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` (attendu ${code}, obtenu ${message})`}`);
  }
}

class BaseFakeCall {
  readonly id: string;
  readonly direction: TelnyxVoiceDirection;
  state = "new";
  hangupCount = 0;
  constructor(id: string, direction: TelnyxVoiceDirection = "outgoing") {
    this.id = id;
    this.direction = direction;
  }
  hangup() {
    this.hangupCount += 1;
    this.state = "hangup";
  }
}

class FullFakeCall extends BaseFakeCall {
  muteCount = 0;
  unmuteCount = 0;
  answeredCount = 0;
  dtmfDigits: string[] = [];
  answer() {
    this.answeredCount += 1;
    this.state = "active";
  }
  muteAudio() {
    this.muteCount += 1;
  }
  unmuteAudio() {
    this.unmuteCount += 1;
  }
  dtmf(digit: string) {
    this.dtmfDigits.push(digit);
  }
}

class LimitedFakeCall extends BaseFakeCall {}

class FakeClient implements TelnyxVoiceClientPort {
  calls: BaseFakeCall[] = [];
  lastParams: TelnyxNewCallParams | null = null;
  disconnectedCount = 0;
  private readonly factory: () => BaseFakeCall;
  private readonly reject: boolean;
  constructor(factory: () => BaseFakeCall = () => new FullFakeCall("call-1"), reject = false) {
    this.factory = factory;
    this.reject = reject;
  }
  async newCall(params: TelnyxNewCallParams): Promise<TelnyxVoiceCallPort> {
    this.lastParams = params;
    if (this.reject) throw new Error("PROVIDER_DOWN");
    const call = this.factory();
    this.calls.push(call);
    return call as unknown as TelnyxVoiceCallPort;
  }
  disconnect() {
    this.disconnectedCount += 1;
  }
}

const AUTHORIZATION = {
  attemptId: "attempt-1",
  destination: "+33612345678",
  callerNumber: "+33100000000",
  clientState: "CLIENT_STATE",
} as const;

function makeEngine(options?: {
  denyMic?: boolean;
  denyAuthorization?: boolean;
  rejectNewCall?: boolean;
  factory?: () => BaseFakeCall;
}) {
  const client = new FakeClient(options?.factory, options?.rejectNewCall);
  const microphone: MicrophonePermissionPort = options?.denyMic
    ? { async get() { return "denied"; }, async request() { return "denied"; } }
    : createGrantedMicrophonePermission();
  const authorize = async () =>
    options?.denyAuthorization
      ? ({ ok: false as const, reason: "NO_PLAN" })
      : ({ ok: true as const, authorization: { ...AUTHORIZATION } });
  const engine = new TelnyxNativeCallEngine({ client, authorize, microphone, now: () => 1000 });
  return { engine, client };
}

async function main() {
  // --- A. engine initializes safely ------------------------------------------
  expect("A1. état initial IDLE", makeEngine().engine.getState().status, "IDLE");
  {
    const { engine } = makeEngine();
    let count = 0;
    const unsubscribe = engine.subscribe(() => {
      count += 1;
    });
    expectTrue("A2. subscribe retourne un désabonnement", typeof unsubscribe === "function");
    await engine.startCall("+33612345678");
    const afterStart = count;
    unsubscribe();
    engine.applyProviderState("active");
    expectTrue("A3. désabonnement stoppe les notifications", count === afterStart && afterStart > 0);
  }
  expect("A4. statut moteur média PARTIAL", NATIVE_MEDIA_ENGINE_STATUS, "PARTIAL");

  // --- B. no token embedded in bundle ----------------------------------------
  // (scan des modules natifs ci-dessous)

  // --- C. startCall emits normalized DIALING ---------------------------------
  {
    const { engine, client } = makeEngine();
    await engine.startCall("+33612345678");
    expect("C1. startCall => DIALING", engine.getState().status, "DIALING");
    expect("C2. clientState transmis au fournisseur", client.lastParams?.clientState, "CLIENT_STATE");
    expect("C3. destination transmise", client.lastParams?.destinationNumber, "+33612345678");
    expect("C4. id = attemptId", client.lastParams?.id, "attempt-1");
    expect("C5. pas d'ACTIVE avant confirmation", engine.getState().status !== "ACTIVE", true);
  }

  // --- D. ACTIVE only after provider connected event -------------------------
  {
    const { engine } = makeEngine();
    await engine.startCall("+33612345678");
    engine.applyProviderState("ringing");
    expect("D1. ringing => RINGING", engine.getState().status, "RINGING");
    expect("D2. toujours pas ACTIVE", engine.getState().status !== "ACTIVE", true);
    engine.applyProviderState("active");
    expect("D3. active => ACTIVE", engine.getState().status, "ACTIVE");
    expect("D4. startedAt posé à l'ACTIVE", engine.getState().startedAt, 1000);
    engine.applyProviderState("active");
    expect("D5. second active garde startedAt", engine.getState().startedAt, 1000);
  }

  // --- E. failed provider state → FAILED -------------------------------------
  {
    const { engine } = makeEngine();
    await engine.startCall("+33612345678");
    engine.applyProviderState("failed");
    expect("E1. failed => FAILED", engine.getState().status, "FAILED");
  }
  {
    const { engine, client } = makeEngine({ rejectNewCall: true });
    await expectThrows("E2. rejet newCall => erreur remontée", "PROVIDER_DOWN", () =>
      engine.startCall("+33612345678"),
    );
    expect("E3. newCall rejeté => FAILED", engine.getState().status, "FAILED");
    expect("E4. aucune session après rejet", client.calls.length, 0);
  }

  // --- F. hangup exactly once ------------------------------------------------
  {
    const { engine, client } = makeEngine();
    await engine.startCall("+33612345678");
    await engine.hangup();
    await engine.hangup();
    expect("F1. hangup fournisseur appelé une seule fois", (client.calls[0] as FullFakeCall).hangupCount, 1);
    expect("F2. état ENDING après hangup", engine.getState().status, "ENDING");
  }

  // --- G. mute routes to engine once -----------------------------------------
  {
    const { engine, client } = makeEngine();
    await engine.startCall("+33612345678");
    await engine.setMuted(true);
    await engine.setMuted(false);
    const call = client.calls[0] as FullFakeCall;
    expect("G1. mute appelé une fois", call.muteCount, 1);
    expect("G2. unmute appelé une fois", call.unmuteCount, 1);
    expect("G3. état muted reflète le moteur", engine.getState().muted, false);
  }

  // --- H. DTMF routes correctly if supported ---------------------------------
  {
    const { engine, client } = makeEngine();
    await engine.startCall("+33612345678");
    await engine.sendDTMF("5");
    await engine.sendDTMF("#");
    expect("H1. DTMF transmis dans l'ordre", (client.calls[0] as FullFakeCall).dtmfDigits, ["5", "#"]);
  }
  {
    const { engine } = makeEngine({ factory: () => new LimitedFakeCall("limited") });
    await engine.startCall("+33612345678");
    await expectThrows("H2. DTMF non supporté => erreur contrôlée", NATIVE_UNSUPPORTED_ERROR, () => engine.sendDTMF("5"));
  }

  // --- I. permission denied blocks call --------------------------------------
  {
    const { engine, client } = makeEngine({ denyMic: true });
    await expectThrows("I1. micro refusé => erreur contrôlée", MICROPHONE_PERMISSION_DENIED, () =>
      engine.startCall("+33612345678"),
    );
    expect("I2. aucun newCall si micro refusé", client.calls.length, 0);
    expect("I3. pas de DIALING si micro refusé", engine.getState().status !== "DIALING", true);
  }

  // --- J. provider disconnect cleans session ---------------------------------
  {
    const { engine, client } = makeEngine();
    await engine.startCall("+33612345678");
    engine.applyProviderState("active");
    engine.applyProviderState("destroy");
    expect("J1. destroy => ENDED", engine.getState().status, "ENDED");
    expect("J2. startedAt nettoyé en terminal", engine.getState().startedAt, null);
    await engine.disconnect();
    expect("J3. disconnect => IDLE", engine.getState().status, "IDLE");
    expect("J4. disconnect propagé au client", client.disconnectedCount, 1);
  }

  // --- K/L/M. source scans (no browser APIs / WebView / browser SDK) ----------
  const dir = path.join(process.cwd(), "apps", "mobile", "lib", "call");
  const nativeFiles = [
    "telnyx-voice-port.ts",
    "telnyx-event-map.ts",
    "microphone-permission.ts",
    "native-call-authorization.ts",
    "native-telnyx-token.ts",
    "telnyx-native-call-engine.ts",
  ];
  const forbiddenBrowser = [/window\b/, /\bdocument\b/, /HTMLAudioElement/, /react-native/];
  const forbiddenToken = [/TELNYX_API_KEY/, /SIP_PASSWORD/, /login_token/, /api[_-]?key/i, /eyJ[A-Za-z0-9_-]{6,}/];
  for (const file of nativeFiles) {
    const source = readFileSync(path.join(dir, file), "utf8");
    for (const pattern of forbiddenBrowser) {
      expectTrue(`K. ${file} sans ${pattern.toString()}`, !pattern.test(source));
    }
    expectTrue(`L. ${file} sans WebView`, !/webview/i.test(source));
    expectTrue(`M. ${file} sans @telnyx/webrtc`, !/@telnyx\/webrtc/.test(source));
    for (const pattern of forbiddenToken) {
      expectTrue(`B. ${file} sans secret embarqué (${pattern.toString()})`, !pattern.test(source));
    }
  }

  // --- N. M2 / M3 engine boundary unchanged ----------------------------------
  expect("N1. statut moteur M2 inchangé", NATIVE_CALL_ENGINE_STATUS, "NOT_IMPLEMENTED");
  expect("N2. média M2 inchangé", NATIVE_CALL_CAPABILITIES.media, false);
  expect("N3. routing audio M2 inchangé", NATIVE_CALL_CAPABILITIES.audioRouting, false);
  expect("N4. DTMF M2 inchangé", NATIVE_CALL_CAPABILITIES.dtmf, false);
  // O. (M3) et P. (5 onglets) sont vérifiés par les suites dédiées.

  // --- §26. SDK event mapping -------------------------------------------------
  expect("M26-1. new => DIALING", mapTelnyxCallState("new", "outgoing"), "DIALING");
  expect("M26-2. ringing => RINGING", mapTelnyxCallState("ringing", "outgoing"), "RINGING");
  expect("M26-3. early => RINGING", mapTelnyxCallState("early", "outgoing"), "RINGING");
  expect("M26-4. active => ACTIVE", mapTelnyxCallState("active", "outgoing"), "ACTIVE");
  expect("M26-5. held => ACTIVE", mapTelnyxCallState("held", "outgoing"), "ACTIVE");
  expect("M26-6. hangup => ENDING", mapTelnyxCallState("hangup", "outgoing"), "ENDING");
  expect("M26-7. destroy => ENDED", mapTelnyxCallState("destroy", "outgoing"), "ENDED");
  expect("M26-8. failed => FAILED", mapTelnyxCallState("failed", "outgoing"), "FAILED");
  expect("M26-9. inconnu => null (jamais ACTIVE)", mapTelnyxCallState("banana", "outgoing"), null);
  expect("M26-10. casse/espaces normalisés", mapTelnyxCallState("  ACTIVE ", "outgoing"), "ACTIVE");
  expect("M26-11. incoming ringing => INCOMING", mapTelnyxCallState("ringing", "incoming"), "INCOMING");
  expect("M26-12. incoming active => ACTIVE", mapTelnyxCallState("active", "incoming"), "ACTIVE");
  expect("M26-16. connecting => CONNECTING", mapTelnyxCallState("connecting", "outgoing"), "CONNECTING");
  expect("M26-17. ended => ENDED", mapTelnyxCallState("ended", "outgoing"), "ENDED");
  expect("M26-18. dropped => FAILED", mapTelnyxCallState("dropped", "outgoing"), "FAILED");
  expectTrue("M26-13. failure detector", isProviderFailureState("failed"));
  expectTrue("M26-14. terminal detector", isProviderTerminalState("destroy"));
  expectTrue("M26-19. dropped = échec", isProviderFailureState("dropped"));
  expectTrue("M26-20. ended = terminal", isProviderTerminalState("ended"));
  {
    const { engine } = makeEngine();
    await engine.startCall("+33612345678");
    engine.applyProviderState("banana");
    expect("M26-15. état inconnu ignoré côté moteur", engine.getState().status, "DIALING");
  }

  // --- Authorization via the existing server pipeline ------------------------
  {
    const okApi = {
      post: async () => ({ ...AUTHORIZATION }),
    } as unknown as ApiClient;
    const authorize = createNativeCallAuthorization(okApi);
    const outcome = await authorize("+33612345678");
    expect("AUTH-1. preauthorize ok", outcome.ok, true);
    expect("AUTH-2. clientState remonté", outcome.ok ? outcome.authorization.clientState : null, "CLIENT_STATE");

    const deniedApi = {
      post: async () => ({ error: "NO_PLAN" }),
    } as unknown as ApiClient;
    const denied = await createNativeCallAuthorization(deniedApi)("+33612345678");
    expect("AUTH-3. refus propagé", denied.ok ? null : denied.reason, "NO_PLAN");
  }

  // --- Authorization failure blocks the call ---------------------------------
  {
    const { engine, client } = makeEngine({ denyAuthorization: true });
    await expectThrows("AUTH-4. autorisation refusée bloque l'appel", "NO_PLAN", () =>
      engine.startCall("+33612345678"),
    );
    expect("AUTH-5. aucun newCall si non autorisé", client.calls.length, 0);
    expect("AUTH-6. état FAILED si non autorisé", engine.getState().status, "FAILED");
  }

  // --- Token boundary is honest and blocked ----------------------------------
  {
    expect("TOK-1. statut auth natif BLOQUÉ", NATIVE_TELNYX_AUTH_STATUS, "BLOCKED_BY_NATIVE_AUTH");
    const noSession = createNativeTelnyxTokenProvider({
      api: { get: async () => ({ token: "unused" }) } as unknown as ApiClient,
      getAccessToken: async () => null,
    });
    expect("TOK-2. sans session native => BLOQUÉ", (await noSession()).status, "BLOCKED_BY_NATIVE_AUTH");

    const withSession = createNativeTelnyxTokenProvider({
      api: { get: async () => ({ token: "short-lived-token" }) } as unknown as ApiClient,
      getAccessToken: async () => "native-jwt",
    });
    const ready = await withSession();
    expect("TOK-3. session présente => READY", ready.status, "READY");
    expect("TOK-4. jeton remonté", ready.status === "READY" ? ready.token : null, "short-lived-token");
  }

  console.log(`\n${checks} vérifications, ${failures} échec(s)`);
  console.log(failures === 0 ? "TOUS LES TESTS PASSENT" : `${failures} TEST(S) EN ÉCHEC`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
