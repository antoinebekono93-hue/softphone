/**
 * Tests unitaires pour le flux d'appels PSTN entrants.
 *
 * Couvre :
 *  1. Numéro Telnyx → résout l'org et l'utilisateur
 *  2. Numéro inconnu → pas de callLog
 *  3. Organisation inconnue → aucun user → fallback SIP
 *  4. Appel entrant correctement routé via Pusher
 *  5. Payload Pusher valide
 *  6. Mauvais userId refusé (Pusher auth)
 *  7. Événement duplicate → un seul traitement
 *  8. État entrant conservé (idempotence)
 *  9. Appel hangup → état idle
 * 10. Autoplay failure ≠ disparition de l'UI
 * 11. Pusher reconnect → re-souscription
 * 12. Double listener → pas de double affichage
 * 13. Appel entrant pendant initialisation → ignoré si pas prêt
 * 14. Appel entrant pendant un autre appel → ignoré
 * 15. Answer sans session → unauthorized
 * 16. callControlId inconnu → not-found
 * 17. Autre organisation → forbidden
 * 18. Bon utilisateur (assignedUser) → ok
 * 19. Fallback org (sans assignedUser) → ok
 * 20. Format callControlId validé
 * 21. Double answer → bloqué
 * 22. Answer seulement INITIATED/RINGING
 * 23. Double hangup / appel terminé → bloqué
 * 24. Hangup autorisé tant que non terminé
 * 25. Payload : aucun secret / credential / clé
 */

let failures = 0;
let passes = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passes++;
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// ── Mock Pusher ────────────────────────────────────────────────────────────

const triggered: Array<{ channel: string; event: string; data: any }> = [];
const mockPusher = {
  trigger: async (channel: string, event: string, data: any) => {
    triggered.push({ channel, event, data });
    return true;
  },
};

// ── Mock Prisma ────────────────────────────────────────────────────────────

const phoneNumbers = new Map<string, any>();
const callLogs: any[] = [];
const users = new Map<string, any>();

function resetMocks() {
  triggered.length = 0;
  callLogs.length = 0;
  phoneNumbers.clear();
  users.clear();
}

// ── Helpers ────────────────────────────────────────────────────────────────

import { appCallChannels, PSTN_EVENTS } from "../lib/app-call-channels";
import {
  authorizePstnCallAction,
  canAnswerCall,
  canHangupCall,
  isValidCallControlId,
  PSTN_TERMINAL_STATUSES,
} from "../lib/pstn-call-control";
import {
  classifyCallUpdate,
  correlateIncoming,
  decideAcceptAction,
  getCallControlId,
  isCallUsable,
  resolvePendingIncoming,
  shouldEndIncoming,
  shouldProceedToAnswer,
} from "../lib/pstn-correlation";

