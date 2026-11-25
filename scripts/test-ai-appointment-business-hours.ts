/**
 * Tests PHASE 4A.2 — horaires d'ouverture (business hours) appliqués à
 * create_appointment.
 *
 * Couvre : validation de configuration, hiérarchie employé→organisation,
 * fenêtre multiples par jour, jours fermés, containment strict (aucun
 * débordement partiel), bornes incluses, fuseau IANA + DST, isolation
 * multi-tenant, comportement sans configuration (non restreint), erreur
 * contrôlée TIME_OUTSIDE_BUSINESS_HOURS + données structurées, mapping HTTP et
 * événements d'audit. Aucune base requise (writer en mémoire).
 *
 * Exécution : npx tsx scripts/test-ai-appointment-business-hours.ts
 */

import { executeAIToolCall } from '../lib/ai-tools/execute';
import { handleTelnyxAIToolWebhook } from '../lib/ai-tools/webhook/handler';
import { createInMemoryTelnyxAIToolReplayClaimer } from '../lib/ai-tools/webhook/replay-claims';
import { createAIToolRateLimiter } from '../lib/ai-tools/rate-limit';
import { createInMemoryReplayStore } from '../lib/ai-tools/replay';
import {
  createMemoryEventSink,
  type AIToolMemoryEventSink,
} from '../lib/ai-tools/observability';
import {
  evaluateBusinessHours,
  resolveBusinessHours,
  validateBusinessHoursConfig,
  type BusinessHoursWindowRecord,
} from '../lib/ai-tools/business-hours';
import { getZonedParts, zonedLocalToUtc } from '../lib/ai-tools/time';
import type {
  AIToolDataAccess,
  AIEmployeeIdentityRecord,
} from '../lib/ai-tools/data-access';
import type { AIToolDeps } from '../lib/ai-tools/types';
import type { AppointmentWriter } from '../lib/ai-tools/appointments';
import { createMemoryAppointmentWriter } from './helpers/memory-appointment-writer';

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORG_A = 'org-a';
const ORG_B = 'org-b';
const ASSISTANT_WA = 'assistant-write-a';
const ASSISTANT_WB = 'assistant-write-b';

const NOW_MS = Date.parse('2026-05-01T12:00:00.000Z'); // Friday

const employeeWA: AIEmployeeIdentityRecord = {
  id: 'emp-wa',
  organizationId: ORG_A,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: ['create_appointment'],
};
const employeeWB: AIEmployeeIdentityRecord = {
  id: 'emp-wb',
  organizationId: ORG_B,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: ['create_appointment'],
};

const employees: Record<string, AIEmployeeIdentityRecord> = {
  [ASSISTANT_WA]: employeeWA,
  [ASSISTANT_WB]: employeeWB,
};

const fakeDb: AIToolDataAccess = {
  async findEmployeeByAssistantId(assistantId) {
    return employees[assistantId] ?? null;
  },
  async findContactByPhone() {
    return null;
  },
  async searchContacts() {
    return [];
  },
  async getContact() {
    return null;
  },
  async searchOpportunities() {
    return [];
  },
  async getOpportunity() {
    return null;
  },
};

// Lun–Ven, 09:00–12:00 et 13:00–17:00 (deux fenêtres par jour).
const MON_FRI_TWO_WINDOWS: BusinessHoursWindowRecord[] = [1, 2, 3, 4, 5]
  .flatMap((day) => [
    { dayOfWeek: day, opensAt: '09:00', closesAt: '12:00' },
    { dayOfWeek: day, opensAt: '13:00', closesAt: '17:00' },
  ]);

function allDaysTwoWindows(): BusinessHoursWindowRecord[] {
  return [0, 1, 2, 3, 4, 5, 6].flatMap((day) => [
    { dayOfWeek: day, opensAt: '09:00', closesAt: '12:00' },
    { dayOfWeek: day, opensAt: '13:00', closesAt: '17:00' },
  ]);
}

