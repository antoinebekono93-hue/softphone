/**
 * Tests PHASE 3 — Webhook tool Telnyx : authentification, anti-rejeu, isolation.
 *
 * Couvre le pipeline complet du endpoint unique POST /api/ai/tools/telnyx :
 * signature Ed25519 fail-closed sur le body brut ({timestamp}|{raw_body}),
 * fenêtre d'horloge, idempotence, contrat strict du body signé, résolution
 * d'identité, outil read-only, indirection de tenant et journalisation sans
 * PII. Aucune base de données requise (le claim est injecté en mémoire).
 *
 * Exécution : npx tsx scripts/test-telnyx-ai-tool-webhook.ts
 */

import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { executeAIToolCall } from '../lib/ai-tools/execute';
import { listEnabledToolNames, listRegisteredToolNames } from '../lib/ai-tools/registry';
import { buildTelnyxToolDefinitionsForEmployee } from '../lib/ai-tools/telnyx-definitions';
import { handleTelnyxAIToolWebhook } from '../lib/ai-tools/webhook/handler';
import type {
  TelnyxAIToolWebhookDeps,
  TelnyxAIToolWebhookInput,
  TelnyxAIToolWebhookResponse,
} from '../lib/ai-tools/webhook/handler';
import { verifyTelnyxWebhookSignature } from '../lib/ai-tools/webhook/signature';
import { createInMemoryTelnyxAIToolReplayClaimer } from '../lib/ai-tools/webhook/replay-claims';
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

// ── Clé Ed25519 réaliste (PEM) ───────────────────────────────────────────────
const { publicKey: pubSpki, privateKey } = generateKeyPairSync('ed25519');
const PUBLIC_KEY = pubSpki.export({ type: 'spki', format: 'pem' }).toString();
const signKey: KeyObject = privateKey;

const NOW_S = 1_750_000_000;
const NOW_MS = NOW_S * 1000;

function signBody(timestamp: string, body: string): string {
  return sign(null, Buffer.from(`${timestamp}|${body}`, 'utf8'), signKey).toString('base64');
}

function makeInput(
  body: string,
  opts: { signature?: string; timestamp?: string } = {}
): TelnyxAIToolWebhookInput {
  return {
    rawBody: body,
    headers: {
      'telnyx-signature-ed25519': opts.signature,
      'telnyx-timestamp': opts.timestamp,
    },
  };
}

function signedBody(
  body: string,
  opts: { timestamp?: string; signature?: string } = {}
): { input: TelnyxAIToolWebhookInput; timestamp: string } {
  const timestamp = opts.timestamp ?? String(NOW_S);
  const signature = opts.signature ?? signBody(timestamp, body);
  return { input: makeInput(body, { signature, timestamp }), timestamp };
}