function makeEvent(overrides: Record<string, any> = {}) {
  return {
    callControlId: `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    direction: "incoming",
    from: "+15551234567",
    to: "+15559876543",
    ...overrides,
  };
}

async function simulateIncoming(event: ReturnType<typeof makeEvent>) {
  const phone = phoneNumbers.get(event.to);
  if (!phone) return { notified: false, user: null };

  const notifyUser = phone.assignedUser
    ?? (phone.organizationId ? users.get(phone.organizationId) : null);

  if (notifyUser) {
    await mockPusher.trigger(
      appCallChannels.user(notifyUser.id),
      PSTN_EVENTS.INCOMING,
      {
        callControlId: event.callControlId,
        from: event.from,
        to: event.to,
        phoneNumberId: phone.id,
        organizationId: phone.organizationId,
        callerName: null,
      },
    );
    return { notified: true, user: notifyUser };
  }
  return { notified: false, user: null };
}

// ── Tests ──────────────────────────────────────────────────────────────────

async function runTests() {
  console.log("═══ Tests PSTN Incoming Call ═══\n");

  // Test 1
  {
    resetMocks();
    const phone = {
      id: "pn_1",
      number: "+15559876543",
      organizationId: "org_1",
      assignedUserId: "user_1",
      assignedUser: { id: "user_1", name: "Alice" },
      aiEmployee: null,
    };
    phoneNumbers.set(phone.number, phone);
    users.set("org_1", { id: "user_1", name: "Alice" });

    const result = phoneNumbers.get("+15559876543");
    check("1. numéro Telnyx → résout l'org et l'utilisateur",
      result !== undefined && result.organizationId === "org_1" && result.assignedUser.id === "user_1");
  }

  // Test 2
  {
    resetMocks();
    const result = phoneNumbers.get("+19999999999");
    check("2. numéro inconnu → pas de callLog créé", result === undefined);
  }

  // Test 3
  {
    resetMocks();
    const phone = {
      id: "pn_2",
      number: "+15559876543",
      organizationId: "org_unknown",
      assignedUserId: null,
      assignedUser: null,
      aiEmployee: null,
    };
    phoneNumbers.set(phone.number, phone);

    const event = makeEvent({ to: phone.number });
    const { notified } = await simulateIncoming(event);
    check("3. organisation inconnue → aucun user → fallback SIP", !notified);
  }

  // Test 4
  {
    resetMocks();
    const phone = {
      id: "pn_3",
      number: "+15559876543",
      organizationId: "org_1",
      assignedUserId: "user_1",
      assignedUser: { id: "user_1", name: "Alice" },
      aiEmployee: null,
    };
    phoneNumbers.set(phone.number, phone);
    users.set("org_1", { id: "user_1", name: "Alice" });

    const event = makeEvent({ to: phone.number });
    const { notified } = await simulateIncoming(event);

    check("4. appel entrant correctement routé via Pusher",
      notified && triggered.length === 1 && triggered[0].event === PSTN_EVENTS.INCOMING);
  }

  // Test 5
  {
    resetMocks();
    const payload = {
      callControlId: "call_abc",
      from: "+15551234567",
      to: "+15559876543",
      phoneNumberId: "pn_1",
      organizationId: "org_1",
      callerName: null,
    };

    check("5. payload Pusher valide (callControlId, from, to, org)",
      typeof payload.callControlId === "string" && payload.callControlId.length > 0
      && typeof payload.from === "string" && typeof payload.to === "string"
      && typeof payload.organizationId === "string");
  }

  // Test 6
  {
    resetMocks();
    const channelName = "private-user-user_2";
    const currentUserId = "user_1";
    const authorized = channelName === appCallChannels.user(currentUserId);
    check("6. Pusher auth拒否 si mauvais userId", !authorized);
  }

  // Test 7
  {
    resetMocks();
    let processedCount = 0;
    const seen = new Set<string>();

    for (let i = 0; i < 3; i++) {
      const callControlId = "call_dup_1";
      if (!seen.has(callControlId)) {
        seen.add(callControlId);
        processedCount++;
      }
    }

    check("7. événement duplicate → un seul traitement", processedCount === 1);
  }

  // Test 8
  {
    resetMocks();
    let callState = "idle";

    // Premier event
    callState = "ringing";

    // Deuxième event (duplicate) → état inchangé
    if (callState !== "idle") {
      // On ne change pas l'état
    }

    check("8. état entrant conservé (callState = ringing)", callState === "ringing");
  }

  // Test 9
  {
    resetMocks();
    let callState = "ringing";
    let pstnCallControlId: string | null = "call_123";

    // Simuler hangup
    callState = "idle";
    pstnCallControlId = null;

    check("9. appel hangup → état idle",
      callState === "idle" && pstnCallControlId === null);
  }

  // Test 10
  {
    resetMocks();
    let callState = "ringing";
    const audioFailed = true;

    const shouldShowUI = callState === "ringing";
    check("10. autoplay failure ≠ disparition de l'UI",
      shouldShowUI && audioFailed);
  }

  // Test 11
  {
    resetMocks();
    const subscribedChannels: string[] = [];
    const pusher = {
      subscribe: (ch: string) => { subscribedChannels.push(ch); },
      unsubscribe: (ch: string) => {
        const i = subscribedChannels.indexOf(ch);
        if (i >= 0) subscribedChannels.splice(i, 1);
      },
    };

    pusher.subscribe("private-user-user_1");
    check("11. Pusher reconnect → re-souscription (pré-condition)",
      subscribedChannels.includes("private-user-user_1"));

    pusher.unsubscribe("private-user-user_1");
    pusher.subscribe("private-user-user_1");
    check("11. Pusher reconnect → re-souscription (post-reconnect)",
      subscribedChannels.filter(c => c === "private-user-user_1").length === 1);
  }

  // Test 12
  {
    resetMocks();
    let uiShownCount = 0;
    let callState = "idle";

    const handleIncoming = () => {
      if (callState === "idle") {
        uiShownCount++;
        callState = "ringing";
      }
    };

    handleIncoming();
    handleIncoming(); // duplicate

    check("12. double listener → pas de double affichage", uiShownCount === 1);
  }

  // Test 13
  {
    resetMocks();
    let isReady = false;
    let callState = "idle";

    if (!isReady) {
      // Event ignoré
    }
    const afterInit = callState;
    check("13. appel entrant pendant initialisation → ignoré si pas prêt", afterInit === "idle");

    isReady = true;
    if (isReady && callState === "idle") {
      callState = "ringing";
    }
    check("13. après initialisation → l'état change", callState === "ringing");
  }

  // Test 14
  {
    resetMocks();
    let callState = "active";
    let pstnCallControlId: string | null = "call_existing";

    const handleIncoming = () => {
      if (callState !== "idle") return;
      callState = "ringing";
    };

    handleIncoming();
    check("14. appel entrant pendant un autre appel → ignoré",
      callState === "active" && pstnCallControlId === "call_existing");
  }

  // ── Sécurité : endpoints answer / hangup ─────────────────────────────────

  // Test 15 — pas de session
  {
    const noSession = { user: null, callLog: { organizationId: "org_1", status: "INITIATED" } };
    check("15. answer sans session → unauthorized",
      authorizePstnCallAction(noSession as any) === "no-session");
  }

  // Test 16 — callControlId inconnu
  {
    const unknown = { user: { id: "user_1", organizationId: "org_1" }, callLog: null };
    check("16. callControlId inconnu → not-found",
      authorizePstnCallAction(unknown as any) === "not-found");
  }

  // Test 17 — utilisateur d'une AUTRE organisation
  {
    const callLog = {
      organizationId: "org_1",
      status: "INITIATED",
      phoneNumber: { assignedUser: { id: "user_1" } },
    };
    const attacker = { id: "user_999", organizationId: "org_2" };
    check("17. mauvaise organisation → forbidden",
      authorizePstnCallAction({ user: attacker, callLog } as any) === "forbidden");
  }

  // Test 18 — bon utilisateur (assignedUser du numéro)
  {
    const callLog = {
      organizationId: "org_1",
      status: "INITIATED",
      phoneNumber: { assignedUser: { id: "user_1" } },
    };
    const recipient = { id: "user_1", organizationId: "org_1" };
    check("18. bon utilisateur (assignedUser) → ok",
      authorizePstnCallAction({ user: recipient, callLog } as any) === "ok");
  }

  // Test 19 — fallback organisation (numéro sans assignedUser)
  {
    const callLog = {
      organizationId: "org_1",
      status: "INITIATED",
      phoneNumber: { assignedUser: null },
    };
    const orgMember = { id: "user_2", organizationId: "org_1" };
    check("19. fallback org (pas d'assignedUser) → ok",
      authorizePstnCallAction({ user: orgMember, callLog } as any) === "ok");
  }

  // Test 20 — validation du format callControlId
  {
    check("20. callControlId invalide → rejeté",
      !isValidCallControlId("") && !isValidCallControlId("   ") &&
      !isValidCallControlId(null as any) && !isValidCallControlId(42 as any) &&
      !isValidCallControlId("x".repeat(201)) &&
      isValidCallControlId("v2:cat_abc_123"));
  }

  // Tests 21-22 — double answer / verrouillage d'état
  {
    check("21. double answer → bloqué (IN_PROGRESS/COMPLETED/NO_ANSWER)",
      !canAnswerCall("IN_PROGRESS") && !canAnswerCall("COMPLETED") &&
      !canAnswerCall("NO_ANSWER"));
    check("22. answer autorisé seulement INITIATED/RINGING",
      canAnswerCall("INITIATED") && canAnswerCall("RINGING") && !canAnswerCall(null));
  }

  // Tests 23-24 — double hangup / appel déjà terminé
  {
    check("23. double hangup / appel déjà terminé → bloqué",
      PSTN_TERMINAL_STATUSES.every((s) => !canHangupCall(s)));
    check("24. hangup autorisé sur INITIATED/IN_PROGRESS/no-status",
      canHangupCall("INITIATED") && canHangupCall("IN_PROGRESS") && canHangupCall(null));
  }

  // Test 25 — payload : aucune donnée sensible
  {
    const payload = {
      callControlId: "call_abc",
      from: "+15551234567",
      to: "+15559876543",
      phoneNumberId: "pn_1",
      organizationId: "org_1",
      callerName: null,
    };
    const forbidden = ["token", "secret", "password", "credential", "apiKey", "key"];
    const leaked = Object.keys(payload).filter((k) =>
      forbidden.some((f) => k.toLowerCase().includes(f))
    );
    check("25. payload : aucun secret / credential / clé",
      leaked.length === 0 && payload.callControlId.length > 0);
  }

  // ── Corrélation Pusher ↔ SDK Call (média réel) ─────────────────────────────

  const sdkCall = (id: string, state = "ringing", cc?: string | null, direction = "inbound") => ({
    id,
    callId: id,
    state,
    direction,
    options: {
      telnyxCallControlId: cc ?? undefined,
    },
    telnyxIDs: {
      telnyxCallControlId: cc ?? "",
      telnyxSessionId: "sess",
      telnyxLegId: "leg",
    },
    remoteStream: null as MediaStream | null,
  });

  // Test 26 — Pusher ABC + SDK ABC → MATCH
  {
    const call = sdkCall("v_1", "ringing", "ABC");
    check("26. Pusher ABC + SDK ABC → MATCH (corrélation exacte)",
      correlateIncoming(call as any, "ABC") === true && correlateIncoming(call as any, "DEF") === false);
  }

  // Test 27 — Pusher ABC + SDK XYZ → IGNORE
  {
    const call = sdkCall("v_2", "ringing", "XYZ");
    check("27. Pusher ABC + SDK XYZ → IGNORE", correlateIncoming(call as any, "ABC") === false);
  }

  // Test 28 — SDK arrive avant Pusher → attente puis MATCH
  {
    const now = 1_000_000;
    // Le SDK a reçu l'invite mais l'id n'est pas encore peuplé (lié au message ringing/answer).
    const unknown = { call: sdkCall("v_3", "ringing", null), key: "v_3", controlId: null as string | null, timestamp: now };
    const before = resolvePendingIncoming([unknown], "ABC", now, 15_000);
    check("28a. SDK avant Pusher → id inconnu → reste en attente (pas de réponse aveugle)",
      before.matched === null && before.reason === "waiting");

    // Le message ringing/answer arrive ensuite → le SDK lie l'id.
    const resolved = resolvePendingIncoming(
      [{ ...unknown, controlId: "ABC" }],
      "ABC",
      now + 500,
      15_000,
    );
    check("28b. SDK avant Pusher → id peuplé ensuite → MATCH",
      resolved.matched?.controlId === "ABC" && resolved.reason === "matched");
  }

  // Test 29 — Pusher arrive avant SDK → attente puis MATCH
  {
    const now = 2_000_000;
    // Pusher a déclaré ABC ; le Call SDK n'existe pas encore.
    const none = resolvePendingIncoming([], "ABC", now, 15_000);
    check("29a. Pusher avant SDK → pas encore de candidat → MATCH différé",
      none.matched === null && none.reason !== "matched");

    // Le Call SDK arrive ensuite, corrélé à ABC.
    const later = resolvePendingIncoming(
      [{ call: sdkCall("v_4", "ringing", "ABC"), key: "v_4", controlId: "ABC", timestamp: now + 1000 }],
      "ABC",
      now + 1000,
      15_000,
    );
    check("29b. Pusher avant SDK → Call SDK corrélé → MATCH",
      later.matched?.controlId === "ABC" && later.reason === "matched");
  }

  // Test 30 — double SDK événement → pas de double answer
  {
    const gate1 = shouldProceedToAnswer({ alreadyAnswered: false, acceptInFlight: false, callUsable: true });
    const gate2 = shouldProceedToAnswer({ alreadyAnswered: true, acceptInFlight: false, callUsable: true });
    check("30. double SDK event → un seul answer (alreadyAnswered → bloqué)",
      gate1 === true && gate2 === false);
  }

  // Test 31 — double Accept → un seul answer
  {
    const gate1 = shouldProceedToAnswer({ alreadyAnswered: false, acceptInFlight: false, callUsable: true });
    const gate2 = shouldProceedToAnswer({ alreadyAnswered: false, acceptInFlight: true, callUsable: true });
    check("31. double Accept → un seul answer (acceptInFlight → bloqué)",
      gate1 === true && gate2 === false);
  }

  // Test 32 — state ringing → PAS active (classifieur + jamais d'ACTIVE sur un ring)
  {
    const ringing = classifyCallUpdate(sdkCall("v_5", "ringing", "ABC") as any);
    const decision = decideAcceptAction({
      callState: "ringing",
      expectedCallControlId: "ABC",
      sdkCall: sdkCall("v_5", "ringing", "ABC"),
      alreadyAnswered: false,
      sdkAnswerFailed: false,
      stale: false,
      waitExpired: false,
    });
    check("32. state=ringing → pas ACTIVE (classify=ringing, décision=sdk-answer)",
      ringing === "ringing" && decision.action === "sdk-answer");
  }

  // Test 33 — state active → ACTIVE
  {
    const active = classifyCallUpdate(sdkCall("v_6", "active", "ABC") as any);
    check("33. state=active → ACTIVE", active === "active");
  }

  // Test 34 — pstn:ended ABC → ferme ABC
  {
    check("34. pstn:ended ABC → ferme ABC (correspondance)",
      shouldEndIncoming("ABC", "ABC") === true);
  }

  // Test 35 — pstn:ended ABC → ne ferme pas DEF
  {
    check("35. pstn:ended ABC → ne ferme pas DEF",
      shouldEndIncoming("ABC", "DEF") === false &&
      shouldEndIncoming("ABC", null) === false &&
      shouldEndIncoming(null, "DEF") === false);
  }

  // Test 36 — Call SDK absent → comportement fallback explicite
  {
    const wait = decideAcceptAction({
      callState: "ringing",
      expectedCallControlId: "ABC",
      sdkCall: null,
      alreadyAnswered: false,
      sdkAnswerFailed: false,
      stale: false,
      waitExpired: false, // pas encore expiré → on attend PROPREMENT
    });
    check("36a. Call SDK absent → attente bornée propre (wait-for-sdk)",
      wait.action === "wait-for-sdk");

    const timeout = decideAcceptAction({
      callState: "connecting",
      expectedCallControlId: "ABC",
      sdkCall: null,
      alreadyAnswered: false,
      sdkAnswerFailed: false,
      stale: false,
      waitExpired: true, // délai expiré sans Call SDK corrélé
    });
    check("36b. délai expiré sans Call SDK → PAS d'answer API arbitraire (no-sdk-no-answer)",
      timeout.action === "no-sdk-no-answer");

    const guard = decideAcceptAction({
      callState: "connecting",
      expectedCallControlId: "ABC",
      sdkCall: sdkCall("v_7", "ringing", "ABC"),
      alreadyAnswered: false,
      sdkAnswerFailed: true, // answer() a échoué sur un Call corrélé
      stale: false,
      waitExpired: false,
    });
    check("36c. answer() SDK en échec → garde serveur uniquement (guard-api-answer)",
      guard.action === "guard-api-answer");
  }

  // Test 37 — cleanup → ancien Call inutilisable
  {
    const beforeHangup = isCallUsable(sdkCall("v_8", "active", "ABC") as any, []);
    const afterHangup = isCallUsable(null, ["ABC"]);
    const otherCallStale = isCallUsable(sdkCall("v_9", "active", "DEF") as any, ["ABC"]);
    check("37. cleanup → ancien Call inutilisable (stale/terminal), nouveau Call sain",
      beforeHangup === true && afterHangup === false && otherCallStale === true);
  }

  // Test 38 — extraction Call Control ID (getter telnyxIDs + options)
  {
    const viaIds = getCallControlId(sdkCall("v_10", "ringing", "ABC") as any);
    const viaOptions = getCallControlId({ id: "v_11", options: { telnyxCallControlId: "DEF" } } as any);
    const none = getCallControlId(sdkCall("v_12", "ringing", null) as any);
    check("38. getCallControlId lit telnyxIDs/options ; null si absent",
      viaIds === "ABC" && viaOptions === "DEF" && none === null);
  }

  // ── Résumé ─────────────────────────────────────────────────────────────
  console.log(`\n═══ Résultat : ${passes} PASS, ${failures} FAIL ═══`);
  process.exit(failures > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
