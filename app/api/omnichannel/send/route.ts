import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { to, text, channel } = body;

    if (!to || !channel) {
      return NextResponse.json({ error: 'Destination (to) and channel are required' }, { status: 400 });
    }

    const account = await prisma.whatsAppAccount.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    if (channel === 'WHATSAPP') {
        // Forward to Telnyx
        const apiKey = process.env.TELNYX_API_KEY;
        const response = await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            from: account?.phoneNumber,
            to,
            whatsapp_message: { type: 'text', text: { body: text, preview_url: false } }
          })
        });
        
        const data = await response.json();
        const msgId = data.data?.id || `wa_${Date.now()}`;
        
        await prisma.smsMessage.create({
            data: {
              telnyxMessageId: msgId,
              direction: 'OUTBOUND',
              body: text,
              status: 'SENT',
              type: 'WHATSAPP',
              fromNumber: account?.phoneNumber || "unknown",
              toNumber: to,
              organizationId: session.user.organizationId,
            }
        });
        return NextResponse.json({ success: true, messageId: msgId }, { status: 201 });
    } else {
        // Mock sending for INSTAGRAM / EMAIL
        console.log(`[Omnichannel] Mock sending to ${channel}: ${to}`);
        const msgId = `${channel.toLowerCase()}_${Date.now()}`;
        
        await prisma.smsMessage.create({
            data: {
              telnyxMessageId: msgId,
              direction: 'OUTBOUND',
              body: text,
              status: 'SENT',
              type: channel,
              fromNumber: "system",
              toNumber: to,
              organizationId: session.user.organizationId,
            }
        });
        return NextResponse.json({ success: true, messageId: msgId }, { status: 201 });
    }

  } catch (error: any) {
    console.error('[Omnichannel Send Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
