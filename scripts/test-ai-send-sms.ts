/**
 * Tests PHASE 4C — `send_sms` (outil d'envoi SMS Telnyx).
 *
 * Couvre l'autorisation explicite (`messages:write`), le fail-closed, la
 * validation stricte (< 1600, jamais tronqué), la résolution tenant-scopée du
 * destinataire (contact_id / numéro) et de l'expéditeur, l'opt-out, le claim
 * d'idempotence DURABLE avant envoi, la facturation (réservation/remboursement),
 * les pannes fournisseur certaines vs ambiguës, le rate limiting d'écriture,
 * le mapping HTTP webhook et l'observabilité sans PII.
 *
 * Aucune base de données, AUCUN appel réseau : le port fournisseur et le port
 * d'écriture sont injectés en mémoire.
 *
 * Exécution : npx tsx scripts/test-ai-send-sms.ts
 */

import { executeAIToolCall } from '../lib/ai-tools/execute';
import {
  SMS_WRITE_TOOLS,
  grantedPermissionsFor,
} from '../lib/ai-tools/allowlist';
import {
  buildToolDefinitionsForPermissions,
  getAIToolDefinition,
  listRegisteredToolNames,
} from '../lib/ai-tools/registry';
import { FUTURE_AI_TOOLS } from '../lib/ai-tools/future-tools';
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
import type { AIToolDeps, AIToolExecutionResult } from '../lib/ai-tools/types';
import {
  createMemorySmsSender,
  createMemorySmsWriter,
  type MemorySmsContact,
  type MemorySmsSender,
} from './helpers/memory-sms';

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
const ASSISTANT_SMS_A = 'assistant-sms-a';
const ASSISTANT_READ_A = 'assistant-read-a';
const ASSISTANT_APPT_A = 'assistant-appt-a';
const ASSISTANT_SMS_B = 'assistant-sms-b';
const ASSISTANT_LONELY = 'assistant-lonely';

const NOW_MS = Date.parse('2026-05-01T12:00:00.000Z');

