import { createHash } from 'node:crypto';
import type { BusinessHoursWindowRecord } from './business-hours';

/**
 * Port d'écriture des rendez-vous + orchestration de concurrence (PURE).
 *
 * Ce module ne contient AUCUN accès base : l'implémentation Prisma vit hors de
 * `lib/ai-tools` (voir `lib/appointment-writer-prisma.ts`) afin que
 * `lib/ai-tools` reste purement sans écriture Prisma. Les handlers dépendent de
 * l'interface `AppointmentWriter` et les tests injectent un writer en mémoire.
 *
 * Garantie anti-double-réservation (Phase 4A.1) : la lecture de conflit et
 * l'INSERT se déroulent dans UNE MÊME transaction PostgreSQL SERIALIZABLE. Un
 * échec de sérialisation (SQLSTATE 40001 / deadlock 40P01, exposé par Prisma
 * comme `P2034`) est réessayé un nombre BORNÉ de fois ; à l'épuisement, un
 * résultat contrôlé `UNAVAILABLE` est renvoyé (jamais une erreur de base). Les
 * fonctions d'orchestration sont pures et testables sans base.
 */

export interface AppointmentRecord {
  id: string;
  organizationId: string;
  aiEmployeeId: string | null;
  contactId: string | null;
  customerName: string | null;
  reason: string | null;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  status: string;
}

export interface CreateAppointmentInput {
  organizationId: string;
  aiEmployeeId: string;
  contactId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  reason: string | null;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  status: string;
  idempotencyKey: string;
  sourceRequestId: string | null;
}

export type CreateAppointmentOutcome =
  | { status: 'CREATED'; appointment: AppointmentRecord }
  | { status: 'DUPLICATE'; appointment: AppointmentRecord }
  | { status: 'CONFLICT' }
  | { status: 'UNAVAILABLE' };

export interface OverlapQuery {
  organizationId: string;
  aiEmployeeId: string;
  startsAt: Date;
  endsAt: Date;
}

/**
 * Opérations atomiques exécutées DANS une unique transaction sérialisable.
 * Les deux lectures voient le snapshot de la transaction ; `insert` est la
 * seule écriture et peut lever une violation d'idempotence (P2002) ou un échec
 * de sérialisation, tous deux réconciliés par `executeAppointmentCreate`.
 */
export interface AppointmentTransaction {
  findExistingByIdempotencyKey(
    idempotencyKey: string
  ): Promise<AppointmentRecord | null>;
  findOverlapping(query: OverlapQuery): Promise<AppointmentRecord[]>;
  insert(input: CreateAppointmentInput): Promise<AppointmentRecord>;
}

export interface AppointmentWriter {
  /** IANA timezone of the organization, or null when unset. */
  getOrganizationTimezone(organizationId: string): Promise<string | null>;
  /**
   * Fenêtres ouvrées résolues pour un employé, scopées par organisation. La
   * couche d'accès NE filtre que les lignes `enabled` et n'applique AUCUNE
   * hiérarchie : elle renvoie les deux ensembles bruts, la priorité
   * employé→organisation étant décidée par la logique pure `resolveBusinessHours`.
   */
  getBusinessHours(query: BusinessHoursQuery): Promise<BusinessHoursSets>;
  /**
   * Persiste le rendez-vous de façon atomique et anti-concurrentielle. La
   * lecture de conflit et l'écriture sont encapsulées dans une transaction
   * sérialisable par l'implémentation. Retourne toujours un résultat contrôlé.
   */
  createAppointment(
    input: CreateAppointmentInput
  ): Promise<CreateAppointmentOutcome>;
}

export interface BusinessHoursQuery {
  organizationId: string;
  aiEmployeeId: string;
}

export interface BusinessHoursSets {
  employee: BusinessHoursWindowRecord[];
  organization: BusinessHoursWindowRecord[];
}

/** Politique de retry bornée appliquée aux échecs de sérialisation. */
export interface RetryPolicy {
  /** Nombre TOTAL de tentatives (≥ 1). */
  maxAttempts: number;
  /** Délai avant la prochaine tentative, en ms. */
  backoffMs: (attempt: number) => number;
  sleep: (ms: number) => Promise<void>;
  /** Vrai uniquement pour un échec de sérialisation/deadlock réessayable. */
  isRetryable: (error: unknown) => boolean;
}

