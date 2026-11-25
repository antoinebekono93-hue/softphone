import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { appendNote, executeLeadUpdate } from '@/lib/ai-tools/leads';
import type {
  CreateLeadOutcome,
  LeadIdentity,
  LeadRecord,
  LeadWriter,
  RetryPolicy,
  UpdateLeadOutcome,
} from '@/lib/ai-tools/leads';

/**
 * Implémentation Prisma du port d'écriture des leads. Volontairement HORS de
 * `lib/ai-tools` : ce répertoire doit rester sans écriture Prisma (test
 * statique J1). Toutes les requêtes sont scopées par `organizationId`.
 *
 * Anti-doublon : l'unicité `(organizationId, phone)` est garantie par la base.
 * Une création concurrente voit une seule insertion réussir ; l'autre est
 * réconciliée en `DUPLICATE` via une relecture tenant-scopée.
 *
 * Mise à jour : la lecture puis l'écriture des notes (concaténation additive)
 * se déroulent dans UNE MÊME transaction `Serializable`, afin qu'aucune mise à
 * jour concurrente ne perde une note. Un échec de sérialisation (Prisma P2034)
 * est réessayé un nombre BORNÉ de fois.
 */

const leadSelect = {
  id: true,
  organizationId: true,
  name: true,
  company: true,
  email: true,
  phone: true,
  notes: true,
  leadScore: true,
  sentiment: true,
  escalationStatus: true,
  optedOut: true,
  isVip: true,
} as const;

const MAX_TRANSACTION_ATTEMPTS = 4;
const BASE_BACKOFF_MS = 20;

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  );
}

/** `P2034` = serialization failure (40001) ou deadlock (40P01) : réessayable. */
function isSerializationFailure(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034'
  );
}

const updateRetryPolicy: RetryPolicy = {
  maxAttempts: MAX_TRANSACTION_ATTEMPTS,
  backoffMs: (attempt) =>
    BASE_BACKOFF_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * BASE_BACKOFF_MS),
  sleep: (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  isRetryable: isSerializationFailure,
};

export const prismaLeadWriter: LeadWriter = {
  async createLead(input): Promise<CreateLeadOutcome> {
    try {
      const lead = await prisma.contact.create({
        data: {
          organizationId: input.organizationId,
          name: input.name,
          company: input.company,
          email: input.email,
          phone: input.phone,
          notes: input.notes,
        },
        select: leadSelect,
      });
      return { status: 'CREATED', lead };
    } catch (error) {
      if (isUniqueViolation(error)) {
        const existing = await prisma.contact.findFirst({
          where: { organizationId: input.organizationId, phone: input.phone },
          select: leadSelect,
        });
        if (existing) return { status: 'DUPLICATE', lead: existing };
      }
      return { status: 'UNAVAILABLE' };
    }
  },

  async findContactsByPhone(
    organizationId: string,
    candidates: readonly string[]
  ): Promise<LeadIdentity[]> {
    if (candidates.length === 0) return [];
    return prisma.contact.findMany({
      where: { organizationId, phone: { in: [...candidates] } },
      select: { id: true, phone: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
  },

  async getLead(organizationId: string, contactId: string): Promise<LeadRecord | null> {
    return prisma.contact.findFirst({
      where: { id: contactId, organizationId },
      select: leadSelect,
    });
  },

  async updateLead(input): Promise<UpdateLeadOutcome> {
    return executeLeadUpdate(input, {
      runTransaction: () =>
        prisma.$transaction(
          async (tx) => {
            const existing = await tx.contact.findFirst({
              where: { id: input.contactId, organizationId: input.organizationId },
              select: { id: true, notes: true },
            });
            if (!existing) return { status: 'NOT_FOUND' } as UpdateLeadOutcome;

            const data: Prisma.ContactUpdateInput = {};
            if (input.name !== undefined) data.name = input.name;
            if (input.company !== undefined) data.company = input.company;
            if (input.email !== undefined) data.email = input.email;
            if (input.notesAppend !== undefined) {
              data.notes = appendNote(existing.notes, input.notesAppend);
            }

            const lead = await tx.contact.update({
              where: { id: input.contactId },
              data,
              select: leadSelect,
            });
            return { status: 'UPDATED', lead } as UpdateLeadOutcome;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        ),
      policy: updateRetryPolicy,
    });
  },
};
