/**
 * Ports SMS EN MÉMOIRE pour les tests (aucune base, AUCUN réseau).
 *
 * Ils imitent la sémantique réellement utilisée en production :
 *   - le claim d'idempotence durable (table `WebhookEvent`) : une seconde
 *     revendication de la MÊME clé retombe en `DUPLICATE` ;
 *   - la résolution tenant-scopée du contact et de l'expéditeur ;
 *   - la facturation réservée/confirmée/remboursée (jamais un vrai débit ici) ;
 *   - la persistance idempotente par `telnyxMessageId`.
 * Le faux fournisseur permet d'injecter des refus certains (4xx) ou ambigus
 * (timeout/5xx) sans jamais contacter Telnyx.
 */

import { canonicalizePhoneNumber } from '../../lib/phone-number';
import {
  SmsChargeError,
  SmsProviderError,
  type PersistOutboundSmsInput,
  type ReservedSmsCharge,
  type SmsClaimOutcome,
  type SmsMessageRecord,
  type SmsRecipientRecord,
  type SmsSenderPort,
  type SmsSenderRecord,
  type SmsProviderSendInput,
  type SmsWriter,
} from '../../lib/ai-tools/sms';

export interface MemorySmsContact {
  id: string;
  organizationId: string;
  phone: string;
  optedOut: boolean;
}

export interface MemorySmsSender {
  organizationId: string;
  sender: SmsSenderRecord;
}

export interface MemorySmsSeed {
  contacts?: MemorySmsContact[];
  senders?: MemorySmsSender[];
}

export interface MemorySmsWriterState {
  claims: Set<string>;
  reservations: Map<string, ReservedSmsCharge>;
  confirmed: { reference: string; telnyxMessageId: string }[];
  refunds: { reference: string; reason: string }[];
  persisted: PersistOutboundSmsInput[];
  messages: SmsMessageRecord[];
}

export interface MemorySmsWriterHandle {
  writer: SmsWriter;
  state: MemorySmsWriterState;
  /** Fait échouer la prochaine réservation de débit avec le motif donné. */
  failNextCharge(kind: 'INSUFFICIENT_FUNDS' | 'UNAVAILABLE'): void;
}

export function createMemorySmsWriter(
  seed: MemorySmsSeed = {}
): MemorySmsWriterHandle {
  const contacts = new Map<string, MemorySmsContact>();
  (seed.contacts ?? []).forEach((contact) => contacts.set(contact.id, contact));
  const senders = [...(seed.senders ?? [])];

  const state: MemorySmsWriterState = {
    claims: new Set<string>(),
    reservations: new Map<string, ReservedSmsCharge>(),
    confirmed: [],
    refunds: [],
    persisted: [],
    messages: [],
  };

  let pendingCharge: 'INSUFFICIENT_FUNDS' | 'UNAVAILABLE' | null = null;
  let idSeq = 0;

  const writer: SmsWriter = {
    async resolveSender(organizationId: string): Promise<SmsSenderRecord | null> {
      return senders.find((entry) => entry.organizationId === organizationId)?.sender ?? null;
    },

    async resolveRecipientByContact(
      organizationId: string,
      contactId: string
    ): Promise<SmsRecipientRecord | null> {
      const contact = contacts.get(contactId);
      if (!contact || contact.organizationId !== organizationId) return null;
      return {
        contactId: contact.id,
        phone: canonicalizePhoneNumber(contact.phone) ?? '',
        optedOut: contact.optedOut,
      };
    },

    async resolveRecipientByPhone(
      organizationId: string,
      phone: string
    ): Promise<SmsRecipientRecord> {
      for (const contact of contacts.values()) {
        if (
          contact.organizationId === organizationId &&
          canonicalizePhoneNumber(contact.phone) === phone
        ) {
          return { contactId: contact.id, phone, optedOut: contact.optedOut };
        }
      }
      return { contactId: null, phone, optedOut: false };
    },

    async claimSend(
      organizationId: string,
      idempotencyKey: string
    ): Promise<SmsClaimOutcome> {
      const scoped = `${organizationId}:${idempotencyKey}`;
      if (state.claims.has(scoped)) return 'DUPLICATE';
      state.claims.add(scoped);
      return 'NEW';
    },

    async releaseClaim(
      organizationId: string,
      idempotencyKey: string
    ): Promise<void> {
      state.claims.delete(`${organizationId}:${idempotencyKey}`);
    },

    async reserveCharge(
      organizationId: string,
      reservationId: string
    ): Promise<ReservedSmsCharge> {
      void organizationId;
      if (pendingCharge) {
        const kind = pendingCharge;
        pendingCharge = null;
        throw new SmsChargeError(kind);
      }
      const reservation: ReservedSmsCharge = {
        amount: 0.05,
        reference: `sms:${reservationId}`,
      };
      state.reservations.set(reservation.reference, reservation);
      return reservation;
    },

    async confirmCharge(reference: string, telnyxMessageId: string): Promise<void> {
      state.confirmed.push({ reference, telnyxMessageId });
    },

    async refundCharge(
      _organizationId: string,
      reference: string,
      reason: string
    ): Promise<void> {
      state.refunds.push({ reference, reason });
    },

    async persistOutboundMessage(
      input: PersistOutboundSmsInput
    ): Promise<SmsMessageRecord> {
      state.persisted.push(input);
      const record: SmsMessageRecord = {
        id: `sms-${++idSeq}`,
        telnyxMessageId: input.telnyxMessageId,
        organizationId: input.organizationId,
        fromNumber: input.fromNumber,
        toNumber: input.toNumber,
        status: 'QUEUED',
        type: input.type,
        contactId: input.contactId,
      };
      state.messages.push(record);
      return record;
    },
  };

  return {
    writer,
    state,
    failNextCharge(kind) {
      pendingCharge = kind;
    },
  };
}

export interface MemorySmsSenderHandle {
  sender: SmsSenderPort;
  calls: SmsProviderSendInput[];
  /** Fait échouer les `count` prochains envois (défaut 1) du `kind` donné. */
  failNext(kind: 'DEFINITIVE' | 'AMBIGUOUS', count?: number, status?: number): void;
  /** Fait « perdre » les `count` prochains identifiants fournisseur (timeout). */
  dropNextIds(count?: number): void;
}

export function createMemorySmsSender(): MemorySmsSenderHandle {
  const calls: SmsProviderSendInput[] = [];
  let pendingFail: { kind: 'DEFINITIVE' | 'AMBIGUOUS'; remaining: number; status?: number } | null =
    null;
  let dropIds = 0;
  let idSeq = 0;

  return {
    calls,
    failNext(kind, count = 1, status) {
      pendingFail = { kind, remaining: count, status };
    },
    dropNextIds(count = 1) {
      dropIds = count;
    },
    sender: {
      async send(input: SmsProviderSendInput) {
        calls.push(input);
        if (pendingFail && pendingFail.remaining > 0) {
          pendingFail.remaining--;
          throw new SmsProviderError(pendingFail.kind, pendingFail.status);
        }
        if (dropIds > 0) {
          dropIds--;
          throw new SmsProviderError('AMBIGUOUS');
        }
        return {
          providerMessageId: `provider-msg-${++idSeq}`,
          type: 'SMS',
        };
      },
    },
  };
}
