/**
 * Tests PHASE 2 — Registre d'outils Telnyx AI + garde-fous de sécurité.
 *
 * Vérifie le contrat read-only, l'isolation multi-tenant, la validation
 * stricte, l'anti-rejeu, le rate limiting, l'observabilité sans PII et
 * l'absence d'écriture. Aucune base de données requise : les dépendances sont
 * injectées.
 *
 * Exécution : npx tsx scripts/test-ai-tools.ts
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { executeAIToolCall } from '../lib/ai-tools/execute';
import { resolveAuthorizedAssistant } from '../lib/ai-tools/context';
import {
  buildToolDefinitionsForPermissions,
  getAIToolDefinition,
  listRegisteredToolNames,
} from '../lib/ai-tools/registry';
import { buildTelnyxToolDefinitionsForEmployee } from '../lib/ai-tools/telnyx-definitions';
import { FUTURE_AI_TOOLS } from '../lib/ai-tools/future-tools';
import { createAIToolRateLimiter } from '../lib/ai-tools/rate-limit';
import { createInMemoryReplayStore } from '../lib/ai-tools/replay';
import { createMemoryEventSink, type AIToolMemoryEventSink } from '../lib/ai-tools/observability';
import type {
  AIToolDataAccess,
  AIEmployeeIdentityRecord,
  ContactRecord,
  OpportunityRecord,
} from '../lib/ai-tools/data-access';
import type { AIToolDeps } from '../lib/ai-tools/types';

const ROOT = join(__dirname, '..');

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.ts')) out.push(full);
    }
  };
  walk(dir);
  return out;
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORG_A = 'org-a';
const ORG_B = 'org-b';
const ASSISTANT_A = 'assistant-aaaa';
const ASSISTANT_B = 'assistant-bbbb';
const ASSISTANT_DISABLED = 'assistant-disabled';

const employeeA: AIEmployeeIdentityRecord = {
  id: 'emp-a',
  organizationId: ORG_A,
  voiceProvider: 'TELNYX',
  isActive: true,
};
const employeeB: AIEmployeeIdentityRecord = {
  id: 'emp-b',
  organizationId: ORG_B,
  voiceProvider: 'TELNYX',
  isActive: true,
};
const employeeDisabled: AIEmployeeIdentityRecord = {
  id: 'emp-d',
  organizationId: ORG_A,
  voiceProvider: 'TELNYX',
  isActive: false,
};

interface StoredContact extends ContactRecord {
  organizationId: string;
  phone: string | null;
}

const contacts: StoredContact[] = [
  {
    id: 'contact-a1',
    organizationId: ORG_A,
    phone: '+237612345678',
    name: 'Jane Secret',
    company: 'Acme',
    email: 'jane@acme.test',
    isVip: true,
    leadScore: 80,
    sentiment: 'positive',
    escalationStatus: null,
    optedOut: false,
  },
  {
    id: 'contact-a2',
    organizationId: ORG_A,
    phone: '+237699999999',
    name: 'Bob',
    company: 'Globex',
    email: 'bob@globex.test',
    isVip: false,
    leadScore: 20,
    sentiment: 'neutral',
    escalationStatus: null,
    optedOut: false,
  },
  {
    id: 'contact-b1',
    organizationId: ORG_B,
    phone: '+237600000001',
    name: 'Other Tenant',
    company: 'Initech',
    email: 'x@initech.test',
    isVip: false,
    leadScore: 5,
    sentiment: null,
    escalationStatus: null,
    optedOut: false,
  },
];

const opportunities: Array<OpportunityRecord & { organizationId: string }> = [
  {
    id: 'opp-a1',
    organizationId: ORG_A,
    name: 'Renewal Acme',
    stage: 'NEGOTIATION',
    expectedRevenue: 12000,
    probability: 60,
    priority: 2,
    contactId: 'contact-a1',
    createdAt: new Date('2026-01-02T03:04:05.000Z'),
  },
  {
    id: 'opp-b1',
    organizationId: ORG_B,
    name: 'Other Deal',
    stage: 'NEW',
    expectedRevenue: 1,
    probability: 10,
    priority: 0,
    contactId: 'contact-b1',
    createdAt: new Date('2026-02-02T03:04:05.000Z'),
  },
];

interface DbCounters {
  getContact: number;
  findContactByPhone: number;
}

function buildFakeDb(counters: DbCounters): AIToolDataAccess {
  return {
    async findEmployeeByAssistantId(assistantId: string) {
      if (assistantId === ASSISTANT_A) return employeeA;
      if (assistantId === ASSISTANT_B) return employeeB;
      if (assistantId === ASSISTANT_DISABLED) return employeeDisabled;
      return null;
    },
    async findContactByPhone(organizationId: string, candidates: readonly string[]) {
      counters.findContactByPhone++;
      return (
        contacts.find(
          (c) =>
            c.organizationId === organizationId &&
            c.phone !== null &&
            candidates.includes(c.phone)
        ) ?? null
      );
    },
    async searchContacts(organizationId: string, query) {
      return contacts
        .filter((c) => c.organizationId === organizationId)
        .filter(
          (c) =>
            (c.name ?? '').toLowerCase().includes(query.query.toLowerCase()) ||
            (c.company ?? '').toLowerCase().includes(query.query.toLowerCase()) ||
            (c.email ?? '').toLowerCase().includes(query.query.toLowerCase())
        )
        .slice(0, query.limit);
    },
    async getContact(organizationId: string, contactId: string) {
      counters.getContact++;
      return (
        contacts.find(
          (c) => c.id === contactId && c.organizationId === organizationId
        ) ?? null
      );
    },
    async searchOpportunities(organizationId: string, query) {
      return opportunities
        .filter((o) => o.organizationId === organizationId)
        .filter((o) => o.name.toLowerCase().includes(query.query.toLowerCase()))
        .filter((o) => (query.stage ? o.stage === query.stage : true))
        .slice(0, query.limit);
    },
    async getOpportunity(organizationId: string, opportunityId: string) {
      return (
        opportunities.find(
          (o) => o.id === opportunityId && o.organizationId === organizationId
        ) ?? null
      );
    },
  };
}

let clock = 1_000_000;
let reqSeq = 0;

function buildDeps(
  counters: DbCounters,
  overrides: Partial<AIToolDeps> = {}
): AIToolDeps {
  return {
    db: buildFakeDb(counters),
    rateLimiter: createAIToolRateLimiter(),
    replayStore: createInMemoryReplayStore(() => clock),
    events: createMemoryEventSink(),
    now: () => clock++,
    generateRequestId: () => `req-${++reqSeq}`,
    ...overrides,
  };
}

type Data = Record<string, unknown>;

async function main() {
// ── A. Assistant inconnu → refus ────────────────────────────────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  const r = await executeAIToolCall(
    { assistantId: 'assistant-unknown', toolName: 'search_contacts', rawArguments: { query: 'acme' } },
    deps
  );
  check('A1 assistant inconnu → NOT_FOUND', r.ok === false && r.error.code === 'NOT_FOUND');
  const sink = deps.events as AIToolMemoryEventSink;
  check(
    'A2 assistant inconnu → événement AI_TOOL_DENIED, aucun AI_TOOL_AUTHORIZED',
    sink.events.some((e) => e.name === 'AI_TOOL_DENIED') &&
      !sink.events.some((e) => e.name === 'AI_TOOL_AUTHORIZED')
  );
}

// ── B. Assistant d'un autre tenant → refus ──────────────────────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  const r = await executeAIToolCall(
    {
      assistantId: ASSISTANT_B,
      expectedOrganizationId: ORG_A,
      toolName: 'search_contacts',
      rawArguments: { query: 'initech' },
    },
    deps
  );
  check('B1 assistant autre tenant (org mismatch) → NOT_ALLOWED', r.ok === false && r.error.code === 'NOT_ALLOWED');
}

// ── C. Assistant désactivé → refus ──────────────────────────────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  const r = await executeAIToolCall(
    { assistantId: ASSISTANT_DISABLED, toolName: 'search_contacts', rawArguments: { query: 'acme' } },
    deps
  );
  check('C1 assistant désactivé → NOT_ALLOWED', r.ok === false && r.error.code === 'NOT_ALLOWED');
}

// ── D. Outil non allowlisté → refus ─────────────────────────────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  const r = await executeAIToolCall(
    { assistantId: ASSISTANT_A, toolName: 'send_sms', rawArguments: { to: '+237612345678', body: 'x' } },
    deps
  );
  check('D1 outil non enregistré/allowlisté → NOT_ALLOWED', r.ok === false && r.error.code === 'NOT_ALLOWED');
  check('D2 outil futur non enregistré (create_contact)', getAIToolDefinition('create_contact') === undefined);
  check(
    'D3 les outils futurs ne sont pas dans le registre',
    FUTURE_AI_TOOLS.every((t) => !listRegisteredToolNames().includes(t.name))
  );
}

// ── E. Contact même tenant accessible (normalisation téléphone) ─────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  const r = await executeAIToolCall(
    { assistantId: ASSISTANT_A, toolName: 'get_customer_by_phone', rawArguments: { phone: '00237 612 345 678' } },
    deps
  );
  check('E1 contact même tenant trouvé', r.ok === true);
  check('E2 identité correcte', r.ok === true && (r.data as Data).id === 'contact-a1');
  check('E3 téléphone normalisé (candidats)', counters.findContactByPhone === 1);
}

// ── F. Contact d'un autre tenant inaccessible ───────────────────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  const r = await executeAIToolCall(
    { assistantId: ASSISTANT_A, toolName: 'get_contact', rawArguments: { contact_id: 'contact-b1' } },
    deps
  );
  check('F1 contact autre tenant → NOT_FOUND', r.ok === false && r.error.code === 'NOT_FOUND');
}

// ── G. Arguments invalides → refus ──────────────────────────────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  const missing = await executeAIToolCall(
    { assistantId: ASSISTANT_A, toolName: 'get_contact', rawArguments: {} },
    deps
  );
  check('G1 champ requis manquant → INVALID_ARGUMENTS', missing.ok === false && missing.error.code === 'INVALID_ARGUMENTS');

  const deps2 = buildDeps(counters);
  const tooShort = await executeAIToolCall(
    { assistantId: ASSISTANT_A, toolName: 'search_contacts', rawArguments: { query: 'a' } },
    deps2
  );
  check('G2 recherche trop courte → INVALID_ARGUMENTS', tooShort.ok === false && tooShort.error.code === 'INVALID_ARGUMENTS');
}

// ── H. Recherche surdimensionnée → refus ────────────────────────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  const r = await executeAIToolCall(
    { assistantId: ASSISTANT_A, toolName: 'search_contacts', rawArguments: { query: 'x'.repeat(200) } },
    deps
  );
  check('H1 recherche > 80 caractères → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');

  const deps2 = buildDeps(counters);
  const r2 = await executeAIToolCall(
    { assistantId: ASSISTANT_A, toolName: 'search_contacts', rawArguments: { query: 'acme', limit: 999 } },
    deps2
  );
  check('H2 limite hors borne → INVALID_ARGUMENTS', r2.ok === false && r2.error.code === 'INVALID_ARGUMENTS');
}

// ── I. Jamais d'objet Prisma complet (DTO seulement) ────────────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  const r = await executeAIToolCall(
    { assistantId: ASSISTANT_A, toolName: 'get_contact', rawArguments: { contact_id: 'contact-a1' } },
    deps
  );
  const data = (r.ok ? r.data : {}) as Data;
  const forbidden = ['phone', 'notes', 'organizationId', 'totalSpent', 'lifetimeValue', 'purchaseCount'];
  check('I1 DTO sans champs sensibles', forbidden.every((k) => !(k in data)), JSON.stringify(data));
  check('I2 DTO expose uniquement des clés attendues', 'id' in data && 'name' in data);
}

// ── J. Le registre read-only n'écrit jamais ─────────────────────────────────
{
  const files = filesUnder(join(ROOT, 'lib', 'ai-tools'));
  // Cible précise : les ÉCRITURES du client Prisma sur un modèle. Le regex
  // précédent (tout `.update(` / `.create(`) captait aussi des appels crypto
  // légitimes (createHash().update()) ; on vise désormais `prisma.<modèle>.<write>(`.
  const mutationRegex = /prisma\.[A-Za-z0-9_]+\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/;
  const offenders = files.filter((f) => {
    const src = readFileSync(f, 'utf8');
    return mutationRegex.test(src);
  });
  check('J1 aucun appel Prisma d\'écriture dans lib/ai-tools', offenders.length === 0, offenders.join(', '));

  const dataAccessSrc = readFileSync(join(ROOT, 'lib', 'ai-tools', 'data-access.ts'), 'utf8');
  check('J2 l\'interface data-access n\'expose que des lectures', !mutationRegex.test(dataAccessSrc));

  const enabled = buildToolDefinitionsForPermissions(['contacts:read', 'crm:read']);
  check('J3 tous les outils activés sont READ_ONLY', enabled.every((d) => d.riskLevel === 'READ_ONLY'));
  check('J4 ≥ 5 outils read-only activés', enabled.length >= 5);

  const writeDefs = FUTURE_AI_TOOLS.filter((t) => t.riskLevel !== 'READ_ONLY');
  check('J5 outils d\'écriture non enregistrés', writeDefs.every((t) => getAIToolDefinition(t.name) === undefined));
}

// ── K. Rate limiting appliqué ───────────────────────────────────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters, {
    now: () => 5000,
    rateLimiter: createAIToolRateLimiter({
      organization: { max: 1, windowMs: 60_000 },
      now: () => 5000,
    }),
  });
  const first = await executeAIToolCall(
    { assistantId: ASSISTANT_A, toolName: 'search_contacts', rawArguments: { query: 'acme' } },
    deps
  );
  const second = await executeAIToolCall(
    { assistantId: ASSISTANT_A, toolName: 'search_contacts', rawArguments: { query: 'acme' } },
    deps
  );
  check('K1 premier appel autorisé', first.ok === true);
  check('K2 second appel rate-limité → TEMPORARILY_UNAVAILABLE', second.ok === false && second.error.code === 'TEMPORARILY_UNAVAILABLE');
}

// ── L. Requête dupliquée sûre (anti-rejeu) ──────────────────────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  const args = {
    assistantId: ASSISTANT_A,
    toolName: 'get_contact',
    rawArguments: { contact_id: 'contact-a1' },
    idempotencyKey: 'tool-call-123',
  };
  const first = await executeAIToolCall(args, deps);
  const callsAfterFirst = counters.getContact;
  const second = await executeAIToolCall(args, deps);
  check('L1 doublon : même résultat', first.ok === true && second.ok === true && (first.data as Data).id === (second.data as Data).id);
  check('L2 doublon : handler exécuté une seule fois', callsAfterFirst === 1 && counters.getContact === 1);
}

// ── M. Journalisation sans PII ──────────────────────────────────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  await executeAIToolCall(
    { assistantId: ASSISTANT_A, toolName: 'get_customer_by_phone', rawArguments: { phone: '+237612345678' } },
    deps
  );
  const sink = deps.events as AIToolMemoryEventSink;
  const serialized = JSON.stringify(sink.events);
  check('M1 events sans nom de contact', !serialized.includes('Jane Secret'));
  check('M2 events sans email', !serialized.includes('jane@acme.test'));
  check('M3 events sans téléphone', !serialized.includes('+237612345678') && !serialized.includes('237612345678'));
  check('M4 events contiennent les identifiants internes', sink.events.some((e) => e.employeeId === 'emp-a' && e.organizationId === ORG_A));
}

// ── N. organizationId falsifié dans les arguments → refusé ──────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  const r = await executeAIToolCall(
    {
      assistantId: ASSISTANT_A,
      toolName: 'get_contact',
      rawArguments: { contact_id: 'contact-a1', organizationId: ORG_B },
    },
    deps
  );
  check('N1 organizationId dans les args → INVALID_ARGUMENTS', r.ok === false && r.error.code === 'INVALID_ARGUMENTS');
}

// ── O. Définitions Telnyx (build pur, aucune écriture live) ──────────────────
{
  const defs = buildTelnyxToolDefinitionsForEmployee(
    { voiceProvider: 'TELNYX', isActive: true },
    { baseUrl: 'https://app.example.com/' }
  );
  check('O1 assistant TELNYX actif → outils read-only définis', defs.length >= 5 && defs.every((d) => d.type === 'webhook'));
  check('O2 URLs construites', defs.every((d) => d.webhook.url.startsWith('https://app.example.com/api/ai/tools/')));
  check('O3 aucun outil d\'écriture exposé', !defs.some((d) => ['send_sms', 'create_contact', 'transfer_to_human'].includes(d.webhook.name)));

  const legacy = buildTelnyxToolDefinitionsForEmployee(
    { voiceProvider: 'LEGACY', isActive: true },
    { baseUrl: 'https://app.example.com' }
  );
  check('O4 assistant LEGACY → aucun outil', legacy.length === 0);
}

// ── P. search_crm scope tenant + permission ────────────────────────────────
{
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const deps = buildDeps(counters);
  const r = await executeAIToolCall(
    { assistantId: ASSISTANT_A, toolName: 'search_crm', rawArguments: { query: 'renewal' } },
    deps
  );
  const data = (r.ok ? r.data : { count: -1 }) as { count: number };
  check('P1 search_crm renvoie l\'opportunité du tenant', r.ok === true && data.count === 1);

  const deps2 = buildDeps(counters);
  const r2 = await resolveAuthorizedAssistant({ assistantId: ASSISTANT_A }, deps2.db);
  check('P2 permissions accordées = read-only', r2.grantedPermissions.length === 2);
}

console.log('');
console.log(failures === 0 ? 'AI TOOLS : COUVERTURE COMPLÈTE' : `AI TOOLS : ${failures} ÉCHEC(S)`);
process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
