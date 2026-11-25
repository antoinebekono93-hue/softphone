import type { AppointmentRecord } from './appointments';
import type { ContactRecord, OpportunityRecord } from './data-access';
import type { LeadRecord } from './leads';
import type { SmsMessageRecord } from './sms';

export interface ContactDTO {
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

export interface OpportunityDTO {
  id: string;
  name: string;
  stage: string;
  expectedRevenue: number;
  probability: number;
  priority: number;
  contactId: string | null;
  createdAt: string;
}

export interface AppointmentDTO {
  id: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  durationMinutes: number;
  status: string;
  customerName: string | null;
}

/**
 * Projection publique d'un lead. Exclut volontairement le téléphone, les notes
 * brutes et tout identifiant tenant : seuls le nom, la société, l'email et les
 * indicateurs de suivi non sensibles franchissent la frontière.
 */
export interface LeadDTO {
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

/**
 * Vue SÛRE d'un SMS sortant (Phase 4C). Seuls l'identifiant local, le
 * destinataire canonique et le statut franchissent la frontière : jamais
 * l'identifiant tenant, le `telnyxMessageId` brut, le médias ni le coût.
 */
export interface SmsMessageDTO {
  id: string;
  to: string;
  status: string;
}

export interface SmsSendResultDTO {
  ok: true;
  /** Vrai quand un rejeu idempotent a absorbé l'appel (aucun nouvel envoi). */
  deduplicated: boolean;
  message: SmsMessageDTO | null;
}

/**
 * Explicit DTOs are the only shape that leaves a tool handler. Prisma records
 * (with phone, notes, spend history, relations, tenant plumbing) never cross
 * this boundary.
 */
export function toContactDTO(record: ContactRecord): ContactDTO {
  return {
    id: record.id,
    name: record.name,
    company: record.company,
    email: record.email,
    isVip: record.isVip,
    leadScore: record.leadScore,
    sentiment: record.sentiment,
    escalationStatus: record.escalationStatus,
    optedOut: record.optedOut,
  };
}

export function toOpportunityDTO(record: OpportunityRecord): OpportunityDTO {
  return {
    id: record.id,
    name: record.name,
    stage: record.stage,
    expectedRevenue: record.expectedRevenue,
    probability: record.probability,
    priority: record.priority,
    contactId: record.contactId,
    createdAt: record.createdAt.toISOString(),
  };
}

export function toLeadDTO(record: LeadRecord): LeadDTO {
  return {
    id: record.id,
    name: record.name,
    company: record.company,
    email: record.email,
    isVip: record.isVip,
    leadScore: record.leadScore,
    sentiment: record.sentiment,
    escalationStatus: record.escalationStatus,
    optedOut: record.optedOut,
  };
}

export function toAppointmentDTO(record: AppointmentRecord): AppointmentDTO {
  const durationMinutes = Math.max(
    0,
    Math.round((record.endsAt.getTime() - record.startsAt.getTime()) / 60_000)
  );
  return {
    id: record.id,
    startsAt: record.startsAt.toISOString(),
    endsAt: record.endsAt.toISOString(),
    timezone: record.timezone,
    durationMinutes,
    status: record.status,
    customerName: record.customerName,
  };
}

export function toSmsMessageDTO(record: SmsMessageRecord): SmsMessageDTO {
  return {
    id: record.id,
    to: record.toNumber,
    status: record.status,
  };
}
