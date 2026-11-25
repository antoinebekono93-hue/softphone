/**
 * Tests PHASE 4A.1 — durcissement concurrence de create_appointment.
 *
 * Exerce les fonctions PURES de production (createAppointmentInTransaction +
 * executeAppointmentCreate) via le writer mémoire qui imite une transaction
 * PostgreSQL SERIALIZABLE (snapshot + détection de conflit à l'insertion).
 * Aucune base de données requise.
 *
 * Scénarios : A–L (cf. mission §13).
 *
 * Exécution : npx tsx scripts/test-ai-appointment-concurrency.ts
 */

import { executeAIToolCall } from '../lib/ai-tools/execute';
import { createAIToolRateLimiter } from '../lib/ai-tools/rate-limit';
import { createInMemoryReplayStore } from '../lib/ai-tools/replay';
import { createMemoryEventSink } from '../lib/ai-tools/observability';
import type {
  AIToolDataAccess,
  AIEmployeeIdentityRecord,
} from '../lib/ai-tools/data-access';
import type { AIToolDeps } from '../lib/ai-tools/types';
import {
  buildAppointmentIdempotencyKey,
  type AppointmentRecord,
  type CreateAppointmentInput,
} from '../lib/ai-tools/appointments';
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
const NOW_MS = Date.parse('2026-05-01T12:00:00.000Z');

