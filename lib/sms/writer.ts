import { prisma } from '@/lib/prisma';
import {
  confirmSmsCharge,
  refundSmsCharge,
  reserveSmsCharge,
} from '@/lib/billing';
import { canonicalizePhoneNumber, phoneNumberLookupCandidates } from '@/lib/phone-number';
import {
  SmsChargeError,
  type PersistOutboundSmsInput,
  type ReservedSmsCharge,
  type SmsClaimOutcome,
  type SmsMessageRecord,
  type SmsRecipientRecord,
  type SmsSenderRecord,
  type SmsWriter,
} from '@/lib/ai-tools/sms';
import { resolveActiveSmsSender } from './sender';
import { persistOutboundSmsMessage } from './persistence';

/**
 * Implémentation Prisma du port d'envoi SMS. Volontairement HORS de
 * `lib/ai-tools` : ce répertoire doit rester sans écriture Prisma (test
 * statique J1). Toutes les requêtes sont scopées par `organizationId`.
 *
 * Idempotence : le claim AVANT envoi réutilise la table `WebhookEvent`
 * existante (`@@unique([provider, eventId])`) — jamais une seconde table. La
 * clé est déjà scopée par organisation (`send_sms:<org>:<requestId>`).
 *
 * Facturation : DÉLÉGUÉE aux fonctions canoniques `lib/billing.ts` (aucune
 * réécriture du débit). Toute défaillance est convertie en `SmsChargeError`.
 */
const MAX_CONTACT_ID = 120;


const messageSelect = {
  id: true,
  telnyxMessageId: true,
  organizationId: true,
  fromNumber: true,
  toNumber: true,
  status: true,
  type: true,
  contactId: true,
} as const;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}

function toRecipient(
  contact: { id: string; phone: string; optedOut: boolean } | null,
  fallbackPhone: string
): SmsRecipientRecord {
  if (!contact) {
    return { contactId: null, phone: fallbackPhone, optedOut: false };
  }
  return {
    contactId: contact.id,
    phone: canonicalizePhoneNumber(contact.phone) ?? '',
    optedOut: contact.optedOut,
  };
}

export const prismaSmsWriter: SmsWriter = {
  async resolveSender(organizationId: string): Promise<SmsSenderRecord | null> {
    const resolution = await resolveActiveSmsSender(organizationId);
    if (resolution.status !== 'OK') return null;
    const { phoneNumberId, fromNumber, messagingProfileId, messagingProfileTelnyxId } =
      resolution.sender;
    return {
      phoneNumberId,
      fromNumber,
      messagingProfileId,
      messagingProfileTelnyxId,
    };
  },

  async resolveRecipientByContact(
    organizationId: string,
    contactId: string
  ): Promise<SmsRecipientRecord | null> {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId },
      select: { id: true, phone: true, optedOut: true },
    });
    if (!contact) return null;
    return toRecipient(contact, contact.phone);
  },

  async resolveRecipientByPhone(
    organizationId: string,
    phone: string
  ): Promise<SmsRecipientRecord> {
    const candidates = phoneNumberLookupCandidates(phone);
    const contact = candidates.length
      ? await prisma.contact.findFirst({
          where: { organizationId, phone: { in: candidates } },
          select: { id: true, phone: true, optedOut: true },
        })
      : null;
    return { contactId: contact?.id ?? null, phone, optedOut: contact?.optedOut ?? false };
  },

  async claimSend(
    organizationId: string,
    idempotencyKey: string
  ): Promise<SmsClaimOutcome> {
    void organizationId;
    try {
      await prisma.webhookEvent.create({
        data: { provider: 'TELNYX', eventId: idempotencyKey, type: 'ai_sms_send' },
      });
      return 'NEW';
    } catch (error) {
      if ((error as { code?: string } | null)?.code === 'P2002') {
        return 'DUPLICATE';
      }
      throw error;
    }
  },

  async releaseClaim(organizationId: string, idempotencyKey: string): Promise<void> {
    void organizationId;
    await prisma.webhookEvent.deleteMany({
      where: { provider: 'TELNYX', eventId: idempotencyKey, type: 'ai_sms_send' },
    });
  },

  async reserveCharge(
    organizationId: string,
    reservationId: string
  ): Promise<ReservedSmsCharge> {
    try {
      return await reserveSmsCharge(organizationId, reservationId);
    } catch (error) {
      const insufficient =
        error instanceof Error && error.message === 'Insufficient funds in wallet';
      throw new SmsChargeError(insufficient ? 'INSUFFICIENT_FUNDS' : 'UNAVAILABLE');
    }
  },

  async confirmCharge(reference: string, telnyxMessageId: string): Promise<void> {
    await confirmSmsCharge(reference, telnyxMessageId);
  },

  async refundCharge(
    organizationId: string,
    reference: string,
    reason: string
  ): Promise<void> {
    await refundSmsCharge(organizationId, reference, reason);
  },

  async persistOutboundMessage(
    input: PersistOutboundSmsInput
  ): Promise<SmsMessageRecord> {
    const message = await persistOutboundSmsMessage({
      telnyxMessageId: input.telnyxMessageId,
      organizationId: input.organizationId,
      phoneNumberId: input.phoneNumberId,
      fromNumber: input.fromNumber,
      toNumber: input.toNumber,
      body: input.body,
      type: input.type,
      contactId: input.contactId,
      userId: input.userId,
      agentMessage: input.agentMessage,
      mediaUrls: input.mediaUrls,
    });
    return {
      id: message.id,
      telnyxMessageId: message.telnyxMessageId,
      organizationId: message.organizationId,
      fromNumber: message.fromNumber,
      toNumber: message.toNumber,
      status: message.status,
      type: message.type,
      contactId: message.contactId,
    };
  },
};
