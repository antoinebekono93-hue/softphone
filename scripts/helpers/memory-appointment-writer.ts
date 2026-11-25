/**
 * Writer d'appointments EN MÉMOIRE pour les tests (aucune base requise).
 *
 * Il exécute les fonctions PURES de production `createAppointmentInTransaction`
 * et `executeAppointmentCreate` contre un moteur qui imite la sémantique d'une
 * transaction PostgreSQL SERIALIZABLE :
 *   - les lectures voient un SNAPSHOT pris au début de la transaction ;
 *   - `insert` détecte les conflits contre l'état COMMITÉ : une violation
 *     d'unicité d'idempotence (P2002) ou un conflit de chevauchement (SSI)
 *     qui n'était pas visible dans le snapshot → erreur réessayable.
 * Cela reproduit fidèlement la course que le code de production doit gérer.
 */

import {
  createAppointmentInTransaction,
  executeAppointmentCreate,
  type AppointmentTransaction,
  type RetryPolicy,
} from '../../lib/ai-tools/appointments';
import type {
  AppointmentRecord,
  AppointmentWriter,
  BusinessHoursQuery,
  CreateAppointmentInput,
  OverlapQuery,
} from '../../lib/ai-tools/appointments';
import type { BusinessHoursWindowRecord } from '../../lib/ai-tools/business-hours';

const CANCELLED_STATUSES = ['CANCELLED', 'CANCELED'];

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

export interface MemoryWriterState {
  store: Map<string, AppointmentRecord>;
  createCalls: number;
  transactionCalls: number;
  insertCalls: number;
  overlapCalls: number;
  businessHoursCalls: number;
  lastInput: CreateAppointmentInput | null;
}

export interface MemoryAppointmentWriter {
  writer: AppointmentWriter;
  state: MemoryWriterState;
  /** Fait échouer les `count` prochaines transactions avec un conflit SSI. */
  failNextSerializations(count: number): void;
}

export interface MemoryBusinessHours {
  /** Fenêtres par défaut d'organisation, indexées par `organizationId`. */
  byOrganization?: Record<string, BusinessHoursWindowRecord[]>;
  /** Fenêtres spécifiques employé, indexées par `aiEmployeeId`. */
  byEmployee?: Record<string, BusinessHoursWindowRecord[]>;
}

export interface MemoryWriterOptions {
  timezones?: Record<string, string | null>;
  seed?: AppointmentRecord[];
  maxAttempts?: number;
  backoffMs?: (attempt: number) => number;
  sleep?: (ms: number) => Promise<void>;
  businessHours?: MemoryBusinessHours;
}

function overlaps(
  record: AppointmentRecord,
  organizationId: string,
  aiEmployeeId: string,
  startsAt: Date,
  endsAt: Date
): boolean {
  if (record.organizationId !== organizationId) return false;
  if (record.aiEmployeeId !== aiEmployeeId) return false;
  if (CANCELLED_STATUSES.includes(record.status)) return false;
  return (
    record.startsAt.getTime() < endsAt.getTime() &&
    record.endsAt.getTime() > startsAt.getTime()
  );
}

export function createMemoryAppointmentWriter(
  options: MemoryWriterOptions = {}
): MemoryAppointmentWriter {
  const timezones = options.timezones ?? {};
  const businessHours = options.businessHours ?? {};
  const store = new Map<string, AppointmentRecord>();
  (options.seed ?? []).forEach((record, index) => {
    store.set(`seed:${record.id}:${index}`, record);
  });

  const state: MemoryWriterState = {
    store,
    createCalls: 0,
    transactionCalls: 0,
    insertCalls: 0,
    overlapCalls: 0,
    businessHoursCalls: 0,
    lastInput: null,
  };

  let pendingFailures = 0;
  let idSeq = 0;

  const policy: RetryPolicy = {
    maxAttempts: options.maxAttempts ?? 4,
    backoffMs: options.backoffMs ?? ((attempt) => 20 * 2 ** (attempt - 1)),
    sleep: options.sleep ?? (async () => {}),
    isRetryable: (error) => error instanceof MemorySerializationConflictError,
  };

  function makeTransaction(): AppointmentTransaction {
    const snapshot = new Map(store);
    return {
      async findExistingByIdempotencyKey(idempotencyKey) {
        return snapshot.get(idempotencyKey) ?? null;
      },
      async findOverlapping(query: OverlapQuery) {
        state.overlapCalls++;
        for (const record of snapshot.values()) {
          if (
            overlaps(
              record,
              query.organizationId,
              query.aiEmployeeId,
              query.startsAt,
              query.endsAt
            )
          ) {
            return [record];
          }
        }
        return [];
      },
      async insert(insertInput: CreateAppointmentInput) {
        state.insertCalls++;
        if (store.has(insertInput.idempotencyKey)) {
          throw new MemoryUniqueViolationError();
        }
        for (const record of store.values()) {
          if (
            overlaps(
              record,
              insertInput.organizationId,
              insertInput.aiEmployeeId,
              insertInput.startsAt,
              insertInput.endsAt
            )
          ) {
            throw new MemorySerializationConflictError();
          }
        }
        const record: AppointmentRecord = {
          id: `appt-${++idSeq}`,
          organizationId: insertInput.organizationId,
          aiEmployeeId: insertInput.aiEmployeeId,
          contactId: insertInput.contactId,
          customerName: insertInput.customerName,
          reason: insertInput.reason,
          startsAt: insertInput.startsAt,
          endsAt: insertInput.endsAt,
          timezone: insertInput.timezone,
          status: insertInput.status,
        };
        store.set(insertInput.idempotencyKey, record);
        return record;
      },
    };
  }

  const writer: AppointmentWriter = {
    async getOrganizationTimezone(organizationId) {
      return timezones[organizationId] ?? null;
    },
    async getBusinessHours(query: BusinessHoursQuery) {
      state.businessHoursCalls++;
      return {
        employee: businessHours.byEmployee?.[query.aiEmployeeId] ?? [],
        organization:
          businessHours.byOrganization?.[query.organizationId] ?? [],
      };
    },
    async createAppointment(input) {
      state.createCalls++;
      state.lastInput = input;
      return executeAppointmentCreate(input, {
        runTransaction: async () => {
          state.transactionCalls++;
          if (pendingFailures > 0) {
            pendingFailures--;
            throw new MemorySerializationConflictError();
          }
          return createAppointmentInTransaction(makeTransaction(), input);
        },
        findByIdempotencyKey: async (idempotencyKey) =>
          store.get(idempotencyKey) ?? null,
        isUniqueViolation: (error) => error instanceof MemoryUniqueViolationError,
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
