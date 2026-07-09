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

    const { contactId, botMode, escalationStatus } = await req.json();

    if (!contactId) {
      return NextResponse.json({ error: 'Missing contactId' }, { status: 400 });
    }

    const organizationId = session.user.organizationId;
    
    // Verify contact belongs to the org
    const contact = await prisma.contact.findUnique({
      where: { id: contactId, organizationId }
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Update the contact
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        botMode: botMode !== undefined ? botMode : contact.botMode,
        escalationStatus: escalationStatus !== undefined ? escalationStatus : contact.escalationStatus
      }
    });

    // Broadcast the update via Pusher so other agents see the change in real-time
    await pusherServer.trigger(
      `org-${organizationId}`,
      'contact-updated',
      { contactId, botMode: updatedContact.botMode, escalationStatus: updatedContact.escalationStatus }
    );

    return NextResponse.json({ success: true, contact: updatedContact });
  } catch (error: any) {
    console.error('[Inbox Takeover Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
