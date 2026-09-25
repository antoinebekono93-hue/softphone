import { randomUUID } from 'crypto';
/* eslint-disable @typescript-eslint/no-explicit-any -- Provider errors are runtime SDK responses with version-dependent shapes. */
import { prisma } from '@/lib/prisma';
import { canonicalizePhoneNumber } from '@/lib/phone-number';
import { getConfiguredTelnyxClient } from '@/lib/telnyx';
import {
  confirmWhatsAppCharge,
  refundWhatsAppCharge,
  reserveWhatsAppCharge,
} from '@/lib/billing';

const CONTENT_TYPES = [
  'audio', 'document', 'image', 'sticker', 'video', 'interactive',
  'location', 'template', 'reaction', 'contacts', 'text',
] as const;

type WhatsAppContentType = (typeof CONTENT_TYPES)[number];
export type WhatsAppContent = Record<string, unknown> & { type: WhatsAppContentType };

export class WhatsAppSendError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly charged = false,
  ) {
    super(message);
  }
}

function isHttps(value: unknown) {
  if (typeof value !== 'string') return false;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

export function whatsappWebhookUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '');
  if (!base || new URL(base).protocol !== 'https:') {
    throw new Error('Configurez NEXT_PUBLIC_APP_URL avec le domaine HTTPS de production.');
  }
  return new URL('/api/webhooks/whatsapp', base).toString();
}

/** Validate the exact content object accepted by Telnyx messages.sendWhatsapp. */
export function validateWhatsAppContent(input: unknown): WhatsAppContent {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Le contenu WhatsApp est invalide.');
  }
  const content = input as Record<string, unknown>;
  const type = typeof content.type === 'string' ? content.type : '';
  if (!CONTENT_TYPES.includes(type as WhatsAppContentType)) {
    throw new Error('Type de message WhatsApp non pris en charge.');
  }
  if (content[type] === undefined) {
    throw new Error(`Le contenu ${type} est requis.`);
  }
  const present = CONTENT_TYPES.filter(key => content[key] !== undefined);
  if (present.length !== 1 || present[0] !== type) {
    throw new Error('Un message WhatsApp doit contenir un seul type de contenu.');
  }

  if (type === 'text') {
    const text = content.text as Record<string, unknown> | undefined;
    const body = typeof text?.body === 'string' ? text.body.trim() : '';
    if (!body || body.length > 4096) {
      throw new Error('Le texte WhatsApp doit contenir entre 1 et 4096 caractères.');
    }
  }
  if (['audio', 'document', 'image', 'sticker', 'video'].includes(type)) {
    const media = content[type] as Record<string, unknown> | undefined;
    if (!isHttps(media?.link)) throw new Error('Le média WhatsApp doit utiliser une URL HTTPS publique.');
  }
  if (type === 'template') {
    const template = content.template as Record<string, unknown> | undefined;
    const hasId = typeof template?.template_id === 'string' && template.template_id.trim();
    const language = template?.language as Record<string, unknown> | undefined;
    const hasName = typeof template?.name === 'string' && template.name.trim()
      && typeof language?.code === 'string' && language.code.trim();
    if (!hasId && !hasName) {
      throw new Error('Le modèle exige template_id ou bien name et language.code.');
    }
  }
  if (type === 'contacts' && (!Array.isArray(content.contacts) || !content.contacts.length)) {
    throw new Error('Ajoutez au moins un contact WhatsApp.');
  }
  return content as WhatsAppContent;
}

function summarizeContent(content: WhatsAppContent) {
  if (content.type === 'text') {
    return String((content.text as Record<string, unknown>).body ?? '');
  }
  if (content.type === 'template') {
    const template = content.template as Record<string, unknown>;
    return `[Modèle WhatsApp] ${String(template.name || template.template_id || '')}`;
  }
  return `[WhatsApp ${content.type}]`;
}

