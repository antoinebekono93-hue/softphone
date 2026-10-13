import { prisma } from '@/lib/prisma';
import type {
  AIToolDataAccess,
  AIEmployeeIdentityRecord,
  ContactRecord,
  ContactSearchQuery,
  OpportunityRecord,
  OpportunitySearchQuery,
} from './data-access';

const employeeSelect = {
  id: true,
  organizationId: true,
  voiceProvider: true,
  isActive: true,
  allowedWriteTools: true,
} as const;

const contactSelect = {
  id: true,
  name: true,
  company: true,
  email: true,
  isVip: true,
  leadScore: true,
  sentiment: true,
  escalationStatus: true,
  optedOut: true,
} as const;

const opportunitySelect = {
  id: true,
  name: true,
  stage: true,
  expectedRevenue: true,
  probability: true,
  priority: true,
  contactId: true,
  createdAt: true,
} as const;

export const prismaAIToolDataAccess: AIToolDataAccess = {
  async findEmployeeByAssistantId(
    assistantId: string
  ): Promise<AIEmployeeIdentityRecord | null> {
    return prisma.aIEmployee.findFirst({
      where: { telnyxAssistantId: assistantId },
      select: employeeSelect,
    });
  },

  async findContactByPhone(
    organizationId: string,
    candidates: readonly string[]
  ): Promise<ContactRecord | null> {
    if (candidates.length === 0) return null;
    return prisma.contact.findFirst({
      where: { organizationId, phone: { in: [...candidates] } },
      select: contactSelect,
    });
  },

  async searchContacts(
    organizationId: string,
    query: ContactSearchQuery
  ): Promise<ContactRecord[]> {
    return prisma.contact.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query.query, mode: 'insensitive' } },
          { company: { contains: query.query, mode: 'insensitive' } },
          { email: { contains: query.query, mode: 'insensitive' } },
        ],
      },
      select: contactSelect,
      take: query.limit,
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getContact(
    organizationId: string,
    contactId: string
  ): Promise<ContactRecord | null> {
    return prisma.contact.findFirst({
      where: { id: contactId, organizationId },
      select: contactSelect,
    });
  },

  async searchOpportunities(
    organizationId: string,
    query: OpportunitySearchQuery
  ): Promise<OpportunityRecord[]> {
    return prisma.opportunity.findMany({
      where: {
        organizationId,
        ...(query.stage ? { stage: query.stage } : {}),
        name: { contains: query.query, mode: 'insensitive' },
      },
      select: opportunitySelect,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    });
  },

  async getOpportunity(
    organizationId: string,
    opportunityId: string
  ): Promise<OpportunityRecord | null> {
    return prisma.opportunity.findFirst({
      where: { id: opportunityId, organizationId },
      select: opportunitySelect,
    });
  },
};
