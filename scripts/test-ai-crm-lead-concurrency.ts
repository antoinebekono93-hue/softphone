/**
 * Tests PHASE 4B — concurrence des écritures leads.
 *
 * Exerce les fonctions PURES de production (executeLeadUpdate) et la
 * sémantique PostgreSQL réellement utilisée (contrainte unique
 * organisation+phone pour la création, transaction SERIALIZABLE + retry pour
 * la mise à jour) via le writer mémoire. Aucune base de données requise.
 *
 * Exécution : npx tsx scripts/test-ai-crm-lead-concurrency.ts
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
import type { LeadRecord } from '../lib/ai-tools/leads';
import { createMemoryLeadWriter } from './helpers/memory-lead-writer';

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const ORG_A = 'org-a';
const ORG_B = 'org-b';
const ASSISTANT_A = 'assistant-lead-a';
const ASSISTANT_B = 'assistant-lead-b';
const NOW_MS = Date.parse('2026-05-01T12:00:00.000Z');

const employeeA: AIEmployeeIdentityRecord = {
  id: 'emp-a',
  organizationId: ORG_A,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: ['create_lead', 'update_lead'],
};
const employeeB: AIEmployeeIdentityRecord = {
  id: 'emp-b',
  organizationId: ORG_B,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: ['create_lead', 'update_lead'],
};
const employees: Record<string, AIEmployeeIdentityRecord> = {
  [ASSISTANT_A]: employeeA,
  [ASSISTANT_B]: employeeB,
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
  writer: ReturnType<typeof createMemoryLeadWriter>['writer']
): AIToolDeps {
  return {
    db: fakeDb,
    rateLimiter: createAIToolRateLimiter(),
    replayStore: createInMemoryReplayStore(() => NOW_MS),
    events: createMemoryEventSink(),
    now: () => NOW_MS,
    generateRequestId: () => `req-${++reqSeq}`,
    leads: writer,
  };
}

function runCreate(
  assistantId: string,
  args: Record<string, unknown>,
  writer: ReturnType<typeof createMemoryLeadWriter>['writer']
) {
  return executeAIToolCall(
    { assistantId, toolName: 'create_lead', rawArguments: args },
    makeDeps(writer)
  );
}

function runUpdate(
  assistantId: string,
  args: Record<string, unknown>,
  writer: ReturnType<typeof createMemoryLeadWriter>['writer']
) {
  return executeAIToolCall(
    { assistantId, toolName: 'update_lead', rawArguments: args },
    makeDeps(writer)
  );
}

function seedLead(
  id: string,
  org: string,
  phone: string,
  notes: string | null = null
): LeadRecord {
  return {
    id,
    organizationId: org,
    name: 'Seed',
    company: null,
    email: null,
    phone,
    notes,
    leadScore: null,
    sentiment: null,
    escalationStatus: null,
    optedOut: false,
    isVip: false,
  };
}

function countOk(results: { ok: boolean }[]): number {
  return results.filter((r) => r.ok).length;
}

function countCode(
  results: { ok: boolean; error?: { code: string } }[],
  code: string
): number {
  return results.filter((r) => !r.ok && r.error?.code === code).length;
}

async function main() {
// ── A. Deux créations concurrentes même org+phone → un seul lead ────────────
{
  const h = createMemoryLeadWriter();
  const results = await Promise.all([
    runCreate(ASSISTANT_A, { phone: '+237612345678', name: 'Jane A' }, h.writer),
    runCreate(ASSISTANT_A, { phone: '+237612345678', name: 'Jane B' }, h.writer),
  ]);
  check(
    'A1 création concurrente → 1 succès + 1 LEAD_ALREADY_EXISTS',
    countOk(results) === 1 && countCode(results, 'LEAD_ALREADY_EXISTS') === 1
  );
  check('A2 une seule ligne persistée', h.state.store.size === 1);
}

// ── B. Formats de téléphone équivalents → toujours un seul lead ─────────────
{
  const h = createMemoryLeadWriter();
  const results = await Promise.all([
    runCreate(ASSISTANT_A, { phone: '+237612345678', name: 'A' }, h.writer),
    runCreate(ASSISTANT_A, { phone: '00237 612 345 678', name: 'B' }, h.writer),
  ]);
  check('B1 formats équivalents → 1 succès + 1 LEAD_ALREADY_EXISTS', countOk(results) === 1 && countCode(results, 'LEAD_ALREADY_EXISTS') === 1);
  check('B2 une seule ligne persistée', h.state.store.size === 1);
}

// ── C. Même téléphone, deux tenants → deux leads ────────────────────────────
{
  const h = createMemoryLeadWriter();
  const results = await Promise.all([
    runCreate(ASSISTANT_A, { phone: '+237612345678', name: 'In A' }, h.writer),
    runCreate(ASSISTANT_B, { phone: '+237612345678', name: 'In B' }, h.writer),
  ]);
  check('C1 isolation tenant → 2 créations', countOk(results) === 2 && h.state.store.size === 2);
}

// ── D. Rejeu idempotent (même clé) → une seule écriture ─────────────────────
{
  const h = createMemoryLeadWriter();
  const deps = makeDeps(h.writer);
  const call = {
    assistantId: ASSISTANT_A,
    toolName: 'create_lead',
    rawArguments: { phone: '+237612345678', name: 'Jane' },
    idempotencyKey: 'lead-key-1',
  };
  const first = await executeAIToolCall(call, deps);
  const second = await executeAIToolCall(call, deps);
  check('D1 rejeu même clé → même résultat', first.ok === true && second.ok === true);
  check('D2 une seule écriture', h.state.insertCalls === 1 && h.state.store.size === 1);
}

// ── E. Deux mises à jour concurrentes : aucune note perdue ──────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead('lead-e', ORG_A, '+237612345678', 'base')] });
  const results = await Promise.all([
    runUpdate(ASSISTANT_A, { contact_id: 'lead-e', notes: 'note-A' }, h.writer),
    runUpdate(ASSISTANT_A, { contact_id: 'lead-e', notes: 'note-B' }, h.writer),
  ]);
  const finalNotes = h.state.store.get('lead-e')?.notes ?? '';
  check('E1 les deux mises à jour réussissent', countOk(results) === 2);
  check('E2 aucune note perdue', finalNotes.includes('base') && finalNotes.includes('note-A') && finalNotes.includes('note-B'));
  check('E3 au moins un conflit de sérialisation rejoué', h.state.transactionCalls >= 3);
}

// ── F. Contention épuisée → TEMPORARILY_UNAVAILABLE contrôlé ─────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead('lead-f', ORG_A, '+237612345678')], maxAttempts: 3 });
  h.failNextSerializations(10);
  const r = await runUpdate(ASSISTANT_A, { contact_id: 'lead-f', name: 'X' }, h.writer);
  check('F1 contention épuisée → TEMPORARILY_UNAVAILABLE', r.ok === false && r.error.code === 'TEMPORARILY_UNAVAILABLE');
  check('F2 tentatives bornées', h.state.transactionCalls === 3);
  check('F3 aucune modification appliquée', h.state.store.get('lead-f')?.name === 'Seed');
}

// ── G. Un conflit transitoire puis succès ───────────────────────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead('lead-g', ORG_A, '+237612345678')] });
  h.failNextSerializations(1);
  const r = await runUpdate(ASSISTANT_A, { contact_id: 'lead-g', name: 'Updated' }, h.writer);
  check('G1 1 conflit puis succès → ok', r.ok === true);
  check('G2 deux tentatives', h.state.transactionCalls === 2);
  check('G3 modification appliquée', h.state.store.get('lead-g')?.name === 'Updated');
}

console.log('');
console.log(
  failures === 0
    ? 'AI CRM LEAD CONCURRENCY : COUVERTURE COMPLÈTE'
    : `AI CRM LEAD CONCURRENCY : ${failures} ÉCHEC(S)`
);
process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
