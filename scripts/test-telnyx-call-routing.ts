/**
 * Tests du hardening TELNYX CALL ROUTING — module GROUPE PUR (aucune DB, aucun
 * env, aucun appel Telnyx réel). Exécution : npx tsx scripts/test-telnyx-call-routing.ts
 *
 * A  — Appel sortant géré normal → OUTBOUND_MANAGED.
 * B  — Jambe enfant de transfert reconnue → TRANSFER_CHILD_LEG.
 * C  — La jambe enfant ne déclenche JAMAIS la garde UNMANAGED_CALLER_ID.
 * D  — La jambe enfant ne crée AUCUNE réservation/facturation applicative.
 * E  — Double webhook / replay → UN SEUL transfert (command_id déterministe +
 *     dédup WebhookEvent P2002).
 * F  — Même call_session_id mais client_state incompatible → PAS child.
 * G  — Bon client_state mais mauvais connection_id → UNKNOWN (fail-closed).
 * H  — Transfert rejoué → command_id identique ; nouvelle intention → différent.
 * I  — Dialer campagne : command_id déterministe par tentative logique, retry
 *     transitoire borné, échec permanent → FAILED.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  classifyTelnyxCallInitiated,
  buildTelnyxTransferCommandId,
  buildTelnyxTransferClientState,
  isTelnyxTransferChildLeg,
  requiresPstnReservation,
  shouldRejectUnmanagedOutbound,
  TELNYX_TRANSFER_KIND,
} from "../lib/telnyx-call-routing";
import {
  buildCampaignDialCommandId,
  extractStoredAttemptId,
  nextCampaignDialerRetry,
  campaignDialerRetryRank,
  isTransientDialFailure,
} from "../lib/campaign-dialer-policy";

const ROOT = join(__dirname, "..");

let failures = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const transferKind = TELNYX_TRANSFER_KIND;

// ── A : légitimité du numéro sortant géré ────────────────────────────────────
{
  const kind = classifyTelnyxCallInitiated({
    direction: "outgoing",
    connectionId: "cxn-123",
    expectedConnectionId: "cxn-123",
    clientState: null,
    managedCallerFrom: true,
  });
  check("A1 | sortant géré sans client_state → OUTBOUND_MANAGED", kind === "OUTBOUND_MANAGED", `got ${kind}`);

  const unmanaged = classifyTelnyxCallInitiated({
    direction: "outgoing",
    connectionId: "cxn-123",
    expectedConnectionId: "cxn-123",
    clientState: null,
    managedCallerFrom: false,
  });
  check("A2 | sortant non géré sans client_state → UNKNOWN (fail-closed)", unmanaged === "UNKNOWN", `got ${unmanaged}`);
}

// ── B : jambe enfant de transfert reconnue ───────────────────────────────────
{
  const validChild = classifyTelnyxCallInitiated({
    direction: "outgoing",
    connectionId: "cxn-1",
    expectedConnectionId: "cxn-1",
    clientState: {
      kind: transferKind,
      v: 1,
      sourceCallControlId: "ccic-source",
      sourceCallLogId: "clog-source",
    },
    managedCallerFrom: false,
    transferSourceLegExists: true,
  });
  check("B1 | client_state de transfert + source vérifiée → TRANSFER_CHILD_LEG",
    validChild === "TRANSFER_CHILD_LEG", `got ${validChild}`);
}

// ── C : jamais de garde UNMANAGED sur la jambe enfant ────────────────────────
{
  const rejectChild = shouldRejectUnmanagedOutbound({ kind: "TRANSFER_CHILD_LEG", managedCallerFrom: false });
  check("C1 | TRANSFER_CHILD_LEG → pas de garde UNMANAGED", rejectChild === false);
  const rejectUnknown = shouldRejectUnmanagedOutbound({ kind: "UNKNOWN", managedCallerFrom: false });
  check("C2 | UNKNOWN → pas de garde UNMANAGED (fail-closed)", rejectUnknown === false);
  const rejectManaged = shouldRejectUnmanagedOutbound({ kind: "OUTBOUND_MANAGED", managedCallerFrom: true });
  check("C3 | OUTBOUND_MANAGED géré → pas de garde", rejectManaged === false);
  const rejectReal = shouldRejectUnmanagedOutbound({ kind: "OUTBOUND_MANAGED", managedCallerFrom: false });
  check("C4 | OUTBOUND_MANAGED non géré → garde UNMANAGED", rejectReal === true);
}

// ── D : aucune réservation/facturation applicative sur la jambe enfant ────────
{
  check("D1 | TRANSFER_CHILD_LEG → requiresPstnReservation=false",
    requiresPstnReservation("TRANSFER_CHILD_LEG") === false);
  check("D2 | UNKNOWN → requiresPstnReservation=false (fail-closed)",
    requiresPstnReservation("UNKNOWN") === false);
  check("D3 | INBOUND_CUSTOMER → réservation requise",
    requiresPstnReservation("INBOUND_CUSTOMER") === true);
  check("D4 | OUTBOUND_MANAGED → réservation requise",
    requiresPstnReservation("OUTBOUND_MANAGED") === true);
  check("D5 | isTelnyxTransferChildLeg(direction=TRANSFER) → true",
    isTelnyxTransferChildLeg({ direction: "TRANSFER", callPurpose: "AI_TRANSFER" }) === true);
  check("D6 | isTelnyxTransferChildLeg(PSTN_INBOUND) → false",
    isTelnyxTransferChildLeg({ direction: "INBOUND", callPurpose: "PSTN_INBOUND" }) === false);
}

// ── E : double webhook → UN SEUL transfert ───────────────────────────────────
{
  const a = buildTelnyxTransferCommandId({ sourceCallControlId: "ccic-1", target: "sip:LiveKit", purpose: "LIVEKIT_AI" });
  const b = buildTelnyxTransferCommandId({ sourceCallControlId: "ccic-1", target: "sip:LiveKit", purpose: "LIVEKIT_AI" });
  check("E1 | command_id de transfert DÉTERMINISTE (retry Telnyx = même commande)", a === b, `${a} vs ${b}`);

  const webhook = readFileSync(join(ROOT, "app/api/webhooks/telecom/route.ts"), "utf8");
  check("E2 | webhook route dédup WebhookEvent P2002 toujours en place",
    webhook.includes("webhookEvent.create") && webhook.includes("P2002"));
  check("E3 | transfer utilise buildTelnyxTransferCommandId",
    webhook.includes("buildTelnyxTransferCommandId"));
  check("E4 | transfer envoie target_leg_client_state",
    webhook.includes("target_leg_client_state"));
  check("E5 | jambe enfant idempotente via P2002 (parentCallLogId @unique)",
    webhook.includes("P2002") && webhook.includes("TELNYX_TRANSFER_CHILD_CREATED"));
}

// ── F : même call_session_id mais client_state incompatible → pas child ─────
{
  // Le classifieur ignore call_session_id : sans client_state de transfert
  // crédible, un leg sortant reste UNKNOWN malgré un session_id partagé.
  const kind = classifyTelnyxCallInitiated({
    direction: "outgoing",
    connectionId: "cxn-1",
    expectedConnectionId: "cxn-1",
    clientState: null,
    managedCallerFrom: false,
  });
  check("F1 | call_session_id seul → UNKNOWN (pas TRANSFER_CHILD_LEG)", kind !== "TRANSFER_CHILD_LEG" && kind === "UNKNOWN", `got ${kind}`);

  const weird = classifyTelnyxCallInitiated({
    direction: "outgoing",
    connectionId: "cxn-1",
    expectedConnectionId: "cxn-1",
    clientState: { kind: "SOMETHING_ELSE", sourceCallControlId: "x" },
    managedCallerFrom: false,
  });
  check("F2 | client_state d'un autre type → UNKNOWN", weird === "UNKNOWN", `got ${weird}`);
}

// ── G : bon client_state mais mauvais connection_id → UNKNOWN ────────────────
{
  const wrongConn = classifyTelnyxCallInitiated({
    direction: "outgoing",
    connectionId: "cxn-999",
    expectedConnectionId: "cxn-1",
    clientState: { kind: transferKind, v: 1, sourceCallControlId: "ccic-s", sourceCallLogId: "clog-s" },
    transferSourceLegExists: true,
  });
  check("G1 | bon client_state, mauvais connection_id → UNKNOWN", wrongConn === "UNKNOWN", `got ${wrongConn}`);
  check("G2 | sortant en dehors de notre connexion → jamais OUTBOUND_*",
    classifyTelnyxCallInitiated({
      direction: "outgoing",
      connectionId: "cxn-999",
      expectedConnectionId: "cxn-1",
      clientState: null,
      managedCallerFrom: true,
    }) === "UNKNOWN");
}

// ── H : replay idempotent / nouvelle intention différente ────────────────────
{
  const replay1 = buildTelnyxTransferCommandId({ sourceCallControlId: "ccic-A", target: "sip:t", purpose: "LIVEKIT_AI" });
  const replay2 = buildTelnyxTransferCommandId({ sourceCallControlId: "ccic-A", target: "sip:t", purpose: "LIVEKIT_AI" });
  const newIntention = buildTelnyxTransferCommandId({ sourceCallControlId: "ccic-A", target: "sip:other", purpose: "LIVEKIT_AI" });
  check("H1 | replay → command_id identique", replay1 === replay2);
  check("H2 | nouvelle intention (autre cible) → command_id différent", replay1 !== newIntention, `${replay1} == ${newIntention}`);

  const src = buildTelnyxTransferClientState({
    sourceCallControlId: "ccic-A",
    sourceCallLogId: "clog-1",
    organizationId: "org-1",
    purpose: "LIVEKIT_AI",
    target: false,
  });
  const tgt = buildTelnyxTransferClientState({
    sourceCallControlId: "ccic-A",
    sourceCallLogId: "clog-1",
    organizationId: "org-1",
    purpose: "LIVEKIT_AI",
    target: true,
  });
  check("H3 | client_state source ≠ target_leg_client_state", src !== tgt);
  const decoded = JSON.parse(Buffer.from(tgt, "base64").toString("utf8"));
  check("H4 | target_leg_client_state encode kind en clair (base64, sans secret)",
    decoded.kind === TELNYX_TRANSFER_KIND && decoded.sourceCallControlId === "ccic-A",
    JSON.stringify(decoded));
}

// ── I : dialer campagne — idempotence + retry borné ──────────────────────────
{
  const c1 = buildCampaignDialCommandId({ campaignId: "cmp-1", recipientId: "r-1", attemptId: "a-uuid-1" });
  const c2 = buildCampaignDialCommandId({ campaignId: "cmp-1", recipientId: "r-1", attemptId: "a-uuid-1" });
  const c3 = buildCampaignDialCommandId({ campaignId: "cmp-1", recipientId: "r-1", attemptId: "a-uuid-new" });
  check("I1 | command_id campagne DÉTERMINISTE par attemptId", c1 === c2);
  check("I2 | nouvel attemptId → nouveau command_id", c1 !== c3);

  const stored = "01234567-89ab-cdef-0123-456789abcdef";
  const msg = `campaign:${"cmp-1"}:${"r-1"}:${stored}`;
  check("I3 | extractStoredAttemptId(UUID) → UUID conservé pour le retry", extractStoredAttemptId(stored) === stored);
  check("I4 | extractStoredAttemptId(callControlId) → null (nouvel essai)", extractStoredAttemptId("ccic-abc") === null);
  check("I5 | extractStoredAttemptId(null) → null", extractStoredAttemptId(null) === null);
  check("I6 | extractStoredAttemptId(command_id) → null", extractStoredAttemptId(msg) === null);

  check("I7 | PENDING→RETRY_1", nextCampaignDialerRetry("PENDING") === "RETRY_1");
  check("I8 | RETRY_2→RETRY_3", nextCampaignDialerRetry("RETRY_2") === "RETRY_3");
  check("I9 | RETRY_3→null (exhaustion)", nextCampaignDialerRetry("RETRY_3") === null);
  check("I10 | rang RETRY_3=3", campaignDialerRetryRank("RETRY_3") === 3);

  check("I11 | 429 → transitoire", isTransientDialFailure(429, null) === true);
  check("I12 | 5xx → transitoire", isTransientDialFailure(503, {}) === true);
  check("I13 | 90103 (DPS) → transitoire", isTransientDialFailure(422, { errors: [{ code: "90103" }] }) === true);
  check("I14 | 400 sans 90103 → permanent", isTransientDialFailure(400, { errors: [{ code: "10011" }] }) === false);
  check("I15 | 422 permanent", isTransientDialFailure(422, {}) === false);

  const dialer = readFileSync(join(ROOT, "app/api/workers/dialer/route.ts"), "utf8");
  check("I16 | dialer envoie command_id déterministe",
    dialer.includes("buildCampaignDialCommandId") && dialer.includes("command_id: commandId"));
  check("I17 | dialer requeue les retry (status in CAMPAIGN_DIALER_STATUSES)",
    dialer.includes("CAMPAIGN_DIALER_STATUSES"));
  check("I18 | dialer conserve messageId=attemptId pendant le retry",
    dialer.includes("storedAttemptId") && dialer.includes("messageId: attemptId"));
  check("I19 | échec permanent → messageId réinitialisé (FAILED)",
    dialer.includes("messageId: null"));
}

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);