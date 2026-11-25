/**
 * Writer de leads EN MÉMOIRE pour les tests (aucune base requise).
 *
 * Il imite la sémantique PostgreSQL réellement utilisée en production :
 *   - la contrainte unique `(organizationId, phone)` : un INSERT concurrent
 *     échoue avec une violation de doublon (réconciliée en `DUPLICATE`) ;
 *   - la transaction SERIALIZABLE de mise à jour : un conflit écriture-écriture
 *     (version modifiée entre la lecture et l'écriture) est réessayable.
 * Les fonctions d'orchestration testées sont celles de production
 * (`executeLeadUpdate`).
 */

import {
  appendNote,
  executeLeadUpdate,
  type CreateLeadInput,
  type CreateLeadOutcome,
  type LeadIdentity,
  type LeadRecord,
  type LeadWriter,
  type RetryPolicy,
  type UpdateLeadInput,
  type UpdateLeadOutcome,
} from '../../lib/ai-tools/leads';

export class MemoryUniqueViolationError extends Error {
  constructor() {
    super('memory unique violation');
    this.name = 'MemoryUniqueViolationError';
  }
}

export class MemorySerializationConflictError extends Error {
  constructor() {
    super('memory serialization conflict');
    this.name = 'MemorySerializationConflictError';
  }
}

interface StoredLead extends LeadRecord {
  version: number;
}

export interface MemoryLeadWriterState {
  store: Map<string, StoredLead>;
  createCalls: number;
  updateCalls: number;
  transactionCalls: number;
  insertCalls: number;
  lastCreateInput: CreateLeadInput | null;
  lastUpdateInput: UpdateLeadInput | null;
}

export interface MemoryLeadWriter {
  writer: LeadWriter;
  state: MemoryLeadWriterState;
  /** Fait échouer les `count` prochaines transactions avec un conflit SSI. */
  failNextSerializations(count: number): void;
}

export interface MemoryLeadWriterOptions {
  seed?: LeadRecord[];
  maxAttempts?: number;
  backoffMs?: (attempt: number) => number;
  sleep?: (ms: number) => Promise<void>;
}

function strip(record: StoredLead): LeadRecord {
  const { version, ...rest } = record;
  void version;
  return rest;
}

export function createMemoryLeadWriter(
  options: MemoryLeadWriterOptions = {}
): MemoryLeadWriter {
  const store = new Map<string, StoredLead>();
  (options.seed ?? []).forEach((record) => {
    store.set(record.id, { ...record, version: 0 });
  });

  const state: MemoryLeadWriterState = {
    store,
    createCalls: 0,
    updateCalls: 0,
    transactionCalls: 0,
    insertCalls: 0,
    lastCreateInput: null,
    lastUpdateInput: null,
  };

  let pendingFailures = 0;
  let idSeq = 0;

  const policy: RetryPolicy = {
    maxAttempts: options.maxAttempts ?? 4,
    backoffMs: options.backoffMs ?? ((attempt) => 20 * 2 ** (attempt - 1)),
    sleep: options.sleep ?? (async () => {}),
    isRetryable: (error) => error instanceof MemorySerializationConflictError,
  };

  function findCommitted(
    organizationId: string,
    phone: string
  ): StoredLead | null {
    for (const record of store.values()) {
      if (record.organizationId === organizationId && record.phone === phone) {
        return record;
      }
    }
    return null;
  }

  const writer: LeadWriter = {
    async createLead(input: CreateLeadInput): Promise<CreateLeadOutcome> {
      state.createCalls++;
      state.lastCreateInput = input;
      // Point de cession : deux créations concurrentes atteignent l'insertion.
      await Promise.resolve();
      state.insertCalls++;
      const existing = findCommitted(input.organizationId, input.phone);
      if (existing) return { status: 'DUPLICATE', lead: strip(existing) };
      const record: StoredLead = {
        id: `lead-${++idSeq}`,
        organizationId: input.organizationId,
        name: input.name,
        company: input.company,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
        leadScore: null,
        sentiment: null,
        escalationStatus: null,
        optedOut: false,
        isVip: false,
        version: 0,
      };
      store.set(record.id, record);
      return { status: 'CREATED', lead: strip(record) };
    },

    async findContactsByPhone(
      organizationId: string,
      candidates: readonly string[]
    ): Promise<LeadIdentity[]> {
      if (candidates.length === 0) return [];
      return [...store.values()]
        .filter(
          (record) =>
            record.organizationId === organizationId &&
            candidates.includes(record.phone)
        )
        .map((record) => ({ id: record.id, phone: record.phone }));
    },

    async getLead(
      organizationId: string,
      contactId: string
    ): Promise<LeadRecord | null> {
      const record = store.get(contactId);
      if (!record || record.organizationId !== organizationId) return null;
      return strip(record);
    },

    async updateLead(input: UpdateLeadInput): Promise<UpdateLeadOutcome> {
      state.updateCalls++;
      state.lastUpdateInput = input;
      return executeLeadUpdate(input, {
        runTransaction: async () => {
          state.transactionCalls++;
          if (pendingFailures > 0) {
            pendingFailures--;
            throw new MemorySerializationConflictError();
          }
          const snapshotVersion = store.get(input.contactId)?.version;
          const record = store.get(input.contactId);
          if (!record || record.organizationId !== input.organizationId) {
            return { status: 'NOT_FOUND' };
          }
          await Promise.resolve();
          const committed = store.get(input.contactId);
          if (!committed || committed.version !== snapshotVersion) {
            throw new MemorySerializationConflictError();
          }
          const next: StoredLead = {
            ...committed,
            version: committed.version + 1,
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.company !== undefined ? { company: input.company } : {}),
            ...(input.email !== undefined ? { email: input.email } : {}),
            ...(input.notesAppend !== undefined
              ? { notes: appendNote(committed.notes, input.notesAppend) }
              : {}),
          };
          store.set(next.id, next);
          return { status: 'UPDATED', lead: strip(next) };
        },
        policy,
      });
    },
  };

  return {
    writer,
    state,
    failNextSerializations(count) {
      pendingFailures = count;
    },
  };
}
