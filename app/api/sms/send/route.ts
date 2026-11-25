import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSms } from '@/lib/sms-policy';
import { auth } from '@/auth';
import { randomUUID } from 'crypto';
import { confirmSmsCharge, refundSmsCharge, reserveSmsCharge } from '@/lib/billing';
import { resolveActiveSmsSender } from '@/lib/sms/sender';
import { createTelnyxSmsSender } from '@/lib/sms/provider';
import { SmsProviderError } from '@/lib/ai-tools/sms';
import { persistOutboundSmsMessage } from '@/lib/sms/persistence';

/**
 * Route d'envoi SMS canonique. Depuis la Phase 4C, la résolution de
 * l'expéditeur, l'appel Telnyx et la persistance sont délégués aux modules
 * partagés `lib/sms/*` — exactement les mêmes que l'outil IA `send_sms`, afin
 * qu'il n'existe qu'UNE seule implémentation d'envoi.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  let validated;
  try {
    validated = validateSms(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Message invalide' },
      { status: 400 }
    );
  }
  const { from, to, text, mediaUrls } = validated;

  // 1. Résoudre le numéro expéditeur actif du tenant (partagé avec l'outil IA).
  const resolution = await resolveActiveSmsSender(session.user.organizationId, from);
  if (resolution.status === 'NOT_FOUND') {
    return NextResponse.json(
      { error: 'Sender number not found in this organization' },
      { status: 403 }
    );
  }
  if (resolution.status === 'NO_PROFILE') {
    return NextResponse.json(
      { error: 'Associez un profil de messagerie de cette organisation au numéro.' },
      { status: 422 }
    );
  }
  const sender = resolution.sender;

  if (
    body.messagingProfileId &&
    ![sender.messagingProfileId, sender.messagingProfileTelnyxId].includes(
      body.messagingProfileId
    )
  ) {
    return NextResponse.json(
      { error: 'Profil non autorisé pour ce numéro.' },
      { status: 403 }
    );
  }

  const recipient = await prisma.contact.findFirst({
    where: { organizationId: session.user.organizationId, phone: to },
  });
  if (recipient?.optedOut) {
    return NextResponse.json(
      { error: 'Ce destinataire a refusé les messages.' },
      { status: 403 }
    );
  }

  // 2. Débiter le prix configuré avant de consommer le service Telnyx.
  // Les appels 4xx sont des refus certains et sont remboursés. Pour une
  // panne réseau/5xx, le débit reste réservé car Telnyx a pu accepter le SMS.
  const reservationId = randomUUID();
  let reservation;
  try {
    reservation = await reserveSmsCharge(session.user.organizationId, reservationId);
  } catch (billingError) {
    const insufficient =
      billingError instanceof Error &&
      billingError.message === 'Insufficient funds in wallet';
    return NextResponse.json(
      {
        error: insufficient
          ? 'Solde insuffisant pour envoyer ce message.'
          : 'La facturation SMS est indisponible.',
      },
      { status: insufficient ? 402 : 503 }
    );
  }

  // 3. Envoi via le port Telnyx partagé (jamais de rejeu SDK : maxRetries 0).
  let sent;
  try {
    sent = await createTelnyxSmsSender().send({
      from,
      to,
      text,
      mediaUrls: mediaUrls ?? [],
      messagingProfileTelnyxId: sender.messagingProfileTelnyxId,
    });
  } catch (apiError) {
    const definitive =
      apiError instanceof SmsProviderError && apiError.kind === 'DEFINITIVE';
    console.error(
      '[Telnyx SMS Send Error]',
      apiError instanceof SmsProviderError ? apiError.status ?? apiError.kind : 'unknown'
    );
    if (definitive) {
      await refundSmsCharge(
        session.user.organizationId,
        reservation.reference,
        'Refus Telnyx AI SMS route'
      );
    }
    return NextResponse.json(
      {
        error: definitive
          ? 'Le service a refusé le message. Le montant a été remboursé.'
          : 'Envoi non confirmé. Le débit reste réservé pour éviter une double soumission.',
      },
      { status: 502 }
    );
  }

  await confirmSmsCharge(reservation.reference, sent.providerMessageId);

  // 4. Persister (upsert idempotent par telnyxMessageId, partagé).
  const smsMessage = await persistOutboundSmsMessage({
    telnyxMessageId: sent.providerMessageId,
    organizationId: session.user.organizationId,
    phoneNumberId: sender.phoneNumberId,
    fromNumber: from,
    toNumber: to,
    body: text || '',
    type: sent.type,
    contactId: recipient?.id ?? null,
    userId: session.user.id,
    agentMessage: null,
    mediaUrls: mediaUrls ?? [],
  });

  return NextResponse.json({
    success: true,
    data: smsMessage,
    chargedAmount: reservation.amount,
  });
}