const employeeSmsA: AIEmployeeIdentityRecord = {
  id: 'emp-sms-a',
  organizationId: ORG_A,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: ['send_sms'],
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
const employeeSmsB: AIEmployeeIdentityRecord = {
  id: 'emp-sms-b',
  organizationId: ORG_B,
  voiceProvider: 'TELNYX',
  isActive: true,
  allowedWriteTools: ['send_sms'],
};

const employees: Record<string, AIEmployeeIdentityRecord> = {
  [ASSISTANT_SMS_A]: employeeSmsA,
  [ASSISTANT_READ_A]: employeeReadA,
  [ASSISTANT_APPT_A]: employeeApptA,
  [ASSISTANT_SMS_B]: employeeSmsB,
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

const senderA: MemorySmsSender = {
  organizationId: ORG_A,
  sender: {
    phoneNumberId: 'pn-a',
    fromNumber: '+15550000001',
    messagingProfileId: 'mp-a',
    messagingProfileTelnyxId: 'telnyx-mp-a',
  },
};
const senderB: MemorySmsSender = {
  organizationId: ORG_B,
  sender: {
    phoneNumberId: 'pn-b',
    fromNumber: '+15550000002',
    messagingProfileId: 'mp-b',
    messagingProfileTelnyxId: 'telnyx-mp-b',
  },
};

function contact(overrides: Partial<MemorySmsContact> & { id: string }): MemorySmsContact {
  return {
    organizationId: overrides.organizationId ?? ORG_A,
    phone: overrides.phone ?? '+237612345678',
    optedOut: overrides.optedOut ?? false,
    ...overrides,
  };
}

const seedContacts: MemorySmsContact[] = [
  contact({ id: 'contact-a', phone: '+237612345678' }),
  contact({ id: 'contact-optout', phone: '+237699999999', optedOut: true }),
  contact({ id: 'contact-nophone', phone: 'not-a-phone' }),
  contact({ id: 'contact-b', organizationId: ORG_B, phone: '+237600000000' }),
];

const seedSenders: MemorySmsSender[] = [
  { organizationId: ORG_A, sender: { phoneNumberId: 'pn-a', fromNumber: '+15550000001', messagingProfileId: 'mp-a', messagingProfileTelnyxId: 'telnyx-mp-a' } },
  { organizationId: ORG_B, sender: { phoneNumberId: 'pn-b', fromNumber: '+15550000002', messagingProfileId: 'mp-b', messagingProfileTelnyxId: 'telnyx-mp-b' } },
];

let reqSeq = 0;
function makeDeps(
  writer: ReturnType<typeof createMemorySmsWriter>['writer'],
  sender: ReturnType<typeof createMemorySmsSender>['sender'],
  overrides: Partial<AIToolDeps> = {}
): AIToolDeps {
  return {
    db: fakeDb,
    rateLimiter: createAIToolRateLimiter(),
    replayStore: createInMemoryReplayStore(() => NOW_MS),
    events: createMemoryEventSink(),
    now: () => NOW_MS,
    generateRequestId: () => `req-${++reqSeq}`,
    sms: writer,
    smsSender: sender,
    ...overrides,
  };
}

type Data = Record<string, unknown>;

async function run(
  assistantId: string,
  args: Record<string, unknown>,
  writer: ReturnType<typeof createMemorySmsWriter>['writer'],
  sender: ReturnType<typeof createMemorySmsSender>['sender'],
  overrides: Partial<AIToolDeps> = {},
  extra: { toolCallRequestId?: string } = {}
): Promise<AIToolExecutionResult> {
  return executeAIToolCall(
    {
      assistantId,
      toolName: 'send_sms',
      rawArguments: args,
      toolCallRequestId: extra.toolCallRequestId ?? null,
    },
    makeDeps(writer, sender, overrides)
  );
}

function fresh() {
  const w = createMemorySmsWriter({ contacts: seedContacts, senders: seedSenders });
  const s = createMemorySmsSender();
  return { w, s };
}

async function main() {
  // ── A. Registre & autorisation explicite ──────────────────────────────────
  {
    const def = getAIToolDefinition('send_sms');
    check('A1 send_sms enregistré', def !== undefined);
    check('A2 riskLevel WRITE', def?.riskLevel === 'WRITE');
    check(
      'A3 permission messages:write',
      def?.requiredPermissions.length === 1 &&
        def.requiredPermissions[0] === 'messages:write'
    );
    check(
      'A4 SMS_WRITE_TOOLS = send_sms',
      SMS_WRITE_TOOLS.length === 1 && SMS_WRITE_TOOLS[0] === 'send_sms'
    );
    check(
      'A5 présent dans le registre global',
      listRegisteredToolNames().includes('send_sms')
    );
    check(
      'A6 retiré des outils futurs',
      !FUTURE_AI_TOOLS.some((t) => t.name === 'send_sms')
    );

    const readPerms = grantedPermissionsFor(employeeReadA);
    check('A7 read-only sans messages:write', !readPerms.includes('messages:write'));
    check(
      'A8 aucun outil SMS pour read-only',
      !buildToolDefinitionsForPermissions(readPerms).some((d) => d.name === 'send_sms')
    );
    const apptPerms = grantedPermissionsFor(employeeApptA);
    check(
      'A9 grant appointment ≠ messages:write',
      !apptPerms.includes('messages:write')
    );
    const smsPerms = grantedPermissionsFor(employeeSmsA);
    check('A10 grant sms → messages:write', smsPerms.includes('messages:write'));
  }

  // ── B. Validation stricte ─────────────────────────────────────────────────
  {
    const cases: Array<[string, Record<string, unknown>, string]> = [
      ['B1 body absent', { to: '+237611111111' }, 'INVALID_ARGUMENTS'],
      ['B2 body vide', { to: '+237611111111', body: '   ' }, 'INVALID_ARGUMENTS'],
      [
        'B3 body trop long',
        { to: '+237611111111', body: 'x'.repeat(1601) },
        'INVALID_ARGUMENTS',
      ],
      ['B4 aucun destinataire', { body: 'Hello' }, 'INVALID_ARGUMENTS'],
      ['B5 organizationId interdit', { body: 'Hi', organizationId: ORG_B }, 'INVALID_ARGUMENTS'],
      ['B6 from interdit', { body: 'Hi', from: '+15550000009' }, 'INVALID_ARGUMENTS'],
    ];
    for (const [name, args, code] of cases) {
      const { w, s } = fresh();
      const r = await run(ASSISTANT_SMS_A, args, w.writer, s.sender);
      check(`${name} → ${code}`, r.ok === false && r.error.code === code);
      check(`${name} : aucun envoi`, s.calls.length === 0);
    }

    const { w, s } = fresh();
    const invalidTo = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', to: 'abc' },
      w.writer,
      s.sender
    );
    check(
      'B7 destinataire invalide → INVALID_DESTINATION',
      invalidTo.ok === false && invalidTo.error.code === 'INVALID_DESTINATION'
    );
    check('B8 destinataire invalide : aucun envoi', s.calls.length === 0);
  }

  // ── C. Résolution destinataire (tenant-scopée + opt-out) ──────────────────
  {
    const { w, s } = fresh();
    const foreign = await run(
      ASSISTANT_SMS_A,
      { body: 'Hi', contact_id: 'contact-b' },
      w.writer,
      s.sender
    );
    check(
      'C1 contact autre tenant → RECIPIENT_NOT_FOUND',
      foreign.ok === false && foreign.error.code === 'RECIPIENT_NOT_FOUND'
    );
    check('C2 aucun envoi', s.calls.length === 0);

    const { w: w2, s: s2 } = fresh();
    const noPhone = await run(
      ASSISTANT_SMS_A,
      { body: 'Hi', contact_id: 'contact-nophone' },
      w2.writer,
      s2.sender
    );
    check(
      'C3 contact sans numéro → RECIPIENT_HAS_NO_PHONE',
      noPhone.ok === false && noPhone.error.code === 'RECIPIENT_HAS_NO_PHONE'
    );
    check('C4 aucun envoi', s2.calls.length === 0);

    const { w: w3, s: s3 } = fresh();
    const optOut = await run(
      ASSISTANT_SMS_A,
      { body: 'Hi', contact_id: 'contact-optout' },
      w3.writer,
      s3.sender
    );
    check(
      'C5 contact opt-out → RECIPIENT_OPTED_OUT',
      optOut.ok === false && optOut.error.code === 'RECIPIENT_OPTED_OUT'
    );
    check('C6 opt-out bloqué AVANT tout envoi', s3.calls.length === 0);
    check('C7 opt-out : aucun débit', w3.state.reservations.size === 0);

    const { w: w4, s: s4 } = fresh();
    const toKnown = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', to: '+237612345678' },
      w4.writer,
      s4.sender
    );
    check('C8 envoi vers contact via numéro', toKnown.ok === true);
    check(
      'C9 contact rattaché',
      w4.state.persisted[0]?.contactId === 'contact-a'
    );

    const { w: w5, s: s5 } = fresh();
    const toUnknown = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', to: '+237650000000' },
      w5.writer,
      s5.sender
    );
    check('C10 envoi vers numéro non enregistré', toUnknown.ok === true);
    check('C11 sans contact rattaché', w5.state.persisted[0]?.contactId === null);
  }

  // ── D. Expéditeur choisi côté serveur / indisponible ──────────────────────
  {
    const { w, s } = fresh();
    const r = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w.writer,
      s.sender
    );
    check('D1 expéditeur = numéro serveur', r.ok === true && s.calls[0]?.from === '+15550000001');
    check(
      'D2 profil de messagerie serveur transmis',
      s.calls[0]?.messagingProfileTelnyxId === 'telnyx-mp-a'
    );
    check('D3 aucun média (SMS pur)', (s.calls[0]?.mediaUrls ?? ['x']).length === 0);

    const lonely = createMemorySmsWriter({ contacts: seedContacts });
    const sender = createMemorySmsSender();
    const noSender = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      lonely.writer,
      sender.sender
    );
    check(
      'D4 tenant sans expéditeur → SMS_SENDER_UNAVAILABLE',
      noSender.ok === false && noSender.error.code === 'SMS_SENDER_UNAVAILABLE'
    );
    check('D5 aucun envoi', sender.calls.length === 0);
  }

  // ── E. Chemin nominal + persistance ───────────────────────────────────────
  {
    const { w, s } = fresh();
    const r = await run(
      ASSISTANT_SMS_A,
      { body: 'Bonjour, confirmation.', contact_id: 'contact-a' },
      w.writer,
      s.sender
    );
    check('E1 succès', r.ok === true);
    const data = r.ok ? (r.data as Data) : {};
    check('E2 ok + non dédupliqué', data.ok === true && data.deduplicated === false);
    const message = data.message as Data | null;
    check(
      'E3 DTO message { id, to, status }',
      message !== null &&
        typeof message.id === 'string' &&
        message.to === '+237612345678' &&
        message.status === 'QUEUED'
    );
    check(
      'E4 DTO sans champs sensibles',
      message !== null &&
        Object.keys(message).sort().join(',') === 'id,status,to'
    );
    check('E5 un seul envoi fournisseur', s.calls.length === 1);
    check('E6 réservation confirmée', w.state.confirmed.length === 1);
    check('E7 aucune annulation', w.state.refunds.length === 0);
    check('E8 persistance unique', w.state.messages.length === 1);
    check(
      'E9 body conservé tel quel',
      w.state.persisted[0]?.body === 'Bonjour, confirmation.'
    );
    check(
      'E10 telnyxMessageId persisté',
      w.state.persisted[0]?.telnyxMessageId === 'provider-msg-1'
    );
  }

  // ── F. Idempotence anti-double-envoi (même request_id) ────────────────────
  {
    const { w, s } = fresh();
    const first = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w.writer,
      s.sender,
      {},
      { toolCallRequestId: 'call-1' }
    );
    const second = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w.writer,
      s.sender,
      {},
      { toolCallRequestId: 'call-1' }
    );
    check('F1 premier envoi OK', first.ok === true);
    check(
      'F2 rejeu → dédupliqué',
      second.ok === true && (second.data as Data).deduplicated === true
    );
    check('F3 fournisseur appelé UNE fois', s.calls.length === 1);
    check('F4 un seul débit', w.state.confirmed.length === 1);
    check('F5 une seule ligne persistée', w.state.messages.length === 1);

    const third = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w.writer,
      s.sender,
      {},
      { toolCallRequestId: 'call-2' }
    );
    check('F6 request_id différent → nouvel envoi', third.ok === true && s.calls.length === 2);
  }

  // ── G. Pannes de facturation (aucun envoi) ────────────────────────────────
  {
    const { w, s } = fresh();
    w.failNextCharge('INSUFFICIENT_FUNDS');
    const r = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w.writer,
      s.sender,
      {},
      { toolCallRequestId: 'charge-1' }
    );
    check(
      'G1 solde insuffisant → TEMPORARILY_UNAVAILABLE',
      r.ok === false && r.error.code === 'TEMPORARILY_UNAVAILABLE'
    );
    check('G2 aucun envoi', s.calls.length === 0);
    check('G3 claim libéré (rejeu autorisé)', !w.state.claims.has(`${ORG_A}:sms:send:invalide`) && w.state.claims.size === 0);

    const retry = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w.writer,
      s.sender,
      {},
      { toolCallRequestId: 'charge-1' }
    );
    check('G4 rejeu après échec de débit → envoi', retry.ok === true && s.calls.length === 1);

    const { w: w2, s: s2 } = fresh();
    w2.failNextCharge('UNAVAILABLE');
    const r2 = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w2.writer,
      s2.sender
    );
    check(
      'G5 facturation indisponible → TEMPORARILY_UNAVAILABLE',
      r2.ok === false && r2.error.code === 'TEMPORARILY_UNAVAILABLE'
    );
    check('G6 aucun envoi', s2.calls.length === 0);
  }

  // ── H. Pannes fournisseur : certaine (4xx) vs ambiguë (timeout) ────────────
  {
    const { w, s } = fresh();
    s.failNext('DEFINITIVE', 1, 422);
    const r1 = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w.writer,
      s.sender,
      {},
      { toolCallRequestId: 'fail-1' }
    );
    check(
      'H1 refus certain → SMS_SEND_FAILED',
      r1.ok === false && r1.error.code === 'SMS_SEND_FAILED'
    );
    check('H2 débit remboursé', w.state.refunds.length === 1);
    check('H3 claim libéré', w.state.claims.size === 0);
    const retry = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w.writer,
      s.sender,
      {},
      { toolCallRequestId: 'fail-1' }
    );
    check('H4 rejeu autorisé après remboursement', retry.ok === true && s.calls.length === 2);

    const { w: w2, s: s2 } = fresh();
    s2.failNext('AMBIGUOUS');
    const a1 = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w2.writer,
      s2.sender,
      {},
      { toolCallRequestId: 'amb-1' }
    );
    check(
      'H5 timeout/5xx → TEMPORARILY_UNAVAILABLE',
      a1.ok === false && a1.error.code === 'TEMPORARILY_UNAVAILABLE'
    );
    check('H6 aucun remboursement', w2.state.refunds.length === 0);
    check('H7 claim CONSERVÉ', w2.state.claims.size === 1);
    const a2 = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w2.writer,
      s2.sender,
      {},
      { toolCallRequestId: 'amb-1' }
    );
    check(
      'H7b rejeu ambigu → dédupliqué (pas de double envoi)',
      a1.ok === false && a2.ok === true && (a2.data as Data).deduplicated === true
    );
    check('H7c fournisseur appelé UNE fois', s2.calls.length === 1);
  }

  // ── I. Assistant non autorisé / cross-tenant ──────────────────────────────
  {
    const { w, s } = fresh();
    const denied = await run(
      ASSISTANT_READ_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w.writer,
      s.sender
    );
    check('I1 read-only → NOT_ALLOWED', denied.ok === false && denied.error.code === 'NOT_ALLOWED');
    check('I2 aucun envoi', s.calls.length === 0);

    const { w: w2, s: s2 } = fresh();
    const appt = await run(
      ASSISTANT_APPT_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w2.writer,
      s2.sender
    );
    check('I3 grant appointment → NOT_ALLOWED', appt.ok === false && appt.error.code === 'NOT_ALLOWED');

    const { w: w3, s: s3 } = fresh();
    const cross = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-b' },
      w3.writer,
      s3.sender
    );
    check('I4 isolation tenant cross-org → RECIPIENT_NOT_FOUND', cross.ok === false && cross.error.code === 'RECIPIENT_NOT_FOUND');
  }

  // ── I bis. Fail-closed : ports absents ────────────────────────────────────
  {
    const { w, s } = fresh();
    const noSenderPort = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w.writer,
      s.sender,
      { smsSender: undefined }
    );
    check(
      'I5 sans port fournisseur → TEMPORARILY_UNAVAILABLE',
      noSenderPort.ok === false && noSenderPort.error.code === 'TEMPORARILY_UNAVAILABLE'
    );
    check('I6 aucune ligne persistée', w.state.messages.length === 0);
    check('I7 aucun envoi', s.calls.length === 0);

    const { w: w2, s: s2 } = fresh();
    const noWriter = await run(
      ASSISTANT_SMS_A,
      { body: 'Hello', contact_id: 'contact-a' },
      w2.writer,
      s2.sender,
      { sms: undefined }
    );
    check(
      'I8 sans port d’écriture → TEMPORARILY_UNAVAILABLE',
      noWriter.ok === false && noWriter.error.code === 'TEMPORARILY_UNAVAILABLE'
    );
    check('I9 aucun envoi', s2.calls.length === 0);
  }

  // ── J. Rate limiting d'écriture dédié ─────────────────────────────────────
  {
    const { w, s } = fresh();
    const writeRateLimiter = createAIToolRateLimiter({
      assistant: { max: 1, windowMs: 60_000 },
      now: () => NOW_MS,
    });
    const first = await run(
      ASSISTANT_SMS_A,
      { body: 'One', contact_id: 'contact-a' },
      w.writer,
      s.sender,
      { writeRateLimiter },
      { toolCallRequestId: 'rl-1' }
    );
    const second = await run(
      ASSISTANT_SMS_A,
      { body: 'Two', contact_id: 'contact-a' },
      w.writer,
      s.sender,
      { writeRateLimiter },
      { toolCallRequestId: 'rl-2' }
    );
    check('J1 premier envoi autorisé', first.ok === true);
    check(
      'J2 second → TEMPORARILY_UNAVAILABLE (rate limit)',
      second.ok === false && second.error.code === 'TEMPORARILY_UNAVAILABLE'
    );
    check('J3 un seul envoi fournisseur', s.calls.length === 1);
  }

  // ── K. Observabilité sans PII ─────────────────────────────────────────────
  {
    const { w, s } = fresh();
    const sink: AIToolMemoryEventSink = createMemoryEventSink();
    await run(
      ASSISTANT_SMS_A,
      { body: 'Contenu ultra secret', contact_id: 'contact-a' },
      w.writer,
      s.sender,
      { events: sink },
      { toolCallRequestId: 'obs-1' }
    );
    const names = sink.events.map((e) => e.name);
    check(
      'K1 séquence requested/authorized/started/accepted',
      names.includes('AI_SMS_SEND_REQUESTED') &&
        names.includes('AI_SMS_SEND_AUTHORIZED') &&
        names.includes('AI_SMS_SEND_STARTED') &&
        names.includes('AI_SMS_SEND_ACCEPTED')
    );
    const serialized = JSON.stringify(sink.events);
    check(
      'K2 aucun body/numéro dans les événements',
      !serialized.includes('Contenu ultra secret') &&
        !serialized.includes('+237612345678')
    );

    const { w: w2, s: s2 } = fresh();
    const sink2 = createMemoryEventSink();
    await run(
      ASSISTANT_SMS_A,
      { body: 'Hi', contact_id: 'contact-optout' },
      w2.writer,
      s2.sender,
      { events: sink2 }
    );
    check(
      'K3 opt-out émet AI_SMS_SEND_BLOCKED_OPT_OUT',
      sink2.events.some((e) => e.name === 'AI_SMS_SEND_BLOCKED_OPT_OUT')
    );
  }

  // ── L. Webhook : mapping HTTP ─────────────────────────────────────────────
  {
    const makeWebhookDeps = (
      writer: ReturnType<typeof createMemorySmsWriter>['writer'],
      sender: ReturnType<typeof createMemorySmsSender>['sender']
    ) => ({
      verifySignature: () => ({ ok: true as const, timestamp: String(NOW_MS / 1000) }),
      publicKeyProvider: async () => 'irrelevant',
      claim: createInMemoryTelnyxAIToolReplayClaimer().claim,
      executeTool: async (input: import('../lib/ai-tools/execute').ExecuteAIToolCallInput) =>
        executeAIToolCall(input, makeDeps(writer, sender)),
      events: createMemoryEventSink(),
      now: () => NOW_MS,
      generateRequestId: () => `wh-${++reqSeq}`,
    });

    const ok = fresh();
    const allowed = await handleTelnyxAIToolWebhook(
      {
        rawBody: JSON.stringify({
          assistant_id: ASSISTANT_SMS_A,
          tool: 'send_sms',
          request_id: 'wh-ok',
          arguments: { body: 'Hi', contact_id: 'contact-a' },
        }),
        headers: {},
      },
      makeWebhookDeps(ok.w.writer, ok.s.sender)
    );
    check('L1 envoi autorisé → 200', allowed.httpStatus === 200 && allowed.body.ok === true);

    const deniedRes = fresh();
    const denied = await handleTelnyxAIToolWebhook(
      {
        rawBody: JSON.stringify({
          assistant_id: ASSISTANT_READ_A,
          tool: 'send_sms',
          arguments: { body: 'Hi', contact_id: 'contact-a' },
        }),
        headers: {},
      },
      makeWebhookDeps(deniedRes.w.writer, deniedRes.s.sender)
    );
    check('L2 sans grant → 403', allowed.httpStatus === 200 && denied.httpStatus === 403);

    const opt = fresh();
    const optOut = await handleTelnyxAIToolWebhook(
      {
        rawBody: JSON.stringify({
          assistant_id: ASSISTANT_SMS_A,
          tool: 'send_sms',
          arguments: { body: 'Hi', contact_id: 'contact-optout' },
        }),
        headers: {},
      },
      makeWebhookDeps(opt.w.writer, opt.s.sender)
    );
    check('L3 opt-out → 403', optOut.httpStatus === 403);

    const missing = fresh();
    const notFound = await handleTelnyxAIToolWebhook(
      {
        rawBody: JSON.stringify({
          assistant_id: ASSISTANT_SMS_A,
          tool: 'send_sms',
          arguments: { body: 'Hi', contact_id: 'contact-b' },
        }),
        headers: {},
      },
      makeWebhookDeps(missing.w.writer, missing.s.sender)
    );
    check('L4 destinataire introuvable → 404', notFound.httpStatus === 404);
    check('L4b aucun envoi', missing.s.calls.length === 0);

    const badTo = fresh();
    const invalid = await handleTelnyxAIToolWebhook(
      {
        rawBody: JSON.stringify({
          assistant_id: ASSISTANT_SMS_A,
          tool: 'send_sms',
          arguments: { body: 'Hi', to: 'abc' },
        }),
        headers: {},
      },
      makeWebhookDeps(badTo.w.writer, badTo.s.sender)
    );
    check('L5 destinataire invalide → 400', invalid.httpStatus === 400);
  }

  console.log('');
  console.log(
    failures === 0
      ? 'AI SEND SMS : COUVERTURE COMPLÈTE'
      : `AI SEND SMS : ${failures} ÉCHEC(S)`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