function toolBody(
  tool: string,
  args: Record<string, unknown>,
  assistantId = ASSISTANT_A,
  extra: Record<string, unknown> = {}
): string {
  return JSON.stringify({ assistant_id: assistantId, tool, arguments: args, ...extra });
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORG_A = 'org-a';
const ORG_B = 'org-b';
const ASSISTANT_A = 'telnyx-assistant-aaaa';
const ASSISTANT_B = 'telnyx-assistant-bbbb';

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

let clock = 0;
let requestSeq = 0;

function buildToolDeps(counters: DbCounters): AIToolDeps {
  return {
    db: buildFakeDb(counters),
    rateLimiter: createAIToolRateLimiter(),
    replayStore: createInMemoryReplayStore(() => clock),
    events: createMemoryEventSink(),
    now: () => clock++,
    generateRequestId: () => `tool-req-${++requestSeq}`,
  };
}

interface Harness {
  deps: TelnyxAIToolWebhookDeps;
  sink: AIToolMemoryEventSink;
  counters: DbCounters;
}

function buildHarness(overrides: Partial<TelnyxAIToolWebhookDeps> = {}): Harness {
  const counters: DbCounters = { getContact: 0, findContactByPhone: 0 };
  const sink = createMemoryEventSink();
  const base: TelnyxAIToolWebhookDeps = {
    verifySignature: verifyTelnyxWebhookSignature,
    publicKeyProvider: async () => PUBLIC_KEY,
    claim: createInMemoryTelnyxAIToolReplayClaimer().claim,
    executeTool: (input) => executeAIToolCall(input, buildToolDeps(counters)),
    events: sink,
    now: () => NOW_MS,
    generateRequestId: () => `wh-req-${++requestSeq}`,
  };
  return { deps: { ...base, ...overrides }, sink, counters };
}

async function call(
  input: TelnyxAIToolWebhookInput,
  harness: Harness
): Promise<TelnyxAIToolWebhookResponse> {
  return handleTelnyxAIToolWebhook(input, harness.deps);
}

type Data = Record<string, unknown>;

async function main() {
// ── A. Signature valide → outil read-only exécuté ───────────────────────────
{
  const har = buildHarness();
  const { input } = signedBody(toolBody('get_contact', { contact_id: 'contact-a1' }));
  const r = await call(input, har);
  check('A1 signature valide → 200', r.httpStatus === 200);
  check(
    'A2 résultat du contact du tenant (DTO)',
    r.httpStatus === 200 && (r.body.result as Data | undefined)?.id === 'contact-a1'
  );
  check(
    'A3 événements signature valide + autorisé',
    har.sink.events.some((e) => e.name === 'AI_TOOL_WEBHOOK_SIGNATURE_VALID') &&
      har.sink.events.some((e) => e.name === 'AI_TOOL_WEBHOOK_AUTHORIZED')
  );
}

// ── B. Signature invalide → refus fail-closed ───────────────────────────────
{
  const har = buildHarness();
  const body = toolBody('get_contact', { contact_id: 'contact-a1' });
  const { input } = signedBody(body, { signature: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==' });
  const r = await call(input, har);
  check('B1 signature invalide → 401 UNAUTHORIZED', r.httpStatus === 401 && r.body.error === 'UNAUTHORIZED');
  check(
    'B2 aucun événement autorisé (aucune ressource outil consommée)',
    !har.sink.events.some((e) => e.name === 'AI_TOOL_WEBHOOK_AUTHORIZED')
  );
  check(
    'B3 événement AI_TOOL_WEBHOOK_SIGNATURE_INVALID émis',
    har.sink.events.some((e) => e.name === 'AI_TOOL_WEBHOOK_SIGNATURE_INVALID')
  );
}

// ── C. Signature absente → refus ────────────────────────────────────────────
{
  const har = buildHarness();
  const { input } = signedBody(toolBody('get_contact', { contact_id: 'contact-a1' }));
  const noSig = makeInput(input.rawBody, { timestamp: String(NOW_S) });
  const r = await call(noSig, har);
  check('C1 signature absente → 401', r.httpStatus === 401);
  check('C2 raison MISSING_SIGNATURE', har.sink.events.some((e) => e.reason === 'MISSING_SIGNATURE'));
}

// ── D. Timestamp absent → refus ─────────────────────────────────────────────
{
  const har = buildHarness();
  const body = toolBody('get_contact', { contact_id: 'contact-a1' });
  const noTs = makeInput(body, { signature: signBody(String(NOW_S), body) });
  const r = await call(noTs, har);
  check('D1 timestamp absent → 401', r.httpStatus === 401);
}

// ── E. Timestamp expiré (trop ancien) → refus ───────────────────────────────
{
  const har = buildHarness();
  const body = toolBody('get_contact', { contact_id: 'contact-a1' });
  const { input } = signedBody(body, { timestamp: String(NOW_S - 400) });
  const r = await call(input, har);
  check('E1 timestamp trop ancien (> 300s) → 401', r.httpStatus === 401);
  check('E2 raison TIMESTAMP_TOO_OLD', har.sink.events.some((e) => e.reason === 'TIMESTAMP_TOO_OLD'));
}

// ── F. Timestamp futur → refus ──────────────────────────────────────────────
{
  const har = buildHarness();
  const body = toolBody('get_contact', { contact_id: 'contact-a1' });
  const { input } = signedBody(body, { timestamp: String(NOW_S + 400) });
  const r = await call(input, har);
  check('F1 timestamp futur (> +300s) → 401', r.httpStatus === 401);
}

// ── G. Body modifié après signature → refus ─────────────────────────────────
{
  const har = buildHarness();
  const original = toolBody('get_contact', { contact_id: 'contact-a1' });
  const timestamp = String(NOW_S);
  const tampered = original.replace('contact-a1', 'contact-b1');
  const { input } = signedBody(tampered, { timestamp, signature: signBody(timestamp, original) });
  const r = await call(input, har);
  check('G1 body re-signé différemment → 401', r.httpStatus === 401);
}

// ── H. Rejeu exact dédupliqué (claim idempotence) ───────────────────────────
{
  const har = buildHarness();
  const body = toolBody('get_contact', { contact_id: 'contact-a1' });
  const first = await call(signedBody(body).input, har);
  const second = await call(signedBody(body).input, har);
  check('H1 premier appel exécuté → 200 ok', first.httpStatus === 200 && first.body.ok === true);
  check(
    'H2 rejeu strictement identique → dédupliqué, pas d\'exécution',
    second.httpStatus === 200 &&
      second.body.deduplicated === true &&
      second.body.ok === true
  );
  check(
    'H3 handler contact exécuté une seule fois',
    har.counters.getContact === 1,
    `getContact=${har.counters.getContact}`
  );
  check(
    'H4 événement rejeu émis',
    har.sink.events.some((e) => e.name === 'AI_TOOL_WEBHOOK_REPLAY_REJECTED')
  );
}

// ── I. Assistant inconnu → refus ────────────────────────────────────────────
{
  const har = buildHarness();
  const { input } = signedBody(toolBody('get_contact', { contact_id: 'contact-a1' }, 'assistant-unknown'));
  const r = await call(input, har);
  check('I1 assistant inconnu → 404 NOT_FOUND', r.httpStatus === 404 && r.body.error === 'NOT_FOUND');
}

// ── J. Isolation de tenant (assistant autre tenant → données inaccessibles) ─
{
  const har = buildHarness();
  const { input } = signedBody(toolBody('get_contact', { contact_id: 'contact-a1' }, ASSISTANT_B));
  const r = await call(input, har);
  check('J1 assistant du tenant B + contact du tenant A → 404 NOT_FOUND', r.httpStatus === 404);

  const har2 = buildHarness();
  const { input: okInput } = signedBody(toolBody('get_contact', { contact_id: 'contact-b1' }, ASSISTANT_B));
  const ok = await call(okInput, har2);
  check('J2 le même assistant accède à SON tenant → 200', ok.httpStatus === 200);
}

// ── K. Outil d'écriture refusé ──────────────────────────────────────────────
{
  const har = buildHarness();
  const { input } = signedBody(toolBody('create_contact', { name: 'X' }));
  const r = await call(input, har);
  check('K1 outil d\'écriture futur non exposé → refus (404 de sécurité)', r.httpStatus === 404 && r.body.error === 'NOT_FOUND');
  check(
    'K2 aucun outil d\'écriture dans le registre actif',
    !listRegisteredToolNames().includes('create_contact') &&
      !listEnabledToolNames().includes('create_contact')
  );
}

// ── L. Outil read-only autorisé (chemin téléphone) ──────────────────────────
{
  const har = buildHarness();
  const { input } = signedBody(toolBody('get_customer_by_phone', { phone: '+237612345678' }));
  const r = await call(input, har);
  check('L1 get_customer_by_phone → 200 ok', r.httpStatus === 200 && r.body.ok === true);
}

// ── M. JSON malformé → refus ────────────────────────────────────────────────
{
  const har = buildHarness();
  const { input } = signedBody('{ ceci n\'est pas du json');
  const r = await call(input, har);
  check('M1 JSON malformé → 400 INVALID_REQUEST', r.httpStatus === 400 && r.body.error === 'INVALID_REQUEST');
}

// ── N. Body surdimensionné → refus avant toute vérification lourde ──────────
{
  const har = buildHarness({ maxBodyBytes: 256 });
  const body = toolBody('get_contact', { contact_id: 'contact-a1', filler: 'x'.repeat(2000) });
  const { input } = signedBody(body);
  const r = await call(input, har);
  check('N1 body > limite → 413 INVALID_REQUEST', r.httpStatus === 413 && r.body.error === 'INVALID_REQUEST');
}

// ── O. Outil inconnu → refus ────────────────────────────────────────────────
{
  const har = buildHarness();
  const { input } = signedBody(toolBody('frobnicate', {}));
  const r = await call(input, har);
  check('O1 outil inconnu → 404 NOT_FOUND', r.httpStatus === 404 && r.body.error === 'NOT_FOUND');
}

// ── P. organizationId injecté → jamais utilisé, rejeté ou neutre ────────────
{
  const har = buildHarness();
  const { input } = signedBody(toolBody('get_contact', { contact_id: 'contact-a1', organizationId: ORG_B }));
  const r = await call(input, har);
  check('P1 organizationId dans les arguments → 400 INVALID_ARGUMENTS', r.httpStatus === 400 && r.body.error === 'INVALID_ARGUMENTS');

  const har2 = buildHarness();
  const { input: topInput } = signedBody(
    toolBody('get_contact', { contact_id: 'contact-a1' }, ASSISTANT_A, { organizationId: ORG_B })
  );
  const r2 = await call(topInput, har2);
  check('P2 organizationId au niveau racine du body → 400 INVALID_REQUEST', r2.httpStatus === 400 && r2.body.error === 'INVALID_REQUEST');
}

// ── M bis. Journalisation sans PII (webhook) ────────────────────────────────
{
  const har = buildHarness();
  const { input } = signedBody(toolBody('get_customer_by_phone', { phone: '+237612345678' }));
  await call(input, har);
  const serialized = JSON.stringify(har.sink.events);
  check('B3 (Mbis) events sans nom de contact', !serialized.includes('Jane Secret'));
  check('Mbis2 events sans téléphone', !serialized.includes('+237612345678') && !serialized.includes('237612345678'));
  check('Mbis3 events sans email', !serialized.includes('jane@acme.test'));
}

// ── Définitions Telnyx : endpoint unique + preset signés ────────────────────
{
  const defs = buildTelnyxToolDefinitionsForEmployee(
    { voiceProvider: 'TELNYX', isActive: true },
    { baseUrl: 'https://app.example.com/', assistantId: ASSISTANT_A }
  );
  const urls = new Set(defs.map((d) => d.webhook.url));
  check('D2 (builder) URL unique pour tous les outils', defs.length > 0 && urls.size === 1, [...urls].join(', '));
  check(
    'D3 (builder) preset_body_fields assistant_id signé',
    defs.every((d) => d.webhook.preset_body_fields?.assistant_id === ASSISTANT_A)
  );
  check(
    'D4 (builder) preset_body_fields.tool = nom de l\'outil',
    defs.every((d) => d.webhook.preset_body_fields?.tool === d.webhook.name)
  );
  check(
    'D5 (builder) mode sync (read-only)',
    defs.every((d) => d.webhook.execution_mode === 'sync')
  );
}

// ── Static : le core webhook n'importe jamais Prisma (DB-free) ──────────────
{
  const files = ['signature.ts', 'parse.ts', 'handler.ts', 'replay-claims.ts'];
  const offenders = files.filter((f) => {
    const src = readFileSync(join(ROOT, 'lib', 'ai-tools', 'webhook', f), 'utf8');
    return src.includes('@/lib/prisma') || src.includes('prisma');
  });
  check('E2 (static) core webhook DB-free', offenders.length === 0, offenders.join(', '));
}

console.log('');
console.log(failures === 0 ? 'TELNYX AI TOOL WEBHOOK : COUVERTURE COMPLÈTE' : `TELNYX AI TOOL WEBHOOK : ${failures} ÉCHEC(S)`);
process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});