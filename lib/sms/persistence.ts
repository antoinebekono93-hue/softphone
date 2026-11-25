import { prisma } from '@/lib/prisma';

/**
 * Persistance canonique d'un SMS sortant, PARTAGÉE entre `/api/sms/send` et
 * l'outil IA `send_sms`. L'`upsert` par `telnyxMessageId` (colonne `@unique`)
 * rend l'écriture idempotente : un doublon de livraison/webhook ne crée pas de
 * seconde ligne. Ce module vit HORS de `lib/ai-tools`.
 */
export interface PersistOutboundSmsMessageInput {
  telnyxMessageId: string;
  organizationId: string;
  phoneNumberId: string;
  fromNumber: string;
  toNumber: string;
  body: string;
  type: string;
  contactId: string | null;
  userId: string | null;
  agentMessage: string | null;
  mediaUrls: string[];
}

export async function persistOutboundSmsMessage(
  input: PersistOutboundSmsMessageInput
) {
  return prisma.smsMessage.upsert({
    where: { telnyxMessageId: input.telnyxMessageId },
    update: {
      userId: input.userId,
      mediaUrls: input.mediaUrls,
      contactId: input.contactId,
    },
    create: {
      telnyxMessageId: input.telnyxMessageId,
      direction: 'OUTBOUND',
      body: input.body,
      fromNumber: input.fromNumber,
      toNumber: input.toNumber,
      organizationId: input.organizationId,
      phoneNumberId: input.phoneNumberId,
      userId: input.userId,
      contactId: input.contactId,
      status: 'QUEUED',
      type: input.type,
      mediaUrls: input.mediaUrls,
      agentMessage: input.agentMessage,
    },
  });
}
