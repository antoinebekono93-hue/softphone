import { createHash } from 'node:crypto';

/**
 * Port d'écriture des rendez-vous. Ce module ne contient AUCUN accès base :
 * l'implémentation Prisma vit hors de `lib/ai-tools` (voir
 * `lib/appointment-writer-prisma.ts`) afin que `lib/ai-tools` reste purement
 * sans écriture Prisma. Les handlers dépendent de cette interface et les tests
 * injectent un writer en mémoire.
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
  | { status: 'DUPLICATE'; appointment: AppointmentRecord };

export interface OverlapQuery {
  organizationId: string;
  aiEmployeeId: string;
  startsAt: Date;
  endsAt: Date;
}

export interface AppointmentWriter {
  /** IANA timezone of the organization, or null when unset. */
  getOrganizationTimezone(organizationId: string): Promise<string | null>;
  /** Non-cancelled appointments overlapping the half-open interval. */
  findOverlappingAppointments(
    query: OverlapQuery
  ): Promise<AppointmentRecord[]>;
  /**
   * Persists the appointment. Relies on the UNIQUE `idempotencyKey`: a replayed
   * call surfaces as P2002 and is returned as DUPLICATE with the existing row,
   * never a second appointment.
   */
  createAppointment(
    input: CreateAppointmentInput
  ): Promise<CreateAppointmentOutcome>;
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
