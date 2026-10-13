import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  AppointmentRecord,
  AppointmentWriter,
  CreateAppointmentInput,
  CreateAppointmentOutcome,
  OverlapQuery,
} from '@/lib/ai-tools/appointments';

/**
 * Implémentation Prisma du port d'écriture des rendez-vous. Volontairement HORS
 * de `lib/ai-tools` : ce répertoire doit rester sans écriture Prisma (test
 * statique J1). Toutes les requêtes sont scopées par `organizationId`.
 */

const CANCELLED_STATUSES = ['CANCELLED', 'CANCELED'];

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

export const prismaAppointmentWriter: AppointmentWriter = {
  async getOrganizationTimezone(organizationId: string): Promise<string | null> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { timezone: true },
    });
    return organization?.timezone ?? null;
  },

  async findOverlappingAppointments(
    query: OverlapQuery
  ): Promise<AppointmentRecord[]> {
    return prisma.appointment.findMany({
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

  async createAppointment(
    input: CreateAppointmentInput
  ): Promise<CreateAppointmentOutcome> {
    try {
      const created = await prisma.appointment.create({
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
      return { status: 'CREATED', appointment: created };
    } catch (error) {
      if (isUniqueViolation(error)) {
        const existing = await prisma.appointment.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          select: appointmentSelect,
        });
        if (existing) return { status: 'DUPLICATE', appointment: existing };
      }
      throw error;
    }
  },
};
