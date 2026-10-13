/**
 * Tests PHASE 4A — create_appointment : le SEUL outil d'écriture IA.
 *
 * Couvre l'autorisation explicite (`appointments:write` via
 * AIEmployee.allowedWriteTools), l'isolation multi-tenant, la validation
 * stricte, la résolution de fuseau IANA, le rejet des heures DST ambiguës, la
 * détection de conflit locale, l'idempotence anti-doublon et le rate limiting
 * d'écriture. Aucune base de données requise (writer injecté en mémoire).
 *
 * Exécution : npx tsx scripts/test-ai-appointment-tool.ts
 */

import { executeAIToolCall } from '../lib/ai-tools/execute';
import {
  APPOINTMENT_WRITE_TOOLS,
  grantedPermissionsFor,
} from '../lib/ai-tools/allowlist';
import {
  buildToolDefinitionsForPermissions,
  getAIToolDefinition,
  listRegisteredToolNames,
} from '../lib/ai-tools/registry';
import { handleTelnyxAIToolWebhook } from '../lib/ai-tools/webhook/handler';
import { createInMemoryTelnyxAIToolReplayClaimer } from '../lib/ai-tools/webhook/replay-claims';
import { createAIToolRateLimiter } from '../lib/ai-tools/rate-limit';
import { createInMemoryReplayStore } from '../lib/ai-tools/replay';
import {
  createMemoryEventSink,
  type AIToolMemoryEventSink,
} from '../lib/ai-tools/observability';
import type {
  AIToolDataAccess,
  AIEmployeeIdentityRecord,
  ContactRecord,
} from '../lib/ai-tools/data-access';
import type { AIToolDeps } from '../lib/ai-tools/types';
import type {
  AppointmentRecord,
  AppointmentWriter,
  CreateAppointmentInput,
  CreateAppointmentOutcome,
} from '../lib/ai-tools/appointments';

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
const ASSISTANT_RA = 'assistant-read-a';
const ASSISTANT_WB = 'assistant-write-b';

const NOW_MS = Date.parse('2026-05-01T12:00:00.000Z');
const valid = { date: '2026-06-01', time: '10:00' };

const employeeWA: AIEmployeeIdentityRecord = {
  id: 'emp-wa',
  organizationId: ORG_A,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: ['create_appointment'],
};
const employeeRA: AIEmployeeIdentityRecord = {
  id: 'emp-ra',
  organizationId: ORG_A,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: [],
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
  [ASSISTANT_RA]: employeeRA,
  [ASSISTANT_WB]: employeeWB,
};

type StoredContact = ContactRecord & { organizationId: string };
const contacts: StoredContact[] = [
  {
    id: 'contact-a1',
    organizationId: ORG_A,
    name: 'Jane Acme',
    company: null,
    email: null,
    isVip: false,
    leadScore: null,
    sentiment: null,
    escalationStatus: null,
    optedOut: false,
  },
  {
    id: 'contact-b1',
    organizationId: ORG_B,
    name: 'Other Tenant',
    company: null,
    email: null,
    isVip: false,
    leadScore: null,
    sentiment: null,
    escalationStatus: null,
    optedOut: false,
  },
];

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
  async getContact(organizationId, contactId) {
    return (
      contacts.find(
        (c) => c.id === contactId && c.organizationId === organizationId
      ) ?? null
    );
  },
  async searchOpportunities() {
    return [];
  },
  async getOpportunity() {
    return null;
  },
};

interface WriterState {
  store: Map<string, AppointmentRecord>;
  createCalls: number;
  overlapCalls: number;
  lastInput: CreateAppointmentInput | null;
}