/**
 * Décision atomique exécutée dans la transaction. Idempotence D'ABORD : un
 * rejeu du même appel (même clé) renvoie le rendez-vous existant. Puis conflit
 * de créneau (aucune écriture). Sinon insertion.
 */
export async function createAppointmentInTransaction(
  tx: AppointmentTransaction,
  input: CreateAppointmentInput
): Promise<CreateAppointmentOutcome> {
  const existing = await tx.findExistingByIdempotencyKey(input.idempotencyKey);
  if (existing) return { status: 'DUPLICATE', appointment: existing };

  const overlaps = await tx.findOverlapping({
    organizationId: input.organizationId,
    aiEmployeeId: input.aiEmployeeId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  });
  if (overlaps.length > 0) return { status: 'CONFLICT' };

  const created = await tx.insert(input);
  return { status: 'CREATED', appointment: created };
}

export interface AppointmentCreateExecutor {
  /** Exécute `createAppointmentInTransaction` dans une transaction sérialisable. */
  runTransaction: () => Promise<CreateAppointmentOutcome>;
  /** Relecture HORS transaction par clé d'idempotence (réconciliation P2002). */
  findByIdempotencyKey(
    idempotencyKey: string
  ): Promise<AppointmentRecord | null>;
  isUniqueViolation: (error: unknown) => boolean;
  policy: RetryPolicy;
}

/**
 * Exécute la création avec retry BORNÉ. Ne réessaie QUE les échecs de
 * sérialisation (`policy.isRetryable`). Un doublon d'idempotence (P2002) est
 * réconcilié en `DUPLICATE` via une relecture hors transaction. Toute autre
 * erreur remonte (mappée plus haut, jamais exposée). Épuisement des tentatives
 * ⇒ `UNAVAILABLE`, résultat contrôlé.
 */
export async function executeAppointmentCreate(
  input: CreateAppointmentInput,
  executor: AppointmentCreateExecutor
): Promise<CreateAppointmentOutcome> {
  for (let attempt = 1; attempt <= executor.policy.maxAttempts; attempt++) {
    try {
      return await executor.runTransaction();
    } catch (error) {
      if (executor.isUniqueViolation(error)) {
        const existing = await executor.findByIdempotencyKey(
          input.idempotencyKey
        );
        if (existing) return { status: 'DUPLICATE', appointment: existing };
        throw error;
      }
      if (!executor.policy.isRetryable(error)) throw error;
      if (attempt >= executor.policy.maxAttempts) return { status: 'UNAVAILABLE' };
      await executor.policy.sleep(executor.policy.backoffMs(attempt));
    }
  }
  return { status: 'UNAVAILABLE' };
}

/**
 * Clé d'idempotence persistée. Quand Telnyx fournit un `request_id` stable pour
 * l'appel d'outil, il est utilisé : un rejeu du même appel retombe sur la même
 * clé. En son absence (rejeu re-signé), on retombe sur un hash sémantique du
 * rendez-vous demandé, afin qu'un rejeu ne crée jamais de doublon.
 */
export function buildAppointmentIdempotencyKey(params: {
  organizationId: string;
  aiEmployeeId: string;
  requestId: string | null;
  startsAt: Date;
  endsAt: Date;
  contactId: string | null;
  customerName: string | null;
  customerPhone: string | null;
}): string {
  const prefix = `${params.organizationId}:create_appointment`;
  if (params.requestId) return `${prefix}:req:${params.requestId}`;
  const semantic = [
    params.organizationId,
    params.aiEmployeeId,
    params.startsAt.toISOString(),
    params.endsAt.toISOString(),
    params.contactId ?? '',
    params.customerPhone ?? '',
    (params.customerName ?? '').trim().toLowerCase(),
  ].join('|');
  return `${prefix}:sem:${createHash('sha256')
    .update(semantic, 'utf8')
    .digest('hex')}`;
}
