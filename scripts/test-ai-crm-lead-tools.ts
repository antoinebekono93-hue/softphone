/**
 * Tests PHASE 4B — `create_lead` (outil d'écriture CRM).
 *
 * Couvre l'autorisation explicite (`leads:write` via AIEmployee.allowedWriteTools),
 * l'isolation multi-tenant, la validation stricte, la normalisation téléphone,
 * l'anti-doublon (contrainte organisation+phone), l'idempotence de rejeu, le
 * rate limiting d'écriture, l'observabilité sans PII et le mapping HTTP webhook.
 * Aucune base de données requise (writer injecté en mémoire).
 *
 * Exécution : npx tsx scripts/test-ai-crm-lead-tools.ts
 */

import { executeAIToolCall } from '../lib/ai-tools/execute';
import {
  LEAD_WRITE_TOOLS,
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

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORG_A = 'org-a';
const ORG_B = 'org-b';
const ASSISTANT_LEAD_A = 'assistant-lead-a';
const ASSISTANT_READ_A = 'assistant-read-a';
const ASSISTANT_APPT_A = 'assistant-appt-a';
const ASSISTANT_LEAD_B = 'assistant-lead-b';

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
const employeeApptA: AIEmployeeIdentityRecord = {
  id: 'emp-appt-a',
  organizationId: ORG_A,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: ['create_appointment'],
};
const employeeLeadB: AIEmployeeIdentityRecord = {
  id: 'emp-lead-b',
  organizationId: ORG_B,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: ['create_lead', 'update_lead'],
};

const employees: Record<string, AIEmployeeIdentityRecord> = {
  [ASSISTANT_LEAD_A]: employeeLeadA,
  [ASSISTANT_READ_A]: employeeReadA,
  [ASSISTANT_APPT_A]: employeeApptA,
  [ASSISTANT_LEAD_B]: employeeLeadB,
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

function seedLead(overrides: Partial<LeadRecord> & { phone: string }): LeadRecord {
  return {
    id: overrides.id ?? `seed-${overrides.phone}`,
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
  overrides: Partial<AIToolDeps> = {},
  extra: { toolCallRequestId?: string | null; idempotencyKey?: string | null } = {}
) {
  return executeAIToolCall(
    {
      assistantId,
      toolName: 'create_lead',
      rawArguments: args,
      toolCallRequestId: extra.toolCallRequestId ?? null,
      idempotencyKey: extra.idempotencyKey ?? null,
    },
    makeDeps(writer, overrides)
  );
}

async function main() {
// ── A. Enregistré, WRITE, jamais implicite ──────────────────────────────────
{
  const def = getAIToolDefinition('create_lead');
  const upd = getAIToolDefinition('update_lead');
  check('A1 create_lead enregistré et WRITE', def?.riskLevel === 'WRITE');
  check('A2 update_lead enregistré et WRITE', upd?.riskLevel === 'WRITE');
  check(
    'A3 les deux présents dans le registre',
    listRegisteredToolNames().includes('create_lead') &&
      listRegisteredToolNames().includes('update_lead')
  );
  check(
    'A4 LEAD_WRITE_TOOLS = create_lead, update_lead',
    LEAD_WRITE_TOOLS.length === 2 &&
      LEAD_WRITE_TOOLS.includes('create_lead') &&
      LEAD_WRITE_TOOLS.includes('update_lead')
  );
  const readPerms = grantedPermissionsFor(employeeReadA);
  check('A5 assistant read-only sans leads:write', !readPerms.includes('leads:write'));
  const readTools = buildToolDefinitionsForPermissions(readPerms);
  check(
    'A6 aucun outil lead pour un assistant read-only',
    !readTools.some((d) => d.name === 'create_lead' || d.name === 'update_lead')
  );
  const leadPerms = grantedPermissionsFor(employeeLeadA);
  check('A7 grant explicite → leads:write', leadPerms.includes('leads:write'));
  const apptPerms = grantedPermissionsFor(employeeApptA);
  check('A8 grant appointments ne donne pas leads:write', !apptPerms.includes('leads:write'));
}

// ── B. Création nominale ────────────────────────────────────────────────────
{
  const h = createMemoryLeadWriter();
  const r = await run(ASSISTANT_LEAD_A, { phone: '00237 612 345 678', name: 'Jane Acme', company: 'Acme', email: 'jane@acme.test', notes: 'Interested in plan B' }, h.writer);
  const data = (r.ok ? r.data : {}) as Data;
  check('B1 création → ok', r.ok === true);
  check('B2 writer appelé une fois', h.state.createCalls === 1);
  check('B3 org = celle de l\'assistant', h.state.lastCreateInput?.organizationId === ORG_A);
  check('B4 téléphone canonique +237…', h.state.lastCreateInput?.phone === '+237612345678');
  check('B5 DTO expose id + nom', data.id !== undefined && data.name === 'Jane Acme');
  check('B6 DTO sans phone/notes/organizationId', !('phone' in data) && !('notes' in data) && !('organizationId' in data));
}

// ── C. Lead vide (téléphone seul) → refus ───────────────────────────────────
{
  const h = createMemoryLeadWriter();
  const r = await run(ASSISTANT_LEAD_A, { phone: '+237612345678' }, h.writer);
  check('C1 téléphone seul → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
  check('C2 aucune insertion', h.state.insertCalls === 0);
}

// ── D. Téléphone invalide → refus ───────────────────────────────────────────
{
  const h = createMemoryLeadWriter();
  const r = await run(ASSISTANT_LEAD_A, { phone: 'abc', name: 'X' }, h.writer);
  check('D1 téléphone invalide → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
}

// ── E. Email invalide → refus ───────────────────────────────────────────────
{
  const h = createMemoryLeadWriter();
  const r = await run(ASSISTANT_LEAD_A, { phone: '+237612345678', name: 'X', email: 'not-an-email' }, h.writer);
  check('E1 email invalide → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
}

// ── F. Clés inconnues (organizationId) → refus ──────────────────────────────
{
  const h = createMemoryLeadWriter();
  const r = await run(ASSISTANT_LEAD_A, { phone: '+237612345678', name: 'X', organizationId: ORG_B }, h.writer);
  check('F1 organizationId en argument → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
  check('F2 aucune insertion', h.state.insertCalls === 0);
}

// ── G. Doublon même organisation → LEAD_ALREADY_EXISTS ──────────────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead({ phone: '+237612345678', organizationId: ORG_A, id: 'existing-a' })] });
  const r = await run(ASSISTANT_LEAD_A, { phone: '237612345678', name: 'Jane' }, h.writer);
  check('G1 doublon → LEAD_ALREADY_EXISTS', r.ok === false && r.error.code === 'LEAD_ALREADY_EXISTS');
  check('G2 leadId existant renvoyé', r.ok === false && (r.error.details as Data | undefined)?.leadId === 'existing-a');
  check('G3 aucune nouvelle insertion', h.state.insertCalls >= 1 && h.state.store.size === 1);
}

// ── H. Même téléphone, autre organisation → création autorisée ──────────────
{
  const h = createMemoryLeadWriter({ seed: [seedLead({ phone: '+237612345678', organizationId: ORG_B, id: 'existing-b' })] });
  const r = await run(ASSISTANT_LEAD_A, { phone: '+237612345678', name: 'Jane' }, h.writer);
  check('H1 isolation tenant → création dans ORG_A', r.ok === true);
  check('H2 un lead par organisation', h.state.store.size === 2);
}

// ── I. Assistant sans grant → NOT_ALLOWED (aucune écriture) ─────────────────
{
  const h = createMemoryLeadWriter();
  const r = await run(ASSISTANT_READ_A, { phone: '+237612345678', name: 'X' }, h.writer);
  check('I1 assistant read-only → NOT_ALLOWED', r.ok === false && r.error.code === 'NOT_ALLOWED');
  check('I2 aucune écriture tentée', h.state.createCalls === 0);
}

// ── J. Grant appointments uniquement → create_lead refusé ───────────────────
{
  const h = createMemoryLeadWriter();
  const r = await run(ASSISTANT_APPT_A, { phone: '+237612345678', name: 'X' }, h.writer);
  check('J1 grant non-lead → NOT_ALLOWED', r.ok === false && r.error.code === 'NOT_ALLOWED');
  check('J2 aucune écriture tentée', h.state.createCalls === 0);
}

// ── K. Rate limiting d'écriture dédié ───────────────────────────────────────
{
  const h = createMemoryLeadWriter();
  const writeRateLimiter = createAIToolRateLimiter({ assistant: { max: 1, windowMs: 60_000 }, now: () => NOW_MS });
  const first = await run(ASSISTANT_LEAD_A, { phone: '+237611111111', name: 'A' }, h.writer, { writeRateLimiter });
  const second = await run(ASSISTANT_LEAD_A, { phone: '+237622222222', name: 'B' }, h.writer, { writeRateLimiter });
  check('K1 premier écrit autorisé', first.ok === true);
  check('K2 second écrit rate-limité → TEMPORARILY_UNAVAILABLE', second.ok === false && second.error.code === 'TEMPORARILY_UNAVAILABLE');
}

// ── L. Idempotence anti-rejeu (même clé) ────────────────────────────────────
{
  const h = createMemoryLeadWriter();
  const deps = makeDeps(h.writer);
  const args = { assistantId: ASSISTANT_LEAD_A, toolName: 'create_lead', rawArguments: { phone: '+237612345678', name: 'Jane' }, idempotencyKey: 'lead-call-1' };
  const first = await executeAIToolCall(args, deps);
  const callsAfterFirst = h.state.createCalls;
  const second = await executeAIToolCall(args, deps);
  check('L1 rejeu même clé → même résultat', first.ok === true && second.ok === true && (first.data as Data).id === (second.data as Data).id);
  check('L2 handler exécuté une seule fois', callsAfterFirst === 1 && h.state.createCalls === 1);
}

// ── M. Webhook : sans grant → refus ; avec grant → création ─────────────────
{
  const makeWebhookDeps = (writer: ReturnType<typeof createMemoryLeadWriter>['writer']) => ({
    verifySignature: () => ({ ok: true as const, timestamp: String(NOW_MS / 1000) }),
    publicKeyProvider: async () => 'irrelevant',
    claim: createInMemoryTelnyxAIToolReplayClaimer().claim,
    executeTool: async (input: import('../lib/ai-tools/execute').ExecuteAIToolCallInput) =>
      executeAIToolCall(input, makeDeps(writer)),
    events: createMemoryEventSink(),
    now: () => NOW_MS,
    generateRequestId: () => `wh-${++reqSeq}`,
  });
  const hRead = createMemoryLeadWriter();
  const denied = await handleTelnyxAIToolWebhook(
    { rawBody: JSON.stringify({ assistant_id: ASSISTANT_READ_A, tool: 'create_lead', arguments: { phone: '+237612345678', name: 'X' } }), headers: {} },
    makeWebhookDeps(hRead.writer)
  );
  check('M1 webhook sans grant → 403', denied.httpStatus === 403);
  check('M2 aucune écriture', hRead.state.createCalls === 0);

  const hWrite = createMemoryLeadWriter();
  const allowed = await handleTelnyxAIToolWebhook(
    { rawBody: JSON.stringify({ assistant_id: ASSISTANT_LEAD_A, tool: 'create_lead', arguments: { phone: '+237612345678', name: 'Jane' } }), headers: {} },
    makeWebhookDeps(hWrite.writer)
  );
  check('M3 webhook avec grant → 200', allowed.httpStatus === 200 && allowed.body.ok === true);
  check('M4 une écriture', hWrite.state.createCalls === 1);
}

// ── N. Observabilité sans PII ───────────────────────────────────────────────
{
  const h = createMemoryLeadWriter();
  const sink: AIToolMemoryEventSink = createMemoryEventSink();
  await run(ASSISTANT_LEAD_A, { phone: '+237612345678', name: 'Jane Secret', email: 'jane@secret.test', notes: 'Private' }, h.writer, { events: sink });
  const names = sink.events.map((e) => e.name);
  check('N1 cycle d\'audit requested/created', names.includes('AI_LEAD_CREATE_REQUESTED') && names.includes('AI_LEAD_CREATED'));
  const serialized = JSON.stringify(sink.events);
  check('N2 événements sans PII', !serialized.includes('Jane Secret') && !serialized.includes('237612345678') && !serialized.includes('jane@secret.test'));
}

// ── O. Enregistré dans le registre global ───────────────────────────────────
{
  check('O1 create_lead listé', listRegisteredToolNames().includes('create_lead'));
  check('O2 update_lead listé', listRegisteredToolNames().includes('update_lead'));
  check('O3 create_contact (futur) non enregistré', getAIToolDefinition('create_contact') === undefined);
}

console.log('');
console.log(failures === 0 ? 'AI CRM LEAD TOOLS : COUVERTURE COMPLÈTE' : `AI CRM LEAD TOOLS : ${failures} ÉCHEC(S)`);
process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