function makeWriter(config: {
  orgTimezoneA?: string | null;
  orgTimezoneB?: string | null;
  overlaps?: AppointmentRecord[];
}): { writer: AppointmentWriter; state: WriterState } {
  const state: WriterState = {
    store: new Map(),
    createCalls: 0,
    overlapCalls: 0,
    lastInput: null,
  };
  const writer: AppointmentWriter = {
    async getOrganizationTimezone(organizationId) {
      if (organizationId === ORG_A) {
        return config.orgTimezoneA === undefined ? 'Europe/Paris' : config.orgTimezoneA;
      }
      if (organizationId === ORG_B) {
        return config.orgTimezoneB === undefined ? null : config.orgTimezoneB;
      }
      return null;
    },
    async findOverlappingAppointments() {
      state.overlapCalls++;
      return config.overlaps ?? [];
    },
    async createAppointment(input): Promise<CreateAppointmentOutcome> {
      state.createCalls++;
      state.lastInput = input;
      const existing = state.store.get(input.idempotencyKey);
      if (existing) return { status: 'DUPLICATE', appointment: existing };
      const record: AppointmentRecord = {
        id: `appt-${state.store.size + 1}`,
        organizationId: input.organizationId,
        aiEmployeeId: input.aiEmployeeId,
        contactId: input.contactId,
        customerName: input.customerName,
        reason: input.reason,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        timezone: input.timezone,
        status: input.status,
      };
      state.store.set(input.idempotencyKey, record);
      return { status: 'CREATED', appointment: record };
    },
  };
  return { writer, state };
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

type Data = Record<string, unknown>;

async function run(
  assistantId: string,
  args: Record<string, unknown>,
  writer: AppointmentWriter,
  overrides: Partial<AIToolDeps> = {},
  extra: { toolCallRequestId?: string | null } = {}
) {
  return executeAIToolCall(
    {
      assistantId,
      toolName: 'create_appointment',
      rawArguments: args,
      toolCallRequestId: extra.toolCallRequestId ?? null,
    },
    makeDeps(writer, overrides)
  );
}

async function main() {
// ── A. Enregistré mais jamais implicite ─────────────────────────────────────
{
  const def = getAIToolDefinition('create_appointment');
  check('A1 create_appointment enregistré et WRITE', def?.riskLevel === 'WRITE');
  check(
    'A2 listé dans le registre',
    listRegisteredToolNames().includes('create_appointment')
  );
  const readOnly = buildToolDefinitionsForPermissions(['contacts:read', 'crm:read']);
  check(
    'A3 absent de l\'allowlist read-only (pas d\'accès implicite)',
    !readOnly.some((d) => d.name === 'create_appointment')
  );
  const perms = grantedPermissionsFor({ voiceProvider: 'TELNYX', isActive: true });
  check('A4 aucune permission d\'écriture sans grant explicite', !perms.includes('appointments:write'));
  check(
    'A5 APPOINTMENT_WRITE_TOOLS = [create_appointment]',
    APPOINTMENT_WRITE_TOOLS.length === 1 && APPOINTMENT_WRITE_TOOLS[0] === 'create_appointment'
  );
}

// ── B. Grant explicite → accès accordé ──────────────────────────────────────
{
  const perms = grantedPermissionsFor(employeeWA);
  check('B1 allowedWriteTools → permission appointments:write', perms.includes('appointments:write'));
  const allowed = buildToolDefinitionsForPermissions(perms);
  check('B2 create_appointment alors autorisé', allowed.some((d) => d.name === 'create_appointment'));
}

// ── C. Création nominale (fuseau explicite) ─────────────────────────────────
{
  const { writer, state } = makeWriter({});
  const r = await run(ASSISTANT_WA, { ...valid, timezone: 'UTC' }, writer);
  const data = (r.ok ? r.data : {}) as Data;
  check('C1 création → ok', r.ok === true);
  check('C2 writer appelé une fois', state.createCalls === 1);
  check('C3 org = celle de l\'assistant', state.lastInput?.organizationId === ORG_A);
  check(
    'C4 startsAt UTC correct',
    data.startsAt === '2026-06-01T10:00:00.000Z' && state.lastInput?.startsAt.toISOString() === '2026-06-01T10:00:00.000Z'
  );
  check('C5 DTO expose durée + statut', data.durationMinutes === 30 && data.status === 'CONFIRMED');
  check(
    'C6 DTO sans champs internes',
    !('organizationId' in data) && !('idempotencyKey' in data) && !('customerPhone' in data)
  );
}

// ── D. Contact d'un autre tenant → CUSTOMER_NOT_FOUND ───────────────────────
{
  const { writer, state } = makeWriter({});
  const r = await run(ASSISTANT_WA, { ...valid, contact_id: 'contact-b1' }, writer);
  check('D1 contact autre tenant → CUSTOMER_NOT_FOUND', r.ok === false && r.error.code === 'CUSTOMER_NOT_FOUND');
  check('D2 aucune écriture tentée', state.createCalls === 0);
}

// ── E. Argument étranger (calendarId/organizationId) → refus ────────────────
{
  const { writer } = makeWriter({});
  const extra = await run(ASSISTANT_WA, { ...valid, calendarId: 'cal-x' }, writer);
  check('E1 calendarId → INVALID_ARGUMENTS', extra.ok === false && extra.error.code === 'INVALID_ARGUMENTS');
  const forged = await run(ASSISTANT_WA, { ...valid, organizationId: ORG_B }, writer);
  check('E2 organizationId → INVALID_ARGUMENTS', forged.ok === false && forged.error.code === 'INVALID_ARGUMENTS');
}

// ── F. Date/heure invalides → refus ─────────────────────────────────────────
{
  const { writer } = makeWriter({});
  const badDate = await run(ASSISTANT_WA, { date: '2026-02-30', time: '10:00', timezone: 'UTC' }, writer);
  check('F1 date inexistante → INVALID_ARGUMENTS', badDate.ok === false && badDate.error.code === 'INVALID_ARGUMENTS');
  const badTime = await run(ASSISTANT_WA, { date: '2026-06-01', time: '25:00', timezone: 'UTC' }, writer);
  check('F2 heure hors bornes → INVALID_ARGUMENTS', badTime.ok === false && badTime.error.code === 'INVALID_ARGUMENTS');
}

// ── G. Fuseau absent (org sans tz) → refus ──────────────────────────────────
{
  const { writer } = makeWriter({ orgTimezoneB: null });
  const r = await run(ASSISTANT_WB, { ...valid }, writer);
  check('G1 tz org null + aucun tz → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
}

// ── H. Fuseau IANA invalide → refus ─────────────────────────────────────────
{
  const { writer } = makeWriter({});
  const r = await run(ASSISTANT_WA, { ...valid, timezone: 'Not/AZone' }, writer);
  check('H1 tz invalide → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
}

// ── I. Heure DST inexistante/ambiguë → refus ────────────────────────────────
{
  const { writer } = makeWriter({});
  const r = await run(
    ASSISTANT_WA,
    { date: '2026-03-08', time: '02:30', timezone: 'America/New_York' },
    writer
  );
  check('I1 heure DST inexistante → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
}

// ── J. Conflit de créneau → TIME_SLOT_UNAVAILABLE ───────────────────────────
{
  const overlap: AppointmentRecord = {
    id: 'appt-existing',
    organizationId: ORG_A,
    aiEmployeeId: employeeWA.id,
    contactId: null,
    customerName: null,
    reason: null,
    startsAt: new Date('2026-06-01T09:30:00.000Z'),
    endsAt: new Date('2026-06-01T10:30:00.000Z'),
    timezone: 'UTC',
    status: 'CONFIRMED',
  };
  const { writer, state } = makeWriter({ overlaps: [overlap] });
  const r = await run(ASSISTANT_WA, { ...valid, timezone: 'UTC' }, writer);
  check('J1 chevauchement → TIME_SLOT_UNAVAILABLE', r.ok === false && r.error.code === 'TIME_SLOT_UNAVAILABLE');
  check('J2 aucune écriture sur conflit', state.createCalls === 0 && state.overlapCalls === 1);
}

// ── K. Idempotence anti-doublon (même request_id) ───────────────────────────
{
  const { writer, state } = makeWriter({});
  const first = await run(ASSISTANT_WA, { ...valid, timezone: 'UTC' }, writer, {}, { toolCallRequestId: 'call-1' });
  const second = await run(ASSISTANT_WA, { ...valid, timezone: 'UTC' }, writer, {}, { toolCallRequestId: 'call-1' });
  const firstId = first.ok ? (first.data as Data).id : undefined;
  const secondId = second.ok ? (second.data as Data).id : undefined;
  check('K1 premier appel créé', first.ok === true);
  check(
    'K2 rejeu même request_id → même rendez-vous, aucun doublon',
    second.ok === true && firstId === secondId && firstId !== undefined && state.store.size === 1
  );
}

// ── L. Créneau passé → refus ────────────────────────────────────────────────
{
  const { writer } = makeWriter({});
  const r = await run(ASSISTANT_WA, { date: '2026-01-01', time: '10:00', timezone: 'UTC' }, writer);
  check('L1 créneau dans le passé → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
}

// ── M. Durée hors bornes → refus ────────────────────────────────────────────
{
  const { writer } = makeWriter({});
  const tooShort = await run(ASSISTANT_WA, { ...valid, timezone: 'UTC', duration_minutes: 2 }, writer);
  check('M1 durée < 5 → INVALID_ARGUMENTS', tooShort.ok === false && tooShort.error.code === 'INVALID_ARGUMENTS');
  const tooLong = await run(ASSISTANT_WA, { ...valid, timezone: 'UTC', duration_minutes: 1000 }, writer);
  check('M2 durée > 480 → INVALID_ARGUMENTS', tooLong.ok === false && tooLong.error.code === 'INVALID_ARGUMENTS');
}

// ── N. Rate limiting d'écriture dédié ───────────────────────────────────────
{
  const { writer } = makeWriter({});
  const writeRateLimiter = createAIToolRateLimiter({
    assistant: { max: 1, windowMs: 60_000 },
    now: () => NOW_MS,
  });
  const first = await run(ASSISTANT_WA, { ...valid, timezone: 'UTC' }, writer, { writeRateLimiter });
  const second = await run(
    ASSISTANT_WA,
    { date: '2026-06-02', time: '10:00', timezone: 'UTC' },
    writer,
    { writeRateLimiter }
  );
  check('N1 premier écrit autorisé', first.ok === true);
  check('N2 second écrit rate-limité → TEMPORARILY_UNAVAILABLE', second.ok === false && second.error.code === 'TEMPORARILY_UNAVAILABLE');
}

// ── O. Webhook : outil d'écriture sans grant → refus ────────────────────────
{
  const { writer, state } = makeWriter({});
  const sink = createMemoryEventSink();
  let executeCalls = 0;
  const deps = {
    verifySignature: () => ({ ok: true as const, timestamp: String(NOW_MS / 1000) }),
    publicKeyProvider: async () => 'irrelevant',
    claim: createInMemoryTelnyxAIToolReplayClaimer().claim,
    executeTool: async (input: import('../lib/ai-tools/execute').ExecuteAIToolCallInput) => {
      executeCalls++;
      return executeAIToolCall(input, makeDeps(writer));
    },
    events: sink,
    now: () => NOW_MS,
    generateRequestId: () => `wh-${++reqSeq}`,
  };
  const body = JSON.stringify({
    assistant_id: ASSISTANT_RA,
    tool: 'create_appointment',
    arguments: { ...valid, timezone: 'UTC' },
  });
  const r = await handleTelnyxAIToolWebhook({ rawBody: body, headers: {} }, deps);
  check('O1 assistant read-only → 403 TOOL_NOT_ALLOWED', r.httpStatus === 403 && r.body.error === 'NOT_ALLOWED');
  check('O2 aucune écriture exécutée', executeCalls === 1 && state.createCalls === 0);
}

// ── P. Webhook : grant explicite → création ─────────────────────────────────
{
  const { writer, state } = makeWriter({});
  const deps = {
    verifySignature: () => ({ ok: true as const, timestamp: String(NOW_MS / 1000) }),
    publicKeyProvider: async () => 'irrelevant',
    claim: createInMemoryTelnyxAIToolReplayClaimer().claim,
    executeTool: async (input: import('../lib/ai-tools/execute').ExecuteAIToolCallInput) =>
      executeAIToolCall(input, makeDeps(writer)),
    events: createMemoryEventSink(),
    now: () => NOW_MS,
    generateRequestId: () => `wh-${++reqSeq}`,
  };
  const body = JSON.stringify({
    assistant_id: ASSISTANT_WA,
    tool: 'create_appointment',
    arguments: { ...valid, timezone: 'UTC' },
  });
  const r = await handleTelnyxAIToolWebhook({ rawBody: body, headers: {} }, deps);
  const result = r.body.result as Data | undefined;
  check('P1 assistant avec grant → 200', r.httpStatus === 200 && r.body.ok === true);
  check('P2 rendez-vous créé (DTO)', result?.startsAt === '2026-06-01T10:00:00.000Z');
  check('P3 une seule écriture', state.createCalls === 1);
}

// ── Q. Mapping HTTP des erreurs métier ──────────────────────────────────────
{
  const mk = (code: 'TIME_SLOT_UNAVAILABLE' | 'CUSTOMER_NOT_FOUND') => {
    const deps = {
      verifySignature: () => ({ ok: true as const, timestamp: String(NOW_MS / 1000) }),
      publicKeyProvider: async () => 'irrelevant',
      claim: createInMemoryTelnyxAIToolReplayClaimer().claim,
      executeTool: async () => ({ ok: false as const, toolName: 'create_appointment', requestId: 'r', error: { code } }),
      events: createMemoryEventSink(),
      now: () => NOW_MS,
      generateRequestId: () => `wh-${++reqSeq}`,
    };
    return handleTelnyxAIToolWebhook(
      {
        rawBody: JSON.stringify({ assistant_id: ASSISTANT_WA, tool: 'create_appointment', arguments: valid }),
        headers: {},
      },
      deps
    );
  };
  const conflict = await mk('TIME_SLOT_UNAVAILABLE');
  check('Q1 TIME_SLOT_UNAVAILABLE → 409', conflict.httpStatus === 409);
  const missing = await mk('CUSTOMER_NOT_FOUND');
  check('Q2 CUSTOMER_NOT_FOUND → 404', missing.httpStatus === 404);
}

// ── R. Événements d'audit émis, sans PII ────────────────────────────────────
{
  const { writer } = makeWriter({});
  const sink: AIToolMemoryEventSink = createMemoryEventSink();
  await run(
    ASSISTANT_WA,
    { ...valid, timezone: 'UTC', customer_name: 'Jane Secret', phone: '+237612345678' },
    writer,
    { events: sink }
  );
  const names = sink.events.map((e) => e.name);
  check(
    'R1 cycle d\'audit request/authorized/created',
    names.includes('AI_APPOINTMENT_REQUESTED') &&
      names.includes('AI_APPOINTMENT_AUTHORIZED') &&
      names.includes('AI_APPOINTMENT_CREATED')
  );
  const serialized = JSON.stringify(sink.events);
  check('R2 événements sans PII', !serialized.includes('Jane Secret') && !serialized.includes('237612345678'));
}

console.log('');
console.log(failures === 0 ? 'AI APPOINTMENT TOOL : COUVERTURE COMPLÈTE' : `AI APPOINTMENT TOOL : ${failures} ÉCHEC(S)`);
process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
