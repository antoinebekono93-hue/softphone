import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, text, richCard, carousel, suggestions, fallbackText, fallbackFrom } = await req.json();

    if (!to) {
      return NextResponse.json({ error: 'Missing destination number (to)' }, { status: 400 });
    }

    // Get RCS Settings
    const settings = await prisma.rcsSettings.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    if (!settings || !settings.agentId || !settings.messagingProfileId) {
      return NextResponse.json({ error: 'RCS is not configured for this organization' }, { status: 400 });
    }

    // Build the agent_message payload
    let contentMessage: any = {};
    if (text) contentMessage.text = text;
    if (richCard) contentMessage.rich_card = { standalone_card: richCard };
    if (carousel) contentMessage.rich_card = { carousel_card: carousel };
    if (suggestions) contentMessage.suggestions = suggestions;

    const payload: any = {
      agent_id: settings.agentId,
      to,
      messaging_profile_id: settings.messagingProfileId,
      agent_message: {
        content_message: contentMessage
      }
    };

    // SMS Fallback
    if (fallbackText && fallbackFrom) {
      payload.fallback = {
        from: fallbackFrom,
        text: fallbackText
      };
    }

    // Call Telnyx API
    const response = await fetch('https://api.telnyx.com/v2/messages/rcs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Telnyx API Error', details: data }, { status: response.status });
    }

    // Determine type (might have fallen back to SMS)
    const type = data.data.type === 'RCS' ? 'RCS' : 'SMS';

    // Store the sent message
    const smsMessage = await prisma.smsMessage.create({
      data: {
        telnyxMessageId: data.data.id,
        direction: 'OUTBOUND',
        body: text || '[Rich Media Content]', // summary for the list view
        agentMessage: JSON.stringify(contentMessage), // full payload for detailed view
        fromNumber: settings.agentId, // RCS doesn't really have a "from number", it's the agent ID
        toNumber: to,
        status: data.data.status === 'queued' ? 'IN_FLIGHT' : 'SENT',
        type: type,
        organizationId: session.user.organizationId,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true, message: smsMessage, telnyxData: data.data });
  } catch (error: any) {
    console.error('RCS Send Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
