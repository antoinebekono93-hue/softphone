/**
 * Tests PHASE 4B — update_lead.
 *
 * Couvre la résolution d'identité (id vs téléphone, 0/1/>1), l'isolation
 * multi-tenant, la validation stricte, l'allowlist de champs, l'ajout additif
 * des notes (aucune perte d'historique), l'anti-perte de mise à jour
 * concurrente, l'autorisation et la cartographie HTTP des erreurs.
 * Aucune base de données requise.
 *
 * Exécution : npx tsx scripts/test-ai-crm-lead-update.ts
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
const ASSISTANT_LEAD_A = 'assistant-lead-a';
const ASSISTANT_READ_A = 'assistant-read-a';
const NOW_MS = Date.parse('2026-05-01T12:00:00.000Z');

const employeeLeadA: AIEmployeeIdentityRecord = {
  id: 'emp-lead-a',
  organizationId: ORG_A,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: ['create_lead', 'update_lead'],
};
const employeeReadA: AIEmployeeIdentityRecord = {
  id: 'emp-read-a',
  organizationId: ORG_A,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: [],
};
const employees: Record<string, AIEmployeeIdentityRecord> = {
  [ASSISTANT_LEAD_A]: employeeLeadA,
  [ASSISTANT_READ_A]: employeeReadA,
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

function seedLead(overrides: Partial<LeadRecord> & { phone: string; id: string }): LeadRecord {
  return {
    id: overrides.id,
    organizationId: overrides.organizationId ?? ORG_A,
    name: overrides.name ?? 'Seed Lead',
    company: overrides.company ?? null,
    email: overrides.email ?? null,
    phone: overrides.phone,
    notes: overrides.notes ?? null,
    leadScore: overrides.leadScore ?? null,
    sentiment: overrides.sentiment ?? null,
    escalationStatus: overrides.escalationStatus ?? null,
    optedOut: overrides.optedOut ?? false,
    isVip: overrides.isVip ?? false,
  };
}

let reqSeq = 0;
function makeDeps(
  writer: ReturnType<typeof createMemoryLeadWriter>['writer'],
  overrides: Partial<AIToolDeps> = {}
): AIToolDeps {
  return {
    db: fakeDb,
    rateLimiter: createAIToolRateLimiter(),
    replayStore: createInMemoryReplayStore(() => NOW_MS),
    events: createMemoryEventSink(),
    now: () => NOW_MS,
    generateRequestId: () => `req-${++reqSeq}`,
    leads: writer,
    ...overrides,
  };
}

type Data = Record<string, unknown>;

async function run(
  assistantId: string,
  args: Record<string, unknown>,
  writer: ReturnType<typeof createMemoryLeadWriter>['writer'],
  overrides: Partial<AIToolDeps> = {}
) {
  return executeAIToolCall(
    { assistantId, toolName: 'update_lead', rawArguments: args },
    makeDeps(writer, overrides)
  );
}

async function main() {
// ── A. Mise à jour nominale par id ──────────────────────────────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead({ id: 'L1', phone: '+237612345678', name: 'Old Name' })] });
  const r = await run(ASSISTANT_LEAD_A, { contact_id: 'L1', name: 'New Name', company: 'NewCo' }, h.writer);
  const data = (r.ok ? r.data : {}) as Data;
  check('A1 update par id → ok', r.ok === true);
  check('A2 writer appelé une fois', h.state.updateCalls === 1);
  check('A3 org = assistant', h.state.lastUpdateInput?.organizationId === ORG_A);
  check('A4 nom mis à jour dans le DTO', data.name === 'New Name');
  check('A5 DTO sans phone/notes/organizationId', !('phone' in data) && !('notes' in data) && !('organizationId' in data));
}

// ── C. Résolution par téléphone (format legacy) + ajout de note ─────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead({ id: 'lead-c', phone: '+237612345678', notes: 'Initial note' })] });
  const r = await run(ASSISTANT_LEAD_A, { phone: '00237 612 345 678', notes: 'Called about pricing' }, h.writer);
  check('C1 résolution par téléphone legacy → ok', r.ok === true);
  check('C2 note ajoutée (contenu combiné)', h.state.store.get('lead-c')?.notes === 'Initial note\n\nCalled about pricing');
}

// ── D. Téléphone introuvable → LEAD_NOT_FOUND ───────────────────────────────
{
  const h = createMemoryLeadWriter();
  const r = await run(ASSISTANT_LEAD_A, { phone: '+237699999999', name: 'X' }, h.writer);
  check('D1 téléphone inconnu → LEAD_NOT_FOUND', r.ok === false && r.error.code === 'LEAD_NOT_FOUND');
  check('D2 aucune écriture', h.state.updateCalls === 0);
}

// ── E. Résolution ambiguë (formats multiples) → LEAD_AMBIGUOUS ──────────────
{
  const h = createMemoryLeadWriter({
    seed: [
      seedLead({ id: 'amb-1', phone: '+237612345678' }),
      seedLead({ id: 'amb-2', phone: '237612345678' }),
    ],
  });
  const r = await run(ASSISTANT_LEAD_A, { phone: '+237612345678', name: 'X' }, h.writer);
  check('E1 identité ambiguë → LEAD_AMBIGUOUS', r.ok === false && r.error.code === 'LEAD_AMBIGUOUS');
  check('E2 matchCount borné', r.ok === false && typeof (r.error.details as Data | undefined)?.matchCount === 'number');
  check('E3 aucune écriture', h.state.updateCalls === 0);
}

// ── E. Id d'un autre tenant → LEAD_NOT_FOUND ────────────────────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead({ id: 'other-b', organizationId: ORG_B, phone: '+237600000001' })] });
  const r = await run(ASSISTANT_LEAD_A, { contact_id: 'other-b', name: 'Hack' }, h.writer);
  check('F1 id autre tenant → LEAD_NOT_FOUND', r.ok === false && r.error.code === 'LEAD_NOT_FOUND');
  check('F2 aucune écriture', h.state.store.get('other-b')?.name === 'Seed Lead');
}

// ── F. Aucune identité → refus ──────────────────────────────────────────────
{
  const h = createMemoryLeadWriter();
  const r = await run(ASSISTANT_LEAD_A, { name: 'NoTarget' }, h.writer);
  check('G1 aucune identité → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
}

// ── G. Aucun champ à modifier → refus ───────────────────────────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead({ id: 'lead-g', phone: '+237612345678' })] });
  const r = await run(ASSISTANT_LEAD_A, { contact_id: 'lead-g' }, h.writer);
  check('H1 aucun champ → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
}

// ── H. Email invalide → refus ───────────────────────────────────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead({ id: 'lead-h', phone: '+237612345678' })] });
  const r = await run(ASSISTANT_LEAD_A, { contact_id: 'lead-h', email: 'bad@@x' }, h.writer);
  check('I1 email invalide → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
}

// ── I. Clé inconnue → refus ─────────────────────────────────────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead({ id: 'lead-i', phone: '+237612345678' })] });
  const r = await run(ASSISTANT_LEAD_A, { contact_id: 'lead-i', organizationId: ORG_B }, h.writer);
  check('J1 clé inconnue → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
}

// ── J. Champs interdits → refus (fail-closed) ───────────────────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead({ id: 'lead-j', phone: '+237612345678' })] });
  const r = await run(ASSISTANT_LEAD_A, { contact_id: 'lead-j', optedOut: true }, h.writer);
  check('K1 optedOut interdit → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
  check('K2 optedOut inchangé', h.state.store.get('lead-j')?.optedOut === false);
}

// ── K. Assistant sans grant → NOT_ALLOWED ───────────────────────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead({ id: 'lead-k', phone: '+237612345678' })] });
  const r = await run(ASSISTANT_READ_A, { contact_id: 'lead-k', name: 'X' }, h.writer);
  check('L1 assistant read-only → NOT_ALLOWED', r.ok === false && r.error.code === 'NOT_ALLOWED');
  check('L2 aucune écriture', h.state.updateCalls === 0);
}

// ── L. Rate limiting d'écriture ─────────────────────────────────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead({ id: 'lead-l', phone: '+237612345678' })] });
  const writeRateLimiter = createAIToolRateLimiter({ assistant: { max: 1, windowMs: 60_000 }, now: () => NOW_MS });
  const first = await run(ASSISTANT_LEAD_A, { contact_id: 'lead-l', name: 'A' }, h.writer, { writeRateLimiter });
  const second = await run(ASSISTANT_LEAD_A, { contact_id: 'lead-l', name: 'B' }, h.writer, { writeRateLimiter });
  check('M1 premier écrit autorisé', first.ok === true);
  check('M2 second écrit rate-limité → TEMPORARILY_UNAVAILABLE', second.ok === false && second.error.code === 'TEMPORARILY_UNAVAILABLE');
}

// ── M. Absence de perte de mise à jour concurrente (notes) ──────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead({ id: 'lead-m', phone: '+237612345678', notes: 'base' })] });
  const results = await Promise.all([
    run(ASSISTANT_LEAD_A, { contact_id: 'lead-m', notes: 'note-A' }, h.writer),
    run(ASSISTANT_LEAD_A, { contact_id: 'lead-m', notes: 'note-B' }, h.writer),
  ]);
  const finalNotes = h.state.store.get('lead-m')?.notes ?? '';
  check('N1 les deux écritures réussissent', results.every((r) => r.ok === true));
  check('N2 aucune note perdue', finalNotes.includes('note-A') && finalNotes.includes('note-B') && finalNotes.includes('base'));
  check('N3 au moins un retry de sérialisation', h.state.transactionCalls >= 3);
}

// ── N. Observabilité des échecs de résolution ───────────────────────────────
{
  const h = createMemoryLeadWriter();
  const sink: AIToolMemoryEventSink = createMemoryEventSink();
  await run(ASSISTANT_LEAD_A, { phone: '+237699999999', notes: 'x' }, h.writer, { events: sink });
  check('O1 échec not-found audité', sink.events.some((e) => e.name === 'AI_LEAD_UPDATE_NOT_FOUND'));

  const h2 = createMemoryLeadWriter({ seed: [seedLead({ id: 'amb1', phone: '237612345678' }), seedLead({ id: 'amb2', phone: '+237612345678' })] });
  const sink2: AIToolMemoryEventSink = createMemoryEventSink();
  await run(ASSISTANT_LEAD_A, { phone: '+237612345678', notes: 'x' }, h2.writer, { events: sink2 });
  check('O2 échec ambiguous audité', sink2.events.some((e) => e.name === 'AI_LEAD_UPDATE_AMBIGUOUS'));
}

// ── O. Mapping HTTP des erreurs métier ──────────────────────────────────────
{
  const mkDeps = (code: 'LEAD_NOT_FOUND' | 'LEAD_AMBIGUOUS') => ({
    verifySignature: () => ({ ok: true as const, timestamp: String(NOW_MS / 1000) }),
    publicKeyProvider: async () => 'irrelevant',
    claim: createInMemoryTelnyxAIToolReplayClaimer().claim,
    executeTool: async () => ({ ok: false as const, toolName: 'update_lead', requestId: 'r', error: { code } }),
    events: createMemoryEventSink(),
    now: () => NOW_MS,
    generateRequestId: () => `wh-${++reqSeq}`,
  });
  const notFound = await handleTelnyxAIToolWebhook(
    { rawBody: JSON.stringify({ assistant_id: ASSISTANT_LEAD_A, tool: 'update_lead', arguments: { contact_id: 'x', name: 'y' } }), headers: {} },
    mkDeps('LEAD_NOT_FOUND')
  );
  check('P1 LEAD_NOT_FOUND → 404', notFound.httpStatus === 404);
  const ambiguous = await handleTelnyxAIToolWebhook(
    { rawBody: JSON.stringify({ assistant_id: ASSISTANT_LEAD_A, tool: 'update_lead', arguments: { phone: '+237612345678', name: 'y' } }), headers: {} },
    mkDeps('LEAD_AMBIGUOUS')
  );
  check('P2 LEAD_AMBIGUOUS → 409', ambiguous.httpStatus === 409);
}

console.log('');
console.log(failures === 0 ? 'AI CRM LEAD UPDATE : COUVERTURE COMPLÈTE' : `AI CRM LEAD UPDATE : ${failures} ÉCHEC(S)`);
process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