function makeWriter(config: {
  tzA?: string | null;
  tzB?: string | null;
  byOrg?: Record<string, BusinessHoursWindowRecord[]>;
  byEmployee?: Record<string, BusinessHoursWindowRecord[]>;
}) {
  return createMemoryAppointmentWriter({
    timezones: {
      [ORG_A]: config.tzA === undefined ? 'UTC' : config.tzA,
      [ORG_B]: config.tzB === undefined ? 'UTC' : config.tzB,
    },
    businessHours: {
      byOrganization: config.byOrg,
      byEmployee: config.byEmployee,
    },
  });
}

let reqSeq = 0;
function makeDeps(
  writer: AppointmentWriter,
  overrides: Partial<AIToolDeps> = {}
): AIToolDeps {
  return {
    db: fakeDb,
    rateLimiter: createAIToolRateLimiter(),
    replayStore: createInMemoryReplayStore(() => NOW_MS),
    events: createMemoryEventSink(),
    now: () => NOW_MS,
    generateRequestId: () => `req-${++reqSeq}`,
    appointments: writer,
    ...overrides,
  };
}

async function run(
  assistantId: string,
  args: Record<string, unknown>,
  writer: AppointmentWriter,
  overrides: Partial<AIToolDeps> = {}
) {
  return executeAIToolCall(
    { assistantId, toolName: 'create_appointment', rawArguments: args },
    makeDeps(writer, overrides)
  );
}

