import { canonicalizePhoneNumber } from '@/lib/phone-number';
import { toSmsMessageDTO, type SmsSendResultDTO } from '../dto';
import { AIToolError } from '../errors';
import type { AIToolEventName, AIToolEventSink } from '../observability';
import type { AIToolDefinition } from '../tool-definition';
import type { AIToolExecutionContext } from '../types';
import { readOptionalString, rejectUnknownKeys } from '../validation';
import {
  SMS_MAX_BODY_LENGTH,
  SmsChargeError,
  SmsProviderError,
  buildSmsIdempotencyKey,
  type SmsRecipientRecord,
} from '../sms';

const ALLOWED_KEYS = ['contact_id', 'to', 'body'] as const;
const MAX_CONTACT_ID = 120;

function emit(
  events: AIToolEventSink,
  name: AIToolEventName,
  context: AIToolExecutionContext,
  reason?: string
): void {
  events.emit({
    name,
    toolName: context.toolName,
    assistantId: context.assistantId,
    employeeId: context.employeeId,
    organizationId: context.organizationId,
    conversationId: context.telnyxConversationId ?? undefined,
    requestId: context.requestId,
    ...(reason ? { reason } : {}),
  });
}

/**
 * Lit et valide le corps du message. Le texte est conservé tel quel (jamais
 * tronqué, jamais trimé) : seuls les corps vides ou hors borne sont rejetés.
 * Aucune donnée partielle n'est envoyée.
 */
function readBody(args: Record<string, unknown>): string {
  const value = args.body;
  if (typeof value !== 'string' || !value.trim()) {
    throw new AIToolError('INVALID_ARGUMENTS', 'Invalid argument: body');
  }
  if (value.length > SMS_MAX_BODY_LENGTH) {
    throw new AIToolError('INVALID_ARGUMENTS', 'Invalid argument: body');
  }
  return value;
}

/**
 * `send_sms` (Phase 4C) : envoie UN SMS au nom du tenant de l'assistant
 * authentifié. WRITE explicite (`messages:write`) uniquement.
 *
 * Garanties :
 * - destinataire résolu DANS le tenant (contact_id) ou numéro canonique ;
 * - opt-out du contact vérifié AVANT tout effet de bord ;
 * - expéditeur choisi côté serveur (jamais un argument `from`) ;
 * - idempotence durable : claim AVANT envoi fournisseur (anti-double-envoi) ;
 * - facturation canonique réservée avant l'envoi, remboursée sur refus certain ;
 * - persistance idempotente par `telnyxMessageId` ;
 * - aucune donnée sensible tenant/Prisma ne franchit la frontière.
 */
