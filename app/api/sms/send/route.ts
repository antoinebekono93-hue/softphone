import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getConfiguredTelnyxClient } from '@/lib/telnyx';
import { validateSms, messagingWebhookUrl } from '@/lib/sms-policy';
import { auth } from '@/auth';
import { randomUUID } from 'crypto';
import { confirmSmsCharge, refundSmsCharge, reserveSmsCharge } from '@/lib/billing';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    let validated;
    try { validated = validateSms(body); } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Message invalide' }, { status: 400 });
    }
    const { from, to, text, mediaUrls } = validated;

    // 1. Find the Phone Number in our DB to ensure it belongs to the user's org
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: { 
        number: from,
        organizationId: session.user.organizationId,
        status: 'ACTIVE',
      },
      include: { messagingProfile: true },
    });

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Sender number not found in this organization' }, { status: 403 });
    }

    const profile = phoneNumber.messagingProfile;
    if (!profile || profile.organizationId !== phoneNumber.organizationId) return NextResponse.json({ error: 'Associez un profil de messagerie de cette organisation au numéro.' }, { status: 422 });
    if (body.messagingProfileId && ![profile.id, profile.telnyxId].includes(body.messagingProfileId)) return NextResponse.json({ error: 'Profil non autorisé pour ce numéro.' }, { status: 403 });
    const recipient = await prisma.contact.findFirst({ where: { organizationId: phoneNumber.organizationId, phone: to } });
    if (recipient?.optedOut) return NextResponse.json({ error: 'Ce destinataire a refusé les messages.' }, { status: 403 });
    // 2. Prepare Telnyx payload
    const telnyxPayload: any = {
      from: from,
      to: to,
    };

    if (text) telnyxPayload.text = text;
    if (mediaUrls && mediaUrls.length > 0) telnyxPayload.media_urls = mediaUrls;
    telnyxPayload.messaging_profile_id = profile.telnyxId;
    telnyxPayload.webhook_url = messagingWebhookUrl();
    telnyxPayload.use_profile_webhooks = true;
    const telnyx = await getConfiguredTelnyxClient();

    // 3. Débiter le prix configuré avant de consommer le service Telnyx.
    // Les appels 4xx sont des refus certains et sont remboursés. Pour une
    // panne réseau/5xx, le débit reste réservé car Telnyx a pu accepter le SMS.
    const reservationId = randomUUID();
    let reservation;
    try {
      reservation = await reserveSmsCharge(phoneNumber.organizationId, reservationId);
    } catch (billingError) {
      const insufficient = billingError instanceof Error && billingError.message === 'Insufficient funds in wallet';
      return NextResponse.json(
        { error: insufficient ? 'Solde insuffisant pour envoyer ce message.' : 'La facturation SMS est indisponible.' },
        { status: insufficient ? 402 : 503 },
      );
    }

    // 4. Send via Telnyx Node SDK
    let messageResponse;
    try {
      messageResponse = await telnyx.messages.send(telnyxPayload, { maxRetries: 0 });
    } catch (apiError: any) {
      console.error('[Telnyx SMS Send Error]', apiError.raw?.errors || apiError.message);
      const status = Number(apiError?.status ?? apiError?.statusCode);
      if (status >= 400 && status < 500) {
        await refundSmsCharge(phoneNumber.organizationId, reservation.reference, `Refus Telnyx ${status}`);
      }
      return NextResponse.json(
        { error: status >= 400 && status < 500
          ? 'Telnyx a refusé le message. Le montant a été remboursé.'
          : 'Envoi non confirmé. Le débit reste réservé pour éviter une double soumission.' },
        { status: 502 }
      );
    }

    const telnyxMessageId = messageResponse.data?.id;
    if (!telnyxMessageId) {
      return NextResponse.json({ error: 'Envoi non confirmé. Le débit reste réservé pour vérification.' }, { status: 502 });
    }
    await confirmSmsCharge(reservation.reference, telnyxMessageId);
    const msgType = messageResponse.data.type || (mediaUrls?.length ? 'MMS' : 'SMS');

    // 5. Save to DB
    const smsMessage = await prisma.smsMessage.upsert({
      where: { telnyxMessageId },
      update: { userId: session.user.id, mediaUrls, contactId: recipient?.id },
      create: {
        telnyxMessageId: telnyxMessageId,
        direction: 'OUTBOUND',
        body: text || '',
        fromNumber: from,
        toNumber: to,
        organizationId: phoneNumber.organizationId,
        phoneNumberId: phoneNumber.id,
        userId: session.user.id,
        contactId: recipient?.id,
        status: 'QUEUED',
        type: msgType,
        mediaUrls: mediaUrls || [],
      }
    });

    return NextResponse.json({ success: true, data: smsMessage, chargedAmount: reservation.amount });
  } catch (error: any) {
    console.error('[SMS Send Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
