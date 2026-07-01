import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { telnyx } from '@/lib/telnyx';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TELNYX_API_KEY is not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { from, to, text, mediaUrls, messagingProfileId } = body;

    if (!from || !to) {
      return NextResponse.json({ error: 'Missing required fields: from, to' }, { status: 400 });
    }

    if (!text && (!mediaUrls || mediaUrls.length === 0)) {
      return NextResponse.json({ error: 'Message must contain text or mediaUrls' }, { status: 400 });
    }

    // 1. Find the Phone Number in our DB to get organizationId
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: { number: from }
    });

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Sender number not found in this organization' }, { status: 403 });
    }

    // 2. Prepare Telnyx payload
    const telnyxPayload: any = {
      from: from,
      to: to,
    };

    if (text) telnyxPayload.text = text;
    if (mediaUrls && mediaUrls.length > 0) telnyxPayload.media_urls = mediaUrls;
    if (messagingProfileId) telnyxPayload.messaging_profile_id = messagingProfileId;

    // 3. Send via Telnyx Node SDK
    let messageResponse;
    try {
      messageResponse = await telnyx.messages.create(telnyxPayload);
    } catch (apiError: any) {
      console.error('[Telnyx SMS Send Error]', apiError.raw?.errors || apiError.message);
      return NextResponse.json(
        { error: apiError.raw?.errors?.[0]?.detail || 'Failed to send message via Telnyx' },
        { status: apiError.raw?.errors?.[0]?.status || 500 }
      );
    }

    const telnyxMessageId = messageResponse.data.id;
    const msgType = messageResponse.data.type || (mediaUrls?.length ? 'MMS' : 'SMS');

    // 4. Save to DB
    const smsMessage = await prisma.smsMessage.create({
      data: {
        telnyxMessageId: telnyxMessageId,
        direction: 'OUTBOUND',
        body: text || '',
        fromNumber: from,
        toNumber: to,
        organizationId: phoneNumber.organizationId,
        phoneNumberId: phoneNumber.id,
        status: 'QUEUED',
        type: msgType,
        mediaUrls: mediaUrls || [],
        // Contact association could be done here if we have a contact matching the `to` number
      }
    });

    // Try to link with an existing contact based on phone number
    const contact = await prisma.contact.findFirst({
      where: {
        organizationId: phoneNumber.organizationId,
        phone: to
      }
    });

    if (contact) {
      await prisma.smsMessage.update({
        where: { id: smsMessage.id },
        data: { contactId: contact.id }
      });
    }

    return NextResponse.json({ success: true, data: smsMessage });
  } catch (error: any) {
    console.error('[SMS Send Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