async function main() {
// ── A. Validation de configuration (§17) ────────────────────────────────────
{
  check(
    'A0 2026-05-04 est bien un lundi',
    getZonedParts(new Date('2026-05-04T12:00:00Z'), 'UTC').dayOfWeek === 1
  );
  check(
    'A1 config valide acceptée',
    validateBusinessHoursConfig(MON_FRI_TWO_WINDOWS).ok === true
  );
  check(
    'A2 fenêtres adjacentes (09-12/12-17) acceptées',
    validateBusinessHoursConfig([
      { dayOfWeek: 1, opensAt: '09:00', closesAt: '12:00' },
      { dayOfWeek: 1, opensAt: '12:00', closesAt: '17:00' },
    ]).ok === true
  );
  const badDay = validateBusinessHoursConfig([
    { dayOfWeek: 7, opensAt: '09:00', closesAt: '17:00' },
  ]);
  check('A3 jour invalide rejeté', !badDay.ok && badDay.reason === 'INVALID_DAY');
  const badTime = validateBusinessHoursConfig([
    { dayOfWeek: 1, opensAt: '9:00', closesAt: '17:00' },
  ]);
  check('A4 heure invalide rejetée', !badTime.ok && badTime.reason === 'INVALID_TIME');
  const equal = validateBusinessHoursConfig([
    { dayOfWeek: 1, opensAt: '09:00', closesAt: '09:00' },
  ]);
  check('A5 opens==closes rejeté', !equal.ok && equal.reason === 'OVERNIGHT_NOT_SUPPORTED');
  const overnight = validateBusinessHoursConfig([
    { dayOfWeek: 1, opensAt: '22:00', closesAt: '02:00' },
  ]);
  check(
    'A6 nocturne (opens>closes) rejeté',
    !overnight.ok && overnight.reason === 'OVERNIGHT_NOT_SUPPORTED'
  );
  const overlap = validateBusinessHoursConfig([
    { dayOfWeek: 1, opensAt: '09:00', closesAt: '12:00' },
    { dayOfWeek: 1, opensAt: '11:00', closesAt: '13:00' },
  ]);
  check(
    'A7 fenêtres chevauchantes rejetées',
    !overlap.ok && overlap.reason === 'OVERLAPPING_WINDOWS'
  );
}

// ── B. Hiérarchie de résolution (§12) ───────────────────────────────────────
{
  const w: BusinessHoursWindowRecord = { dayOfWeek: 1, opensAt: '09:00', closesAt: '17:00' };
  const none = resolveBusinessHours({ employee: [], organization: [] });
  check('B1 aucune config → NONE', none.configured === false && none.source === 'NONE');
  const org = resolveBusinessHours({ employee: [], organization: [w] });
  check('B2 défaut organisation utilisé', org.configured && org.source === 'ORGANIZATION');
  const emp = resolveBusinessHours({ employee: [w], organization: [w] });
  check('B3 employé prioritaire sur organisation', emp.configured && emp.source === 'EMPLOYEE');
}

// ── C. Rendez-vous dans les heures ouvrées → créé ───────────────────────────
{
  const { writer, state } = makeWriter({ byOrg: { [ORG_A]: MON_FRI_TWO_WINDOWS } });
  const r = await run(ASSISTANT_WA, { date: '2026-05-04', time: '10:00', timezone: 'UTC' }, writer);
  check('C1 lundi 10:00 → créé', r.ok === true);
  check('C2 une écriture', state.createCalls === 1);
}

// ── D. Avant l'ouverture → TIME_OUTSIDE_BUSINESS_HOURS, aucune écriture ──────
{
  const { writer, state } = makeWriter({ byOrg: { [ORG_A]: MON_FRI_TWO_WINDOWS } });
  const r = await run(ASSISTANT_WA, { date: '2026-05-04', time: '08:00', timezone: 'UTC' }, writer);
  check(
    'D1 avant ouverture → TIME_OUTSIDE_BUSINESS_HOURS',
    r.ok === false && r.error.code === 'TIME_OUTSIDE_BUSINESS_HOURS'
  );
  check('D2 aucune écriture tentée', state.createCalls === 0);
}

// ── E. Débordement partiel → refusé (§7) ────────────────────────────────────
{
  const { writer, state } = makeWriter({ byOrg: { [ORG_A]: MON_FRI_TWO_WINDOWS } });
  const r = await run(
    ASSISTANT_WA,
    { date: '2026-05-04', time: '11:45', timezone: 'UTC', duration_minutes: 30 },
    writer
  );
  check(
    'E1 11:45–12:15 déborde 09–12 → refusé',
    r.ok === false && r.error.code === 'TIME_OUTSIDE_BUSINESS_HOURS'
  );
  check('E2 aucune écriture', state.createCalls === 0);
}

// ── F. Bornes incluses (open exact / close exact) ───────────────────────────
{
  const { writer } = makeWriter({ byOrg: { [ORG_A]: MON_FRI_TWO_WINDOWS } });
  const atOpen = await run(ASSISTANT_WA, { date: '2026-05-04', time: '09:00', timezone: 'UTC' }, writer);
  check('F1 début = ouverture → créé', atOpen.ok === true);
  const atClose = await run(
    ASSISTANT_WA,
    { date: '2026-05-04', time: '11:30', timezone: 'UTC', duration_minutes: 30 },
    writer
  );
  check('F2 fin = fermeture (11:30–12:00) → créé', atClose.ok === true);
  const justBefore = await run(ASSISTANT_WA, { date: '2026-05-04', time: '08:59', timezone: 'UTC' }, writer);
  check(
    'F3 08:59 → refusé',
    justBefore.ok === false && justBefore.error.code === 'TIME_OUTSIDE_BUSINESS_HOURS'
  );
}

// ── G. Jour fermé ───────────────────────────────────────────────────────────
{
  const { writer, state } = makeWriter({ byOrg: { [ORG_A]: MON_FRI_TWO_WINDOWS } });
  const r = await run(ASSISTANT_WA, { date: '2026-05-02', time: '10:00', timezone: 'UTC' }, writer);
  check(
    'G1 samedi (fermé) → TIME_OUTSIDE_BUSINESS_HOURS',
    r.ok === false && r.error.code === 'TIME_OUTSIDE_BUSINESS_HOURS'
  );
  check('G2 aucune écriture', state.createCalls === 0);
}

// ── H. Plusieurs fenêtres/jour : trou entre fenêtres ────────────────────────
{
  const { writer } = makeWriter({ byOrg: { [ORG_A]: MON_FRI_TWO_WINDOWS } });
  const inSecond = await run(ASSISTANT_WA, { date: '2026-05-04', time: '14:00', timezone: 'UTC' }, writer);
  check('H1 14:00 (2e fenêtre) → créé', inSecond.ok === true);
  const inGap = await run(ASSISTANT_WA, { date: '2026-05-04', time: '12:30', timezone: 'UTC' }, writer);
  check(
    'H2 12:30 (trou 12–13) → refusé',
    inGap.ok === false && inGap.error.code === 'TIME_OUTSIDE_BUSINESS_HOURS'
  );
}

// ── I. Priorité employé → organisation ──────────────────────────────────────
{
  const employeeTueOnly: BusinessHoursWindowRecord[] = [
    { dayOfWeek: 2, opensAt: '08:00', closesAt: '09:00' },
  ];
  const override = makeWriter({
    byOrg: { [ORG_A]: MON_FRI_TWO_WINDOWS },
    byEmployee: { 'emp-wa': employeeTueOnly },
  });
  const monday = await run(
    ASSISTANT_WA,
    { date: '2026-05-04', time: '10:00', timezone: 'UTC' },
    override.writer
  );
  check(
    'I1 horaire employé remplace l\'organisation (lundi fermé)',
    monday.ok === false && monday.error.code === 'TIME_OUTSIDE_BUSINESS_HOURS'
  );
  const tuesday = await run(
    ASSISTANT_WA,
    { date: '2026-05-05', time: '08:30', timezone: 'UTC' },
    override.writer
  );
  check('I2 fenêtre employé (mardi 08:30) → créé', tuesday.ok === true);

  const fallback = makeWriter({ byOrg: { [ORG_A]: MON_FRI_TWO_WINDOWS } });
  const orgMonday = await run(
    ASSISTANT_WA,
    { date: '2026-05-04', time: '10:00', timezone: 'UTC' },
    fallback.writer
  );
  check('I3 sans horaire employé → repli organisation', orgMonday.ok === true);
}

// ── J. DST : conversion déterministe (resort/fall back) ─────────────────────
{
  const tz = 'America/New_York';
  const springStart = zonedLocalToUtc('2026-03-08', '09:00', tz)!;
  const springEnd = new Date(springStart.getTime() + 30 * 60_000);
  const springDay = getZonedParts(springStart, tz).dayOfWeek;
  const springVerdict = evaluateBusinessHours({
    startsAt: springStart,
    endsAt: springEnd,
    timezone: tz,
    windows: [{ dayOfWeek: springDay, opensMinutes: 540, closesMinutes: 1020 }],
  });
  check('J1 spring-forward 09:00 local → dans les heures', springVerdict.withinHours === true);

  const fallStart = zonedLocalToUtc('2026-11-01', '09:00', tz)!;
  const fallEnd = new Date(fallStart.getTime() + 30 * 60_000);
  const fallDay = getZonedParts(fallStart, tz).dayOfWeek;
  const fallVerdict = evaluateBusinessHours({
    startsAt: fallStart,
    endsAt: fallEnd,
    timezone: tz,
    windows: [{ dayOfWeek: fallDay, opensMinutes: 540, closesMinutes: 1020 }],
  });
  check('J2 fall-back 09:00 local → dans les heures', fallVerdict.withinHours === true);

  const beforeOpen = zonedLocalToUtc('2026-03-08', '08:59', tz)!;
  const beforeVerdict = evaluateBusinessHours({
    startsAt: beforeOpen,
    endsAt: new Date(beforeOpen.getTime() + 60_000),
    timezone: tz,
    windows: [{ dayOfWeek: springDay, opensMinutes: 540, closesMinutes: 1020 }],
  });
  check('J3 08:59 local → hors heures', beforeVerdict.withinHours === false);
}

// ── K. Chevauchement de minuit local → refusé ───────────────────────────────
{
  const tz = 'UTC';
  const start = zonedLocalToUtc('2026-05-05', '23:30', tz)!;
  const verdict = evaluateBusinessHours({
    startsAt: start,
    endsAt: new Date(start.getTime() + 60 * 60_000),
    timezone: tz,
    windows: [{ dayOfWeek: 2, opensMinutes: 0, closesMinutes: 1439 }],
  });
  check(
    'K1 rendez-vous à cheval sur minuit → SPANS_DAYS',
    verdict.withinHours === false && verdict.reason === 'SPANS_DAYS'
  );
}

// ── L. Conversion de fuseau : même instant, verdicts différents (§19) ───────
{
  const startsAt = new Date('2026-05-04T14:00:00.000Z'); // 16:00 Paris / 07:00 LA
  const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
  const window = { dayOfWeek: 1, opensMinutes: 540, closesMinutes: 1020 };
  const paris = evaluateBusinessHours({ startsAt, endsAt, timezone: 'Europe/Paris', windows: [window] });
  const la = evaluateBusinessHours({ startsAt, endsAt, timezone: 'America/Los_Angeles', windows: [window] });
  check('L1 même instant → dans les heures à Paris', paris.withinHours === true);
  check('L2 même instant → hors heures à Los Angeles', la.withinHours === false);
}

// ── M. Isolation multi-tenant ───────────────────────────────────────────────
{
  const writer = makeWriter({ byOrg: { [ORG_A]: MON_FRI_TWO_WINDOWS } });
  const orgA = await run(ASSISTANT_WA, { date: '2026-05-02', time: '10:00', timezone: 'UTC' }, writer.writer);
  check(
    'M1 org A (configurée) samedi → refusé',
    orgA.ok === false && orgA.error.code === 'TIME_OUTSIDE_BUSINESS_HOURS'
  );
  const orgB = await run(ASSISTANT_WB, { date: '2026-05-02', time: '10:00', timezone: 'UTC' }, writer.writer);
  check('M2 org B (non configurée) samedi → autorisé', orgB.ok === true);
}

// ── N. Sans configuration → non restreint (décision A) ──────────────────────
{
  const { writer, state } = makeWriter({});
  const sink = createMemoryEventSink();
  const r = await run(
    ASSISTANT_WA,
    { date: '2026-05-02', time: '03:00', timezone: 'UTC' },
    writer,
    { events: sink }
  );
  check('N1 aucune config → création autorisée', r.ok === true && state.createCalls === 1);
  const checkEvent = sink.events.find((e) => e.name === 'AI_APPOINTMENT_BUSINESS_HOURS_CHECK');
  check('N2 événement CHECK reason UNRESTRICTED', checkEvent?.reason === 'UNRESTRICTED');
}

// ── O. Événements d'audit : CHECK + OUTSIDE_HOURS, sans PII ─────────────────
{
  const { writer } = makeWriter({ byOrg: { [ORG_A]: MON_FRI_TWO_WINDOWS } });
  const sink: AIToolMemoryEventSink = createMemoryEventSink();
  await run(
    ASSISTANT_WA,
    { date: '2026-05-02', time: '03:00', timezone: 'UTC', customer_name: 'Jane Secret' },
    writer,
    { events: sink }
  );
  const names = sink.events.map((e) => e.name);
  check(
    'O1 CHECK puis OUTSIDE_HOURS émis',
    names.includes('AI_APPOINTMENT_BUSINESS_HOURS_CHECK') &&
      names.includes('AI_APPOINTMENT_OUTSIDE_HOURS')
  );
  const outside = sink.events.find((e) => e.name === 'AI_APPOINTMENT_OUTSIDE_HOURS');
  check(
    'O2 OUTSIDE_HOURS porte le code + raison',
    outside?.errorCode === 'TIME_OUTSIDE_BUSINESS_HOURS' && outside?.reason === 'CLOSED_DAY'
  );
  check('O3 aucun PII dans les événements', !JSON.stringify(sink.events).includes('Jane Secret'));
}

// ── P. Données structurées + fenêtres suivantes bornées (§10, §11) ──────────
{
  const { writer, state } = makeWriter({
    byOrg: { [ORG_A]: allDaysTwoWindows() },
  });
  const r = await run(
    ASSISTANT_WA,
    { date: '2026-05-02', time: '08:00', timezone: 'UTC' },
    writer
  );
  const details = (!r.ok ? r.error.details : undefined) as
    | { timezone?: string; requestedStart?: string; requestedEnd?: string; nextAvailableWindows?: string[] }
    | undefined;
  check(
    'P1 échec contrôlé + détails structurés',
    r.ok === false && r.error.code === 'TIME_OUTSIDE_BUSINESS_HOURS' && details?.timezone === 'UTC'
  );
  check(
    'P2 requestedStart/End ISO corrects',
    details?.requestedStart === '2026-05-02T08:00:00.000Z' &&
      details?.requestedEnd === '2026-05-02T08:30:00.000Z'
  );
  check(
    'P3 prochaine fenêtre calculée (bornée)',
    Array.isArray(details?.nextAvailableWindows) &&
      details!.nextAvailableWindows!.length > 0 &&
      details!.nextAvailableWindows!.length <= 3 &&
      details!.nextAvailableWindows![0] === '2026-05-01T13:00:00.000Z'
  );
  check('P4 aucune écriture pour un créneau hors heures', state.createCalls === 0);
}

// ── Q. Mapping HTTP + détails du webhook ────────────────────────────────────
{
  const details = {
    timezone: 'UTC',
    requestedStart: '2026-05-02T08:00:00.000Z',
    requestedEnd: '2026-05-02T08:30:00.000Z',
    nextAvailableWindows: ['2026-05-01T13:00:00.000Z'],
  };
  const depsWith = (
    result:
      | { ok: false; toolName: string; requestId: string; error: { code: 'TIME_OUTSIDE_BUSINESS_HOURS'; details?: typeof details } }
  ) => ({
    verifySignature: () => ({ ok: true as const, timestamp: String(NOW_MS / 1000) }),
    publicKeyProvider: async () => 'irrelevant',
    claim: createInMemoryTelnyxAIToolReplayClaimer().claim,
    executeTool: async () => result,
    events: createMemoryEventSink(),
    now: () => NOW_MS,
    generateRequestId: () => `wh-${++reqSeq}`,
  });
  const body = JSON.stringify({
    assistant_id: ASSISTANT_WA,
    tool: 'create_appointment',
    arguments: { date: '2026-05-02', time: '08:00', timezone: 'UTC' },
  });
  const outside = await handleTelnyxAIToolWebhook(
    { rawBody: body, headers: {} },
    depsWith({ ok: false, toolName: 'create_appointment', requestId: 'r', error: { code: 'TIME_OUTSIDE_BUSINESS_HOURS', details } })
  );
  check('Q1 TIME_OUTSIDE_BUSINESS_HOURS → 409', outside.httpStatus === 409);
  check(
    'Q2 détails structurés exposés au webhook',
    outside.body.error === 'TIME_OUTSIDE_BUSINESS_HOURS' &&
      (outside.body.details as typeof details)?.nextAvailableWindows?.[0] === '2026-05-01T13:00:00.000Z'
  );
  const noDetails = await handleTelnyxAIToolWebhook(
    { rawBody: body, headers: {} },
    depsWith({ ok: false, toolName: 'create_appointment', requestId: 'r', error: { code: 'TIME_OUTSIDE_BUSINESS_HOURS' } })
  );
  check('Q3 sans détails → 409 sans champ details', noDetails.httpStatus === 409 && !('details' in noDetails.body));
}

// ── R. Durée préservée : borne haute exacte (§21) ───────────────────────────
{
  const single: BusinessHoursWindowRecord[] = [
    { dayOfWeek: 1, opensAt: '09:00', closesAt: '17:00' },
  ];
  const { writer } = makeWriter({ byOrg: { [ORG_A]: single } });
  const full = await run(
    ASSISTANT_WA,
    { date: '2026-05-04', time: '09:00', timezone: 'UTC', duration_minutes: 480 },
    writer
  );
  check('R1 09:00 + 480min = fermeture → créé', full.ok === true);
  const overflow = await run(
    ASSISTANT_WA,
    { date: '2026-05-04', time: '09:00', timezone: 'UTC', duration_minutes: 480 },
    makeWriter({ byOrg: { [ORG_A]: [{ dayOfWeek: 1, opensAt: '09:00', closesAt: '16:59' }] } }).writer
  );
  check(
    'R2 480min dépasse une fermeture 16:59 → refusé',
    overflow.ok === false && overflow.error.code === 'TIME_OUTSIDE_BUSINESS_HOURS'
  );
}

console.log('');
console.log(
  failures === 0
    ? 'AI APPOINTMENT BUSINESS HOURS : COUVERTURE COMPLÈTE'
    : `AI APPOINTMENT BUSINESS HOURS : ${failures} ÉCHEC(S)`
);
process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
