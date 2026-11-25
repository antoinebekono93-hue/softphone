import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  createAppointmentInTransaction,
  executeAppointmentCreate,
  type AppointmentTransaction,
  type RetryPolicy,
} from '@/lib/ai-tools/appointments';
import type {
  AppointmentWriter,
  CreateAppointmentOutcome,
} from '@/lib/ai-tools/appointments';

/**
 * Implémentation Prisma du port d'écriture des rendez-vous. Volontairement HORS
 * de `lib/ai-tools` : ce répertoire doit rester sans écriture Prisma (test
 * statique J1). Toutes les requêtes sont scopées par `organizationId`.
 *
 * Anti-double-réservation : la recherche de chevauchement et l'INSERT sont
 * exécutés dans une MÊME transaction `Serializable`. PostgreSQL (SSI) annule
 * alors l'une des transactions concurrentes dont les intervalles se
 * chevauchent ; Prisma expose cet échec comme `P2034`, réessayé de façon bornée.
 */

const CANCELLED_STATUSES = ['CANCELLED', 'CANCELED'];

const MAX_TRANSACTION_ATTEMPTS = 4;
const BASE_BACKOFF_MS = 20;

export const appointmentSelect = {
  id: true,
  organizationId: true,
  aiEmployeeId: true,
  contactId: true,
  customerName: true,
  reason: true,
  startsAt: true,
  endsAt: true,
  timezone: true,
  status: true,
} as const;

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/**
 * `P2034` couvre SQLSTATE 40001 (serialization_failure, SSI) et 40P01
 * (deadlock_detected). Seul ce cas est réessayable.
 */
function isSerializationFailure(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}

const retryPolicy: RetryPolicy = {
  maxAttempts: MAX_TRANSACTION_ATTEMPTS,
  backoffMs: (attempt) =>
    BASE_BACKOFF_MS * 2 ** (attempt - 1) +
    Math.floor(Math.random() * BASE_BACKOFF_MS),
  sleep: (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  isRetryable: isSerializationFailure,
};

function toTransactionClient(tx: Prisma.TransactionClient): AppointmentTransaction {
  return {
    async findExistingByIdempotencyKey(idempotencyKey) {
      return tx.appointment.findUnique({
        where: { idempotencyKey },
        select: appointmentSelect,
      });
    },

    async findOverlapping(query) {
      return tx.appointment.findMany({
        where: {
          organizationId: query.organizationId,
          aiEmployeeId: query.aiEmployeeId,
          status: { notIn: CANCELLED_STATUSES },
          startsAt: { lt: query.endsAt },
          endsAt: { gt: query.startsAt },
        },
        select: appointmentSelect,
        take: 1,
        orderBy: { startsAt: 'asc' },
      });
    },

    async insert(input) {
      return tx.appointment.create({
        data: {
          organizationId: input.organizationId,
          aiEmployeeId: input.aiEmployeeId,
          contactId: input.contactId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          reason: input.reason,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          timezone: input.timezone,
          status: input.status,
          idempotencyKey: input.idempotencyKey,
          sourceRequestId: input.sourceRequestId,
          createdByTool: 'create_appointment',
        },
        select: appointmentSelect,
      });
    },
  };
}

export const prismaAppointmentWriter: AppointmentWriter = {
  async getOrganizationTimezone(organizationId: string): Promise<string | null> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { timezone: true },
    });
    return organization?.timezone ?? null;
  },

  async getBusinessHours({ organizationId, aiEmployeeId }) {
    // Lecture scopée par organisation (isolation §13) : uniquement les lignes
    // `enabled`, pour cet employé OU pour le défaut d'organisation. La
    // hiérarchie employé→organisation est appliquée par la logique pure.
    // NB : le client Prisma doit être régénéré après l'ajout du modèle
    // BusinessHour (`prisma generate`) ; en attendant, la valeur est castée.
    interface BusinessHourRow {
      aiEmployeeId: string | null;
      dayOfWeek: number;
      opensAt: string;
      closesAt: string;
    }
    const rows = (await prisma.businessHour.findMany({
      where: {
        organizationId,
        enabled: true,
        OR: [{ aiEmployeeId }, { aiEmployeeId: null }],
      },
      select: {
        aiEmployeeId: true,
        dayOfWeek: true,
        opensAt: true,
        closesAt: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { opensAt: 'asc' }],
    })) as BusinessHourRow[];

    const toWindow = (row: BusinessHourRow) => ({
      dayOfWeek: row.dayOfWeek,
      opensAt: row.opensAt,
      closesAt: row.closesAt,
    });

    return {
      employee: rows
        .filter((row) => row.aiEmployeeId === aiEmployeeId)
        .map(toWindow),
      organization: rows
        .filter((row) => row.aiEmployeeId === null)
        .map(toWindow),
    };
  },

  async createAppointment(input): Promise<CreateAppointmentOutcome> {
    return executeAppointmentCreate(input, {
      runTransaction: () =>
        prisma.$transaction(
          (tx) => createAppointmentInTransaction(toTransactionClient(tx), input),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        ),
      findByIdempotencyKey: (idempotencyKey) =>
        prisma.appointment.findUnique({
          where: { idempotencyKey },
          select: appointmentSelect,
        }),
      isUniqueViolation,
      policy: retryPolicy,
    });
  },
};
