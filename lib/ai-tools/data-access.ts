export interface AIEmployeeIdentityRecord {
  id: string;
  organizationId: string;
  voiceProvider: string | null;
  isActive: boolean;
  /** Per-employee write-tool grants; absent means none. */
  allowedWriteTools?: readonly string[];
}

export interface ContactRecord {
  id: string;
  name: string | null;
  company: string | null;
  email: string | null;
  isVip: boolean;
  leadScore: number | null;
  sentiment: string | null;
  escalationStatus: string | null;
  optedOut: boolean;
}

export interface OpportunityRecord {
  id: string;
  name: string;
  stage: string;
  expectedRevenue: number;
  probability: number;
  priority: number;
  contactId: string | null;
  createdAt: Date;
}

export interface ContactSearchQuery {
  query: string;
  limit: number;
}

export interface OpportunitySearchQuery {
  query: string;
  limit: number;
  stage?: string;
}

/**
 * Every method is scoped by organizationId. Lookups never accept a record id
 * alone: the tenant boundary is part of the identity of the record.
 */
export interface AIToolDataAccess {
  findEmployeeByAssistantId(
    assistantId: string
  ): Promise<AIEmployeeIdentityRecord | null>;
  findContactByPhone(
    organizationId: string,
    candidates: readonly string[]
  ): Promise<ContactRecord | null>;
  searchContacts(
    organizationId: string,
    query: ContactSearchQuery
  ): Promise<ContactRecord[]>;
  getContact(
    organizationId: string,
    contactId: string
  ): Promise<ContactRecord | null>;
  searchOpportunities(
    organizationId: string,
    query: OpportunitySearchQuery
  ): Promise<OpportunityRecord[]>;
  getOpportunity(
    organizationId: string,
    opportunityId: string
  ): Promise<OpportunityRecord | null>;
}