const employeeWA: AIEmployeeIdentityRecord = {
  id: 'emp-wa',
  organizationId: ORG_A,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: ['create_appointment'],
};
const employees: Record<string, AIEmployeeIdentityRecord> = {
  [ASSISTANT_WA]: employeeWA,
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

let reqSeq = 0;
function makeDeps(
  writer: ReturnType<typeof createMemoryAppointmentWriter>['writer'],
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

async function runHandler(
  args: Record<string, unknown>,
  writer: ReturnType<typeof createMemoryAppointmentWriter>['writer']
) {
  return executeAIToolCall(
    { assistantId: ASSISTANT_WA, toolName: 'create_appointment', rawArguments: args },
    makeDeps(writer)
  );
}

function apptInput(params: {
  requestId: string | null;
  organizationId?: string;
  aiEmployeeId?: string;
  startsAt: string;
  endsAt: string;
  idempotencyKey?: string;
}): CreateAppointmentInput {
  const organizationId = params.organizationId ?? ORG_A;
  const aiEmployeeId = params.aiEmployeeId ?? employeeWA.id;
  const startsAt = new Date(params.startsAt);
  const endsAt = new Date(params.endsAt);
  return {
    organizationId,
    aiEmployeeId,
    contactId: null,
    customerName: null,
    customerPhone: null,
    reason: null,
    startsAt,
    endsAt,
    timezone: 'UTC',
    status: 'CONFIRMED',
    idempotencyKey: params.idempotencyKey ?? buildAppointmentIdempotencyKey({
      organizationId,
      aiEmployeeId,
      requestId: params.requestId,
      startsAt,
      endsAt,
      contactId: null,
      customerName: null,
      customerPhone: null,
    }),
    sourceRequestId: params.requestId,
  };
}

function makeWriter(maxAttempts?: number) {
  return createMemoryAppointmentWriter({
    timezones: { [ORG_A]: 'UTC', [ORG_B]: 'UTC' },
    maxAttempts,
  });
}

function countStatus(
  results: { status: string }[],
  status: string
): number {
  return results.filter((r) => r.status === status).length;
}

async function main() {
// ── A. Même request_id concurrent → un seul rendez-vous ─────────────────────
{
  const h = makeWriter();
  const input = apptInput({
    requestId: 'call-A',
    startsAt: '2026-06-01T10:00:00Z',
    endsAt: '2026-06-01T10:30:00Z',
  });
  const results = await Promise.all([
    h.writer.createAppointment(input),
    h.writer.createAppointment(input),
  ]);
  check(
    'A1 même request_id → 1 CREATED + 1 DUPLICATE',
    countStatus(results, 'CREATED') === 1 && countStatus(results, 'DUPLICATE') === 1
  );
  check('A2 un seul rendez-vous persisté', h.state.store.size === 1);
}

// ── B. request_ids différents, créneau identique → 1 succès / 1 conflit ─────
{
  const h = makeWriter();
  const results = await Promise.all([
    h.writer.createAppointment(
      apptInput({ requestId: 'call-B1', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T10:30:00Z' })
    ),
    h.writer.createAppointment(
      apptInput({ requestId: 'call-B2', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T10:30:00Z' })
    ),
  ]);
  check(
    'B1 créneau identique concurrent → 1 CREATED + 1 CONFLICT',
    countStatus(results, 'CREATED') === 1 && countStatus(results, 'CONFLICT') === 1
  );
  check('B2 un seul rendez-vous persisté', h.state.store.size === 1);
  check('B3 au moins un retry de sérialisation', h.state.transactionCalls >= 3);
}

// ── C. Chevauchement partiel → 1 succès / 1 conflit ─────────────────────────
{
  const h = makeWriter();
  const results = await Promise.all([
    h.writer.createAppointment(
      apptInput({ requestId: 'call-C1', startsAt: '2026-06-01T09:30:00Z', endsAt: '2026-06-01T10:30:00Z' })
    ),
    h.writer.createAppointment(
      apptInput({ requestId: 'call-C2', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T11:00:00Z' })
    ),
  ]);
  check(
    'C1 chevauchement partiel → 1 CREATED + 1 CONFLICT',
    countStatus(results, 'CREATED') === 1 && countStatus(results, 'CONFLICT') === 1
  );
  check('C2 un seul rendez-vous persisté', h.state.store.size === 1);
}

// ── D. Chevauchement imbriqué → conflit ─────────────────────────────────────
{
  const h = makeWriter();
  const results = await Promise.all([
    h.writer.createAppointment(
      apptInput({ requestId: 'call-D1', startsAt: '2026-06-01T09:00:00Z', endsAt: '2026-06-01T12:00:00Z' })
    ),
    h.writer.createAppointment(
      apptInput({ requestId: 'call-D2', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T11:00:00Z' })
    ),
  ]);
  check(
    'D1 intervalle imbriqué → 1 CREATED + 1 CONFLICT',
    countStatus(results, 'CREATED') === 1 && countStatus(results, 'CONFLICT') === 1
  );
}

// ── E. Dos-à-dos (back-to-back) → les deux autorisés ────────────────────────
{
  const h = makeWriter();
  const results = await Promise.all([
    h.writer.createAppointment(
      apptInput({ requestId: 'call-E1', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T10:30:00Z' })
    ),
    h.writer.createAppointment(
      apptInput({ requestId: 'call-E2', startsAt: '2026-06-01T10:30:00Z', endsAt: '2026-06-01T11:00:00Z' })
    ),
  ]);
  check(
    'E1 dos-à-dos → 2 CREATED',
    countStatus(results, 'CREATED') === 2 && h.state.store.size === 2
  );
}

// ── F. Employé différent → les deux autorisés ───────────────────────────────
{
  const h = makeWriter();
  const results = await Promise.all([
    h.writer.createAppointment(
      apptInput({ requestId: 'call-F1', aiEmployeeId: 'emp-wa', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T10:30:00Z' })
    ),
    h.writer.createAppointment(
      apptInput({ requestId: 'call-F2', aiEmployeeId: 'emp-other', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T10:30:00Z' })
    ),
  ]);
  check(
    'F1 employé différent → 2 CREATED (pas de conflit croisé)',
    countStatus(results, 'CREATED') === 2 && h.state.store.size === 2
  );
}

// ── G. Organisation différente → les deux autorisés ─────────────────────────
{
  const h = makeWriter();
  const results = await Promise.all([
    h.writer.createAppointment(
      apptInput({ requestId: 'call-G1', organizationId: ORG_A, aiEmployeeId: 'emp-wa', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T10:30:00Z' })
    ),
    h.writer.createAppointment(
      apptInput({ requestId: 'call-G2', organizationId: ORG_B, aiEmployeeId: 'emp-wa', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T10:30:00Z' })
    ),
  ]);
  check(
    'G1 org différente → 2 CREATED (isolation tenant)',
    countStatus(results, 'CREATED') === 2 && h.state.store.size === 2
  );
}

// ── H. Le retry de sérialisation aboutit ────────────────────────────────────
{
  const h = makeWriter();
  h.failNextSerializations(1);
  const result = await h.writer.createAppointment(
    apptInput({ requestId: 'call-H', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T10:30:00Z' })
  );
  check('H1 1 échec SSI puis succès → CREATED', result.status === 'CREATED');
  check('H2 exactement 2 tentatives', h.state.transactionCalls === 2);
}

// ── I. Limite de retry atteinte → résultat contrôlé ─────────────────────────
{
  const h = makeWriter(3);
  h.failNextSerializations(10);
  const result = await h.writer.createAppointment(
    apptInput({ requestId: 'call-I', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T10:30:00Z' })
  );
  check('I1 épuisement → UNAVAILABLE (aucune erreur de base)', result.status === 'UNAVAILABLE');
  check('I2 tentatives bornées à maxAttempts', h.state.transactionCalls === 3);
  check('I3 aucune écriture', h.state.insertCalls === 0);
}

// ── J. Idempotence toujours fonctionnelle (séquentiel) ──────────────────────
{
  const h = makeWriter();
  const input = apptInput({ requestId: 'call-J', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T10:30:00Z' });
  const first = await h.writer.createAppointment(input);
  const second = await h.writer.createAppointment(input);
  check(
    'J1 rejeu séquentiel → même rendez-vous, pas de doublon',
    first.status === 'CREATED' &&
      second.status === 'DUPLICATE' &&
      first.status === 'CREATED' &&
      (first as { appointment: AppointmentRecord }).appointment.id ===
        (second as { appointment: AppointmentRecord }).appointment.id &&
      h.state.store.size === 1
  );
}

// ── K. Fuseau / DST : comportement inchangé (via le handler) ────────────────
{
  const h = makeWriter();
  const dst = await runHandler(
    { date: '2026-03-08', time: '02:30', timezone: 'America/New_York' },
    h.writer
  );
  check('K1 heure DST inexistante → INVALID_ARGUMENTS', dst.ok === false && dst.error.code === 'INVALID_ARGUMENTS');
  const utc = await runHandler({ date: '2026-06-01', time: '10:00', timezone: 'UTC' }, h.writer);
  check(
    'K2 conversion UTC inchangée',
    utc.ok === true && (utc.data as { startsAt?: string }).startsAt === '2026-06-01T10:00:00.000Z'
  );
}

// ── M. Mapping handler : conflit et contention ──────────────────────────────
{
  const overlap: AppointmentRecord = {
    id: 'appt-existing',
    organizationId: ORG_A,
    aiEmployeeId: employeeWA.id,
    contactId: null,
    customerName: null,
    reason: null,
    startsAt: new Date('2026-06-01T09:30:00Z'),
    endsAt: new Date('2026-06-01T10:30:00Z'),
    timezone: 'UTC',
    status: 'CONFIRMED',
  };
  const conflictWriter = createMemoryAppointmentWriter({
    timezones: { [ORG_A]: 'UTC' },
    seed: [overlap],
  });
  const conflict = await runHandler(
    { date: '2026-06-01', time: '10:00', timezone: 'UTC' },
    conflictWriter.writer
  );
  check('M1 handler conflit → TIME_SLOT_UNAVAILABLE', conflict.ok === false && conflict.error.code === 'TIME_SLOT_UNAVAILABLE');

  const contentionWriter = makeWriter(3);
  contentionWriter.failNextSerializations(5);
  const contention = await runHandler(
    { date: '2026-06-02', time: '10:00', timezone: 'UTC' },
    contentionWriter.writer
  );
  check(
    'M2 handler contention épuisée → TEMPORARILY_UNAVAILABLE (contrôlé)',
    contention.ok === false && contention.error.code === 'TEMPORARILY_UNAVAILABLE'
  );
}

console.log('');
console.log(
  failures === 0
    ? 'AI APPOINTMENT CONCURRENCY : COUVERTURE COMPLÈTE'
    : `AI APPOINTMENT CONCURRENCY : ${failures} ÉCHEC(S)`
);
process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
