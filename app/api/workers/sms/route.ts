import { NextResponse } from 'next/server';
import { randomUUID, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getConfiguredTelnyxClient } from '@/lib/telnyx';
import { validateSms, messagingWebhookUrl } from '@/lib/sms-policy';
import { confirmSmsCharge, refundSmsCharge, reserveSmsCharge } from '@/lib/billing';

export async function POST(request: Request) {
  const secret = process.env.WORKER_API_KEY;
  const supplied = request.headers.get('authorization') || '';
  const expected = secret ? 'Bearer ' + secret : '';
  if (!expected || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) {
    return NextResponse.json({ error: 'Unauthorized worker' }, { status: 401 });
  }
  try {
    const { phone, template, orgId, from } = await request.json();
    if (typeof orgId !== 'string' || !orgId || typeof template !== 'string') return NextResponse.json({ error: 'Organisation et texte requis.' }, { status: 400 });
    const number = await prisma.phoneNumber.findFirst({
      where: { organizationId: orgId, status: 'ACTIVE', messagingProfileId: { not: null }, ...(typeof from === 'string' ? { number: from } : {}) },
      include: { messagingProfile: true }, orderBy: { createdAt: 'asc' },
    });
    if (!number?.messagingProfile || number.messagingProfile.organizationId !== orgId) return NextResponse.json({ error: 'Aucun numéro SMS configuré pour cette organisation.' }, { status: 422 });
    const presets: Record<string, string> = {
      payment_confirmation: 'Bonjour, votre paiement a bien été reçu. Merci de votre confiance !',
      shipping_update: 'Votre commande vient d’être expédiée. Vous recevrez un lien de suivi sous peu.',
    };
    let message;
    try { message = validateSms({ from: number.number, to: phone, text: presets[template] || template }); }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Message invalide' }, { status: 400 }); }
    const contact = await prisma.contact.findFirst({ where: { organizationId: orgId, phone: message.to } });
    if (contact?.optedOut) return NextResponse.json({ error: 'Destinataire désinscrit.' }, { status: 403 });
    const telnyx = await getConfiguredTelnyxClient();
    const webhookUrl = messagingWebhookUrl();
    let reservation;
    try { reservation = await reserveSmsCharge(orgId, randomUUID()); }
    catch (error) {
      const insufficient = error instanceof Error && error.message === 'Insufficient funds in wallet';
      return NextResponse.json({ error: insufficient ? 'Solde insuffisant.' : 'Facturation indisponible.' }, { status: insufficient ? 402 : 503 });
    }
    let response;
    try {
      response = await telnyx.messages.send({
        from: message.from, to: message.to, text: message.text,
        messaging_profile_id: number.messagingProfile.telnyxId,
        webhook_url: webhookUrl, use_profile_webhooks: true,
      }, { maxRetries: 0 });
    } catch (error: any) {
      const status = Number(error?.status ?? error?.statusCode);
      if (status >= 400 && status < 500) await refundSmsCharge(orgId, reservation.reference, `Refus Telnyx ${status}`);
      throw error;
    }
    if (!response.data?.id) throw new Error('Missing Telnyx message ID');
    await confirmSmsCharge(reservation.reference, response.data.id);
    const sms = await prisma.smsMessage.upsert({ where: { telnyxMessageId: response.data.id }, update: {}, create: {
      telnyxMessageId: response.data.id, organizationId: orgId, phoneNumberId: number.id,
      contactId: contact?.id, direction: 'OUTBOUND', type: 'SMS', status: 'QUEUED',
      fromNumber: message.from, toNumber: message.to, body: message.text,
    } });
    return NextResponse.json({ success: true, data: sms, chargedAmount: reservation.amount });
  } catch (error) {
    console.error('[SMS worker]', error);
    return NextResponse.json({ error: 'Envoi non confirmé. Vérifiez Telnyx avant toute nouvelle tentative.' }, { status: 502 });
  }
}
