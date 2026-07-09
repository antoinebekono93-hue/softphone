import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contactId, body } = await req.json();

    if (!contactId || !body) {
      return NextResponse.json({ error: 'Missing contactId or body' }, { status: 400 });
    }

    const organizationId = session.user.organizationId;
    
    // Verify contact belongs to the org
    const contact = await prisma.contact.findUnique({
      where: { id: contactId, organizationId }
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Get the whatsapp account for the org
    const telecomAccount = await prisma.whatsAppAccount.findFirst({
      where: { organizationId }
    });

    if (!telecomAccount) {
      return NextResponse.json({ error: 'No WhatsApp account configured for this organization' }, { status: 400 });
    }

    // 1. Send via Telnyx
    const response = await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: telecomAccount.phoneNumber,
        to: contact.phone,
        whatsapp_message: {
          type: 'text',
          text: { body, preview_url: false }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Inbox Send] Telnyx error:", errorText);
      return NextResponse.json({ error: 'Failed to send via Telnyx' }, { status: 500 });
    }

    const telnyxData = await response.json();

    // 2. Save in database
    const smsMessage = await prisma.smsMessage.create({
      data: {
        body,
        direction: 'OUTBOUND',
        status: 'SENT',
        type: 'WHATSAPP',
        fromNumber: telecomAccount.phoneNumber,
        toNumber: contact.phone,
        organizationId,
        contactId: contact.id,
        telnyxMessageId: telnyxData.data?.id || `wa_${Date.now()}`
      }
    });

    // 3. Update Contact (Takeover automatically if bot is enabled)
    let updatedContact = contact;
    if (contact.botMode) {
      updatedContact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          botMode: false,
          escalationStatus: contact.escalationStatus === 'REQUESTED' ? 'RESOLVED' : contact.escalationStatus
        }
      });

      // Also trigger Pusher for contact update
      await pusherServer.trigger(
        `org-${organizationId}`,
        'contact-updated',
        { contactId: contact.id, botMode: updatedContact.botMode, escalationStatus: updatedContact.escalationStatus }
      );
    }

    // 4. Inject message into OpenAI Thread to keep history synced for later!
    if (updatedContact.openaiThreadId) {
      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        // L'agent humain écrit à la place de l'IA, on peut l'injecter comme un message système ou assistant
        await openai.beta.threads.messages.create(updatedContact.openaiThreadId, {
          role: "assistant",
          content: `[HUMAN AGENT TAKEOVER] : ${body}`
        });
      } catch(e) {
        console.error("Failed to inject human message into OpenAI Thread:", e);
      }
    }

    // 5. Broadcast new message via Pusher
    await pusherServer.trigger(
      `org-${organizationId}`,
      'new-message',
      smsMessage
    );

    return NextResponse.json({ success: true, message: smsMessage });
  } catch (error: any) {
    console.error('[Inbox Send Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