export async function sendWhatsAppForOrganization(input: {
  organizationId: string;
  userId?: string | null;
  to: unknown;
  content: unknown;
  agentMessage?: boolean;
}) {
  const to = canonicalizePhoneNumber(input.to);
  if (!to) throw new WhatsAppSendError('Le destinataire doit être au format E.164.', 400, 'INVALID_DESTINATION');
  const content = validateWhatsAppContent(input.content);
  const account = await prisma.whatsAppAccount.findUnique({
    where: { organizationId: input.organizationId },
  });
  if (!account) {
    throw new WhatsAppSendError('Aucun compte WhatsApp Telnyx n’est attribué à cette organisation.', 422, 'WHATSAPP_NOT_CONFIGURED');
  }
  if (!account.enabled || ['DISABLED', 'FAILED', 'REJECTED', 'DELETED'].includes(account.status.toUpperCase())) {
    throw new WhatsAppSendError('Le numéro WhatsApp Telnyx n’est pas actif.', 422, 'WHATSAPP_NOT_ACTIVE');
  }
  const from = canonicalizePhoneNumber(account.phoneNumber);
  if (!from) throw new WhatsAppSendError('Le numéro WhatsApp configuré est invalide.', 422, 'INVALID_SENDER');

  const contact = await prisma.contact.findFirst({
    where: { organizationId: input.organizationId, phone: to },
  });
  if (contact?.optedOut) {
    throw new WhatsAppSendError('Ce destinataire a refusé les messages.', 403, 'RECIPIENT_OPTED_OUT');
  }

  let reservation;
  try {
    reservation = await reserveWhatsAppCharge(input.organizationId, randomUUID());
  } catch (error) {
    const insufficient = error instanceof Error && error.message === 'Insufficient funds in wallet';
    throw new WhatsAppSendError(
      insufficient ? 'Solde insuffisant pour envoyer ce message WhatsApp.' : 'La facturation WhatsApp est indisponible.',
      insufficient ? 402 : 503,
      insufficient ? 'INSUFFICIENT_FUNDS' : 'BILLING_UNAVAILABLE',
    );
  }

  const telnyx = await getConfiguredTelnyxClient();
  let response;
  try {
    response = await telnyx.messages.sendWhatsapp({
      from,
      to,
      type: 'WHATSAPP',
      whatsapp_message: content,
      ...(account.messagingProfileId ? { messaging_profile_id: account.messagingProfileId } : {}),
      webhook_url: whatsappWebhookUrl(),
    }, { maxRetries: 0 });
  } catch (error: any) {
    const providerStatus = Number(error?.status ?? error?.statusCode);
    const certainRejection = providerStatus >= 400 && providerStatus < 500
      && providerStatus !== 408 && providerStatus !== 429;
    if (certainRejection) {
      await refundWhatsAppCharge(input.organizationId, reservation.reference, `Refus Telnyx ${providerStatus}`);
    }
    throw new WhatsAppSendError(
      certainRejection
        ? 'Telnyx a refusé le message. Le montant a été remboursé.'
        : 'Envoi non confirmé. Le débit reste réservé pour éviter une double soumission.',
      502,
      certainRejection ? 'TELNYX_REJECTED' : 'TELNYX_UNCERTAIN',
      !certainRejection,
    );
  }

  const telnyxMessageId = response?.data?.id;
  if (!telnyxMessageId) {
    throw new WhatsAppSendError(
      'Telnyx n’a pas confirmé l’envoi. Le débit reste réservé pour vérification.',
      502,
      'TELNYX_UNCERTAIN',
      true,
    );
  }
  await confirmWhatsAppCharge(reservation.reference, telnyxMessageId);
  const message = await prisma.smsMessage.upsert({
    where: { telnyxMessageId },
    update: {
      userId: input.userId || undefined,
      contactId: contact?.id,
      agentMessage: input.agentMessage ? 'true' : undefined,
    },
    create: {
      telnyxMessageId,
      direction: 'OUTBOUND',
      body: summarizeContent(content),
      status: 'QUEUED',
      type: 'WHATSAPP',
      cost: reservation.amount,
      fromNumber: from,
      toNumber: to,
      organizationId: input.organizationId,
      userId: input.userId || undefined,
      contactId: contact?.id,
      agentMessage: input.agentMessage ? 'true' : undefined,
    },
  });
  return { message, provider: response.data, chargedAmount: reservation.amount };
}