export const sendSmsTool: AIToolDefinition<SmsSendResultDTO> = {
  name: 'send_sms',
  description:
    'Send a single SMS to a contact (by id) or to an explicit phone number. Use only when the caller has clearly asked for or agreed to a text message. The sender number is chosen automatically for the organisation.',
  inputSchema: {
    type: 'object',
    properties: {
      contact_id: {
        type: 'string',
        description: 'Existing contact id to send to (preferred identity).',
      },
      to: {
        type: 'string',
        description:
          'Destination phone number in any common format, used when no contact id is given.',
      },
      body: {
        type: 'string',
        description: 'Exact SMS text to send. Required, never empty.',
      },
    },
    required: ['body'],
    additionalProperties: false,
  },
  riskLevel: 'WRITE',
  requiredPermissions: ['messages:write'],
  enabled: true,
  async handler(args, context, deps): Promise<SmsSendResultDTO> {
    emit(deps.events, 'AI_SMS_SEND_REQUESTED', context);

    if (!deps.sms || !deps.smsSender) {
      emit(deps.events, 'AI_SMS_SEND_FAILED', context, 'SMS_UNAVAILABLE');
      throw new AIToolError('TEMPORARILY_UNAVAILABLE');
    }
    const writer = deps.sms;
    const senderPort = deps.smsSender;

    rejectUnknownKeys(args, ALLOWED_KEYS);

    const text = readBody(args);
    const contactId = readOptionalString(args, 'contact_id', MAX_CONTACT_ID);
    const toRaw = args.to;
    const hasTo = toRaw !== undefined && toRaw !== null && toRaw !== '';

    if (!contactId && !hasTo) {
      emit(deps.events, 'AI_SMS_SEND_FAILED', context, 'NO_RECIPIENT');
      throw new AIToolError('INVALID_ARGUMENTS', 'Missing recipient');
    }

    let recipient: SmsRecipientRecord;
    if (contactId) {
      const found = await writer.resolveRecipientByContact(
        context.organizationId,
        contactId
      );
      if (!found) {
        emit(deps.events, 'AI_SMS_SEND_FAILED', context, 'RECIPIENT_NOT_FOUND');
        throw new AIToolError('RECIPIENT_NOT_FOUND');
      }
      if (!found.phone) {
        emit(deps.events, 'AI_SMS_SEND_FAILED', context, 'RECIPIENT_HAS_NO_PHONE');
        throw new AIToolError('RECIPIENT_HAS_NO_PHONE');
      }
      recipient = found;
    } else {
      if (typeof toRaw !== 'string') {
        throw new AIToolError('INVALID_ARGUMENTS', 'Invalid argument: to');
      }
      const phone = canonicalizePhoneNumber(toRaw);
      if (!phone) {
        emit(deps.events, 'AI_SMS_SEND_FAILED', context, 'INVALID_DESTINATION');
        throw new AIToolError('INVALID_DESTINATION');
      }
      recipient = await writer.resolveRecipientByPhone(
        context.organizationId,
        phone
      );
    }

    if (recipient.optedOut) {
      emit(deps.events, 'AI_SMS_SEND_BLOCKED_OPT_OUT', context, 'OPTED_OUT');
      throw new AIToolError('RECIPIENT_OPTED_OUT');
    }

    const sender = await writer.resolveSender(context.organizationId);
    if (!sender) {
      emit(deps.events, 'AI_SMS_SEND_FAILED', context, 'SENDER_UNAVAILABLE');
      throw new AIToolError('SMS_SENDER_UNAVAILABLE');
    }

    emit(deps.events, 'AI_SMS_SEND_AUTHORIZED', context);

    const idempotencyKey = buildSmsIdempotencyKey({
      organizationId: context.organizationId,
      requestId: context.toolCallRequestId ?? context.requestId,
    });
    const claim = await writer.claimSend(context.organizationId, idempotencyKey);
    if (claim === 'DUPLICATE') {
      emit(deps.events, 'AI_SMS_SEND_REPLAY', context, 'DUPLICATE');
      return { ok: true, deduplicated: true, message: null };
    }

    emit(deps.events, 'AI_SMS_SEND_STARTED', context);

    let reservation;
    try {
      reservation = await writer.reserveCharge(
        context.organizationId,
        deps.generateRequestId()
      );
    } catch (error) {
      // Aucun envoi n'a eu lieu : le claim est libéré pour autoriser un rejeu.
      await writer.releaseClaim(context.organizationId, idempotencyKey);
      const reason =
        error instanceof SmsChargeError ? error.kind : 'CHARGE_UNAVAILABLE';
      emit(deps.events, 'AI_SMS_SEND_FAILED', context, `CHARGE_${reason}`);
      throw new AIToolError('TEMPORARILY_UNAVAILABLE');
    }

    let sent;
    try {
      sent = await senderPort.send({
        from: sender.fromNumber,
        to: recipient.phone,
        text,
        mediaUrls: [],
        messagingProfileTelnyxId: sender.messagingProfileTelnyxId,
      });
    } catch (error) {
      const definitive =
        error instanceof SmsProviderError && error.kind === 'DEFINITIVE';
      if (definitive) {
        await writer.refundCharge(
          context.organizationId,
          reservation.reference,
          'Provider refused AI SMS'
        );
        await writer.releaseClaim(context.organizationId, idempotencyKey);
        emit(deps.events, 'AI_SMS_SEND_FAILED', context, 'PROVIDER_REFUSED');
        throw new AIToolError('SMS_SEND_FAILED');
      }
      // AMBIGU : l'envoi a pu aboutir ⇒ claim CONSERVÉ pour empêcher un doublon.
      emit(deps.events, 'AI_SMS_SEND_FAILED', context, 'PROVIDER_AMBIGUOUS');
      throw new AIToolError('TEMPORARILY_UNAVAILABLE');
    }

    await writer.confirmCharge(reservation.reference, sent.providerMessageId);

    let message;
    try {
      message = await writer.persistOutboundMessage({
        organizationId: context.organizationId,
        phoneNumberId: sender.phoneNumberId,
        fromNumber: sender.fromNumber,
        toNumber: recipient.phone,
        body: text,
        type: 'SMS',
        contactId: recipient.contactId,
        userId: null,
        agentMessage: null,
        telnyxMessageId: sent.providerMessageId,
        mediaUrls: [],
      });
    } catch {
      // Le SMS est déjà parti : le claim reste posé (aucun double envoi).
      emit(deps.events, 'AI_SMS_SEND_FAILED', context, 'PERSIST_FAILED');
      throw new AIToolError('SMS_SEND_FAILED');
    }

    emit(deps.events, 'AI_SMS_SEND_ACCEPTED', context);
    return {
      ok: true,
      deduplicated: false,
      message: toSmsMessageDTO(message),
    };
  },
};
