/**
 * Validation LIVE contrôlée du TELNYX CALL ROUTING (scénario inbound → AI →
 * transfer LiveKit → child leg → answer → hangup).
 *
 * SOUS-COMMANDES :
 *   npx tsx scripts/live-test-telnyx-call-routing.ts preflight [--json]
 *   npx tsx scripts/live-test-telnyx-call-routing.ts start --number <e164> [--label <s>]
 *   npx tsx scripts/live-test-telnyx-call-routing.ts report [--mins <n>]
 *
 * - preflight : contrôle les préconditions, SANS imprimer aucun secret.
 * - start     : snapshot avant test (wallet, réservations, CallLogs, WebhookEvents)
 *               pour la fenêtre ; imprime le numéro à appeler.
 * - report    : rejoue les contrôles A–L contre la base après l'appel et rend
 *               TELNYX_ROUTING_LIVE_VALIDATION = PASS|FAIL (+ premier événement).
 *
 * Lecture SEULE de la base. Aucun appel Telnyx initié, aucun secret/Token loggé.
 * Exit code : 0 = PASS, 1 = FAIL. Fichiers : <STATE>/live-test-snapshot.json,
 * <STATE>/live-test-report.json.
 *
 * Les types de transactions wallet (PSTN_HOLD/PSTN_CALL/PSTN_CALL_REFUND) et
 * les identités legs sont conforme à lib/pstn-billing.ts et prisma/schema.prisma.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const ROOT = join(__dirname, "..");

// ── Chargement .env / .env.local (sans dotenv) AVANT tout accès Prisma ─────
for (const file of [".env", ".env.local"]) {
  const p = join(ROOT, file);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !m[1].startsWith("NEXT_PUBLIC") && !(m[1] in process.env)) {
      let v = m[2];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}
if (process.env.DATABASE_URL?.includes("pgbouncer=true") && !/connection_limit=/.test(process.env.DATABASE_URL)) {
  process.env.DATABASE_URL += "&connection_limit=1&pool_timeout=120";
}

const STATE_DIR = process.env.LIVE_TEST_STATE_DIR || join(tmpdir(), "opencode", "telnyx-live");
mkdirSync(STATE_DIR, { recursive: true });
const SNAPSHOT = join(STATE_DIR, "live-test-snapshot.json");
const REPORT = join(STATE_DIR, "live-test-report.json");

const prisma = new PrismaClient();

const TX_HOLD = "PSTN_CALL_HOLD";
const TX_SETTLE = "PSTN_CALL";
const TX_REFUND = "PSTN_CALL_REFUND";

let failures = 0;
let checks = 0;

function check(name: string, ok: boolean, detail = "") {
  checks++;
  if (ok) console.log(`PASS  [${name}]`);
  else {
    failures++;
    console.log(`FAIL  [${name}]${detail ? ` — ${detail}` : ""}`);
  }
}

async function pickTestNumber(numberArg?: string) {
  if (numberArg) {
    const n = await prisma.phoneNumber.findUnique({
      where: { number: numberArg },
      include: { aiEmployee: true, organization: { include: { pricingPlan: true } } },
    });
    return n;
  }
  return prisma.phoneNumber.findFirst({
    where: { status: "ACTIVE", aiEmployee: { isActive: true } },
    include: { aiEmployee: true, organization: { include: { pricingPlan: true } } },
    orderBy: { createdAt: "asc" },
  });
}

async function preflight() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("[preflight] DB : OK");

  const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
  console.log("[preflight] SystemSettings :");
  console.log(`  telnyxApiKey      : ${settings?.telnyxApiKey ? "DÉFINIE (God Mode)" : "ABSENTE (env)"}`);
  console.log(`  telnyxPublicKey   : ${settings?.telnyxPublicKey ? "DÉFINIE" : "ABSENTE"}`);
  console.log(`  telnyxConnectionId: ${settings?.telnyxConnectionId || "(non défini — voir TELNYX_SIP_CONNECTION_ID env)"}`);

  const livekit = process.env.LIVEKIT_SIP_URI;
  console.log(`[preflight] LIVEKIT_SIP_URI local : ${livekit ? "défini (env local)" : "ABSENT en local — doit exister dans l'ENV DE DÉPLOIEMENT (Vercel)"}`);
  console.log("[preflight] ⚠ les PLACEHOLDERS TELNYX_* locaux (sk-placeholder-e2e-not-used) sont ignorés : God Mode (DB) prime.");

  const candidates = await prisma.phoneNumber.findMany({
    where: { status: "ACTIVE", aiEmployee: { isActive: true } },
    include: {
      aiEmployee: true,
      organization: { include: { pricingPlan: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  if (candidates.length === 0) {
    console.log("[preflight] AUCUN numéro de test (ACTIVE + IA active). Impossible de lancer le scénario.");
    process.exitCode = 1;
    return;
  }
  console.log(`[preflight] ${candidates.length} numéro(s) de test :`);
  for (const n of candidates) {
    console.log(
      `  ${n.number} | org=${n.organizationId} (${n.organization.name}) | AI=${n.aiEmployee?.name ?? "?"} | ` +
      `plan=${n.organization.pricingPlan?.name ?? "?"} min=${n.organization.pricingPlan?.maxCallDurationSeconds ?? 3600}s preAuth=${n.organization.pricingPlan?.preAuthRequired ?? false} | wallet=${n.organization.walletBalance.toNumber()}`,
    );
  }
  console.log(`[preflight] complète. Choisir --number <e164> pour start.`);
}

async function start(numberArg?: string, label = "live-validation") {
  const number = await pickTestNumber(numberArg);
  if (!number) {
    console.error("[start] Aucun numéro de test (ACTIVE + IA active).");
    process.exitCode = 1;
    return;
  }
  const orgId = number.organizationId;
  const windowStart = new Date();

  const [org, pendingRes, inboundLast2h] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.callReservation.count({ where: { organizationId: orgId, status: "PENDING" } }),
    prisma.callLog.count({
      where: { organizationId: orgId, phoneNumberId: number.id, direction: "INBOUND", callPurpose: "PSTN_INBOUND", startedAt: { gte: new Date(Date.now() - 2 * 3600 * 1000) } },
    }),
  ]);

  const snapshot = {
    label,
    windowStart: windowStart.toISOString(),
    number: number.number,
    numberId: number.id,
    organizationId: orgId,
    walletBalanceBefore: org?.walletBalance.toNumber() ?? null,
    pendingReservationsBefore: pendingRes,
    inboundPstnLast2hBefore: inboundLast2h,
  };
  writeFileSync(SNAPSHOT, JSON.stringify(snapshot, null, 2));
  console.log(`[start] Snapshot écrit : ${SNAPSHOT}`);
  console.log(`[start] Dates : ${snapshot.windowStart} → maintenant`);
  console.log(`[start] Numéro à appeler : ${number.number} (${label})`);
  console.log("── APPELER CE NUMÉRO DEPUIS UN TÉLÉPHONE EXTERNE, LAISSER RÉPONDRE L'IA, PUIS RACCROCHER. ──");
  console.log("Ensuite : npx tsx scripts/live-test-telnyx-call-routing.ts report");
}

async function report(minsArg?: number) {
  if (!existsSync(SNAPSHOT)) {
    console.error("[report] AUCUN snapshot. Lancer d'abord : ... start --number <e164>");
    process.exitCode = 1;
    return;
  }
  const snapshot = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  const since = new Date(snapshot.windowStart);
  const mins = minsArg ?? Math.max(1, Math.ceil((Date.now() - since.getTime()) / 60000));
  const windowEnd = minsArg ? new Date(since.getTime() + mins * 60000) : new Date();

  const orgId = snapshot.organizationId as string;
  const phoneNumberId = snapshot.numberId as string;

  const callLogs = await prisma.callLog.findMany({
    where: { organizationId: orgId, startedAt: { gte: since, lte: windowEnd } },
    orderBy: { startedAt: "asc" },
  });
  const reservations = await prisma.callReservation.findMany({
    where: { organizationId: orgId, createdAt: { gte: since, lte: windowEnd } },
  });
  const walletTx = await prisma.walletTransaction.findMany({
    where: { organizationId: orgId, createdAt: { gte: since, lte: windowEnd } },
    orderBy: { createdAt: "asc" },
  });
  const webhookEvents = await prisma.webhookEvent.findMany({
    where: { organizationId: orgId, processedAt: { gte: since, lte: windowEnd } },
    orderBy: { processedAt: "asc" },
  });
  const orgNow = await prisma.organization.findUnique({ where: { id: orgId } });

  const legA = callLogs.find((c) => c.direction === "INBOUND" && c.callPurpose === "PSTN_INBOUND" && c.phoneNumberId === phoneNumberId);
  const legB = callLogs.find((c) => c.direction === "TRANSFER" && c.callPurpose === "AI_TRANSFER" && legA && c.parentCallLogId === legA.id);
  const allB = callLogs.filter((c) => c.direction === "TRANSFER" && c.callPurpose === "AI_TRANSFER" && legA && c.parentCallLogId === legA.id);

  const result: Record<string, unknown> = {
    verdict: "PENDING",
    windowStart: since.toISOString(),
    windowEnd: windowEnd.toISOString(),
    number: snapshot.number,
    organizationId: orgId,
    legs: callLogs.map((c) => ({
      id: c.id,
      call_control_id: c.telnyxCallControlId,
      direction: c.direction,
      callPurpose: c.callPurpose,
      status: c.status,
      parentCallLogId: c.parentCallLogId,
      isBilled: c.isBilled,
      duration: c.duration,
      fromNumber: c.fromNumber,
      toNumber: c.toNumber,
      hangupCause: c.hangupCause,
      answeredAt: c.answeredAt?.toISOString() ?? null,
      endedAt: c.endedAt?.toISOString() ?? null,
    })),
    webhookEventTypes: webhookEvents.map((e) => ({ id: e.id, eventId: e.eventId, type: e.type, processedAt: e.processedAt.toISOString() })),
    walletTransactions: walletTx.map((t) => ({ type: t.type, amount: t.amount.toNumber(), callControlId: t.callControlId })),
    reservations: reservations.map((r) => ({ id: r.id, callLogId: r.callLogId, status: r.status, amount: r.amount.toNumber(), settledAt: r.settledAt?.toISOString() ?? null })),
    walletBalanceBefore: snapshot.walletBalanceBefore,
    walletBalanceAfter: orgNow?.walletBalance.toNumber() ?? null,
  };

  console.log(`\n── RAPPORT LIVE — ${snapshot.label} (${since.toISOString()} → ${windowEnd.toISOString()}) ──`);
  console.log(`Legs détectés : ${callLogs.length}`);

  // A — jambe inbound classée
  if (legA) {
    check("A | jambe inbound classée PSTN_INBOUND", legA.direction === "INBOUND" && legA.callPurpose === "PSTN_INBOUND", legA.telnyxCallControlId);
  } else {
    check("A | jambe inbound classée PSTN_INBOUND", false, "aucune CallLog INBOUND/PSTN_INBOUND pour le numéro de test dans la fenêtre");
  }

  // B — transfer créé une seule fois
  if (legA) {
    check("B | transfer créé UNE seule fois (1 child leg)", allB.length === 1, `child count=${allB.length}`);
  } else {
    check("B | transfer créé UNE seule fois (1 child leg)", false, "pas de legA");
  }

  // C — child leg = TRANSFER_CHILD_LEG
  if (legB) {
    check("C | child leg TRANSFER/AI_TRANSFER", legB.direction === "TRANSFER" && legB.callPurpose === "AI_TRANSFER" && legB.parentCallLogId === legA?.id, legB.telnyxCallControlId);
    check("C | child leg isBilled=false", legB.isBilled === false);
  } else {
    check("C | child leg TRANSFER/AI_TRANSFER", false, "aucun child leg");
    check("C | child leg isBilled=false", false, "aucun child leg");
  }

  // D — aucun UNMANAGED_CALLER_ID
  const unmanagedCaller = callLogs.filter((c) => c.hangupCause === "UNMANAGED_CALLER_ID");
  check("D | aucun UNMANAGED_CALLER_ID", unmanagedCaller.length === 0, unmanagedCaller.map((c) => c.telnyxCallControlId).join(","));

  // E — aucun UNMANAGED_DESTINATION incorrect
  const unmanagedDest = callLogs.filter((c) => c.hangupCause === "UNMANAGED_DESTINATION");
  check("E | aucun UNMANAGED_DESTINATION incorrect", unmanagedDest.length === 0, unmanagedDest.map((c) => c.telnyxCallControlId).join(","));

  // F — aucun double transfer
  check("F | aucun double transfer", allB.length <= 1, `child count=${allB.length}`);

  // G — aucune double CallReservation (A seule)
  if (legA) {
    const resA = reservations.filter((r) => r.callLogId === legA.id);
    const resB = legB ? reservations.filter((r) => r.callLogId === legB.id) : [];
    check("G | une seule réservation sur la jambe A", resA.length === 1, `count=${resA.length}`);
    check("G | AUCUNE réservation sur la jambe B", resB.length === 0, `count=${resB.length}`);
  } else {
    check("G | une seule réservation sur la jambe A", false, "pas de legA");
    check("G | AUCUNE réservation sur la jambe B", false, "pas de legA");
  }

  // H — aucun double settlement
  if (legA) {
    const settleA = walletTx.filter((t) => t.type === TX_SETTLE && t.callControlId === legA.telnyxCallControlId);
    check("H | settlement UNIQUE sur jambe A", settleA.length === 1, `count=${settleA.length}`);
  } else {
    check("H | settlement UNIQUE sur jambe A", false, "pas de legA");
  }
  {
    const settleB = walletTx.filter((t) => t.type === TX_SETTLE && legB && t.callControlId === legB.telnyxCallControlId);
    check("H | AUCUN settlement sur jambe B", settleB.length === 0, `count=${settleB.length}`);
  }

  // I — aucun double wallet debit
  if (legA) {
    const holdA = walletTx.filter((t) => t.type === TX_HOLD && t.callControlId === legA.telnyxCallControlId);
    const settleA = walletTx.filter((t) => t.type === TX_SETTLE && t.callControlId === legA.telnyxCallControlId);
    const refundA = walletTx.filter((t) => t.type === TX_REFUND && t.callControlId === legA.telnyxCallControlId);
    check("I | hold UNIQUE sur jambe A", holdA.length <= 1, `count=${holdA.length}`);
    check("I | settle UNIQUE sur jambe A", settleA.length === 1, `count=${settleA.length}`);
    const txDelta = holdA.length * -Math.abs(holdA[0]?.amount.toNumber() ?? 0) +
      settleA.length * -Math.abs(settleA[0]?.amount.toNumber() ?? 0) +
      refundA.length * Math.abs(refundA[0]?.amount.toNumber() ?? 0);
    const walletDelta = (orgNow?.walletBalance.toNumber() ?? 0) - (snapshot.walletBalanceBefore ?? 0);
    const windowTxDelta = walletTx.reduce((s, t) => s + t.amount.toNumber(), 0);
    check("I | ledger wallet cohérent (Σ window ≈ Δbalance)", Math.abs(windowTxDelta - walletDelta) < 0.001, `Σ=${Number(windowTxDelta.toFixed(4))} vs Δ=${Number(walletDelta.toFixed(4))}`);
    result.ledger = { hold: holdA.map((t) => t.amount.toNumber()), settle: settleA.map((t) => t.amount.toNumber()), refund: refundA.map((t) => t.amount.toNumber()), internalCost: legA.cost, providerCost: legA.providerCost };
  } else {
    check("I | hold UNIQUE sur jambe A", false, "pas de legA");
    check("I | settle UNIQUE sur jambe A", false, "pas de legA");
    check("I | ledger wallet cohérent (Σ window ≈ Δbalance)", false, "pas de legA");
  }

  // J — hangup final propre
  if (legA) {
    const finalOkA = !!legA.endedAt && ["COMPLETED", "NO_ANSWER", "FAILED"].includes(legA.status);
    check("J | jambe A finalisée (endedAt + statut terminal)", finalOkA, `${legA.status} endedAt=${!!legA.endedAt}`);
  } else {
    check("J | jambe A finalisée (endedAt + statut terminal)", false, "pas de legA");
  }
  if (legB) {
    const finalOkB = !!legB.endedAt && ["COMPLETED", "NO_ANSWER", "FAILED"].includes(legB.status);
    check("J | jambe B finalisée (endedAt + statut terminal)", finalOkB, `${legB.status} endedAt=${!!legB.endedAt}`);
  } else {
    check("J | jambe B finalisée (endedAt + statut terminal)", false, "pas de child leg");
  }

  // K — CallLog final cohérent
  if (legA && legB) {
    check("K | child lié au parent (parentCallLogId)", legB.parentCallLogId === legA.id);
    check("K | A billée / B non billée", legA.isBilled && !legB.isBilled, `A.isBilled=${legA.isBilled} B.isBilled=${legB.isBilled}`);
    check("K | duration A ≥ 0", legA.duration >= 0, `durée=${legA.duration}s`);
    check("K | même caller (A.from == B.from)", legA.fromNumber === legB.fromNumber, `${legA.fromNumber} vs ${legB.fromNumber}`);
  } else {
    check("K | child lié au parent (parentCallLogId)", false, "legs absents");
    check("K | A billée / B non billée", false, "legs absents");
    check("K | duration A ≥ 0", false, "pas de legA");
    check("K | même caller (A.from == B.from)", false, "legs absents");
  }

  // L — WebhookEvent idempotent
  const ids = webhookEvents.map((e) => e.eventId);
  const dist = new Set(ids);
  check("L | WebhookEvent sans doublon (event.id unique)", dist.size === ids.length, `${ids.length} total / ${dist.size} distincts`);
  check("L | call.initiated/answered présents pour A et B",
    (!!legA && webhookEvents.some((e) => e.type === "call.answered")) &&
    (!!legB && webhookEvents.some((e) => e.type === "call.initiated") && webhookEvents.some((e) => e.type === "call.answered")),
    `events=${webhookEvents.map((e) => e.type).join(",")}`);

  // Comparaison des coûts (légitime, non secret)
  console.log("\n── COMPARAISON COÛTS ──");
  if (legA) {
    console.log(`Internal cost (jambe A) : ${legA.cost ?? "—"}  billedAmount=${legA.billedAmount ?? "—"}  isBilled=${legA.isBilled}`);
    console.log(`Provider cost (Telnyx réel si capturé) : ${legA.providerCost ?? "non renseigné (dépend du payload hangup)"}`);
    console.log(`Wallet : avant=${snapshot.walletBalanceBefore} → après=${orgNow?.walletBalance.toNumber()}`);
    const walletLedger = walletTx.reduce((s: number, t) => s + t.amount.toNumber(), 0);
    console.log(`Σ ledger wallet (fenêtre) : ${Number(walletLedger.toFixed(4))}`);
  }
  const legCount = callLogs.length;
  console.log(`Nombre de legs (fenêtre) : ${legCount === 0 ? "0 (appel non arrivé au webhook ?)" : legCount}${legB ? " (A + child B)" : ""}`);
  if (legCount === 0) {
    console.log("⚠ Aucun CallLog dans la fenêtre — l'appel n'a peut-être pas atteint le webhook (portail v2 ? URL ? clé ? DB deployée ?).");
  }

  const verdict = failures === 0 ? "PASS" : "FAIL";
  result.verdict = verdict;
  result.checks = checks;
  result.failures = failures;
  writeFileSync(REPORT, JSON.stringify(result, null, 2));
  console.log(`\nRésultat : ${checks} contrôles, ${failures} échec(s)`);
  console.log(`TELNYX_ROUTING_LIVE_VALIDATION = ${verdict}`);
  if (verdict === "FAIL") {
    console.log("→ premier événement fautif à remonter : cf. contrôles FAIL ci-dessus / TELEMETRY des legs.");
  }
  console.log(`(rapport détaillé : ${REPORT})`);
  process.exitCode = verdict === "PASS" ? 0 : 1;
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const number = args.length > 0 && args.some((a) => a === "--number") ? args[args.indexOf("--number") + 1] : undefined;
  const label = args.some((a) => a === "--label") ? args[args.indexOf("--label") + 1] : "live-validation";
  const mins = args.some((a) => a === "--mins") ? Number(args[args.indexOf("--mins") + 1]) || undefined : undefined;
  try {
    if (cmd === "preflight") await preflight();
    else if (cmd === "start") await start(number, label);
    else if (cmd === "report") await report(mins);
    else {
      console.error("Usage: preflight | start --number <e164> [--label <s>] | report [--mins <n>]");
      process.exitCode = 1;
    }
  } catch (err) {
    console.error(`[live-test] ERREUR :`, err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();