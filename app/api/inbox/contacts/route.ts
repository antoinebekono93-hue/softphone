import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    
    // We only fetch contacts that have at least one SMS message
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId,
        smsMessages: {
          some: {}
        }
      },
      include: {
        smsMessages: {
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Map to a cleaner format for the frontend
    const formattedContacts = contacts.map(c => ({
      id: c.id,
      name: c.name || c.phone,
      phone: c.phone,
      botMode: c.botMode,
      escalationStatus: c.escalationStatus,
      aiSummary: c.aiSummary,
      lastMessage: c.smsMessages[0] ? {
        body: c.smsMessages[0].body,
        sentAt: c.smsMessages[0].sentAt,
        direction: c.smsMessages[0].direction,
        type: c.smsMessages[0].type
      } : null
    })).sort((a, b) => {
      // Sort by latest message date
      const dateA = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ contacts: formattedContacts });
  } catch (error: any) {
    console.error('[Inbox Contacts Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
