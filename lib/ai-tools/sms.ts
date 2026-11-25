/**
 * Port d'envoi SMS + orchestration PURE (Phase 4C).
 *
 * Ce module NE contient AUCUN accès base ni appel réseau : l'implémentation
 * Prisma (`lib/sms/writer.ts`) et l'adaptateur Telnyx (`lib/sms/provider.ts`)
 * vivent HORS de `lib/ai-tools`, afin que `lib/ai-tools` reste sans écriture
 * Prisma (test statique J1) et que les tests unitaires n'aient jamais accès au
 * réseau. Les handlers dépendent uniquement des interfaces `SmsWriter` et
 * `SmsSenderPort`.
 *
 * Canal canonique : SMS sortant via `SmsMessage` (voir audit Phase 4C). Le
 * média (MMS) est volontairement hors périmètre du tool IA.
 */

export const SMS_MAX_BODY_LENGTH = 1600;
export const SMS_CHANNEL = 'SMS';

/** Expéditeur résolu pour l'organisation, jamais fourni par le LLM. */
export interface SmsSenderRecord {
  phoneNumberId: string;
  /** Numéro expéditeur canonique E.164. */
  fromNumber: string;
  messagingProfileId: string;
  messagingProfileTelnyxId: string;
}

/** Destinataire résolu : contact lié (facultatif) + numéro canonique. */
export interface SmsRecipientRecord {
  contactId: string | null;
  /** Numéro canonique E.164. */
  phone: string;
  optedOut: boolean;
}

/** Vue SÛRE d'un message sortant persisté (seule forme exportée au LLM). */
export interface SmsMessageRecord {
  id: string;
  telnyxMessageId: string;
  organizationId: string;
  fromNumber: string;
  toNumber: string;
  status: string;
  type: string;
  contactId: string | null;
}

export interface PersistOutboundSmsInput {
  organizationId: string;
  phoneNumberId: string;
  fromNumber: string;
  toNumber: string;
  body: string;
  type: string;
  contactId: string | null;
  userId: string | null;
  agentMessage: string | null;
  telnyxMessageId: string;
  mediaUrls: string[];
}

export interface ReservedSmsCharge {
  amount: number;
  reference: string;
}

export type SmsClaimOutcome = 'NEW' | 'DUPLICATE';

/**
 * Toutes les opérations sont scopées par `organizationId` : aucune méthode
 * n'accepte un identifiant seul. `claimSend` fournit le verrou d'idempotence
 * DURABLE (revendiqué AVANT tout effet de bord fournisseur).
 */
export interface SmsWriter {
  /** Premier numéro actif du tenant doté d'un profil de messagerie. */
  resolveSender(organizationId: string): Promise<SmsSenderRecord | null>;
  /** Contact du tenant portant l'id fourni, ou `null`. */
  resolveRecipientByContact(
    organizationId: string,
    contactId: string
  ): Promise<SmsRecipientRecord | null>;
  /**
   * Résolution par numéro canonique. Retourne toujours un destinataire (le
   * contact lié est facultatif) : un envoi vers un numéro non enregistré est
   * légitime, le opt-out est alors inconnu (false).
   */
  resolveRecipientByPhone(
    organizationId: string,
    phone: string
  ): Promise<SmsRecipientRecord>;
  /** Claim durable AVANT tout envoi fournisseur (anti-double-envoi). */
  claimSend(organizationId: string, idempotencyKey: string): Promise<SmsClaimOutcome>;
  /** Libère un claim uniquement quand l'envoi n'a PAS eu lieu (échec certain). */
  releaseClaim(organizationId: string, idempotencyKey: string): Promise<void>;
  reserveCharge(organizationId: string, reservationId: string): Promise<ReservedSmsCharge>;
  confirmCharge(reference: string, telnyxMessageId: string): Promise<void>;
  refundCharge(organizationId: string, reference: string, reason: string): Promise<void>;
  persistOutboundMessage(input: PersistOutboundSmsInput): Promise<SmsMessageRecord>;
}

export interface SmsProviderSendInput {
  from: string;
  to: string;
  text: string;
  mediaUrls: string[];
  /** Identifiant Telnyx du profil de messagerie expéditeur. */
  messagingProfileTelnyxId: string;
}

export interface SmsProviderSendResult {
  providerMessageId: string;
  type: string;
}

export interface SmsSenderPort {
  send(input: SmsProviderSendInput): Promise<SmsProviderSendResult>;
}

/**
 * Échec de facturation. `INSUFFICIENT_FUNDS` est un refus certain (aucun envoi) ;
 * `UNAVAILABLE` couvre une panne de facturation, également sans envoi.
 */
export class SmsChargeError extends Error {
  readonly kind: 'INSUFFICIENT_FUNDS' | 'UNAVAILABLE';

  constructor(kind: 'INSUFFICIENT_FUNDS' | 'UNAVAILABLE') {
    super(kind);
    this.name = 'SmsChargeError';
    this.kind = kind;
  }
}

/**
 * Échec fournisseur. `DEFINITIVE` = refus certain (4xx) : l'envoi n'a pas eu
 * lieu, le débit peut être remboursé et le claim libéré. `AMBIGUOUS` =
 * timeout/5xx : l'envoi a pu aboutir, le claim est CONSERVÉ pour empêcher un
 * double envoi au rejeu.
 */
export class SmsProviderError extends Error {
  readonly kind: 'DEFINITIVE' | 'AMBIGUOUS';
  readonly status?: number;

  constructor(kind: 'DEFINITIVE' | 'AMBIGUOUS', status?: number) {
    super(kind);
    this.name = 'SmsProviderError';
    this.kind = kind;
    this.status = status;
  }
}

/**
 * Clé d'idempotence SÉMANTIQUE, scopée par organisation et par identifiant de
 * requête d'outil (stable Telnyx `request_id`, sinon corrélation de transport).
 * Un rejeu retombe sur la MÊME clé ⇒ le message n'est jamais envoyé deux fois.
 */
export function buildSmsIdempotencyKey(params: {
  organizationId: string;
  requestId: string;
}): string {
  return `send_sms:${params.organizationId}:${params.requestId}`;
}
