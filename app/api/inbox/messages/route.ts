import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('contactId');

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

    const messages = await prisma.smsMessage.findMany({
      where: {
        contactId,
        organizationId
      },
      orderBy: {
        sentAt: 'asc'
      }
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('[Inbox Messages Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
