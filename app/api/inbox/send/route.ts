import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { POST as sendSms } from '@/app/api/sms/send/route';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.organizationId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { contactId, body, type = "SMS" } = await req.json();

    if (type !== 'SMS') {
      return NextResponse.json({ error: 'Ce canal n’est pas encore disponible en production.' }, { status: 501 });
    }
    if (!contactId || typeof body !== 'string') {
      return NextResponse.json({ error: 'Contact et texte requis.' }, { status: 400 });
    }

    const organizationId = session.user.organizationId;

    // Verify contact belongs to the organization
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId,
      },
    });

    if (!contact) {
      return new NextResponse("Contact not found", { status: 404 });
    }

    const sender = await prisma.phoneNumber.findFirst({
      where: { organizationId, status: 'ACTIVE', messagingProfileId: { not: null } },
      orderBy: { createdAt: 'asc' },
    });
    if (!sender) return NextResponse.json({ error: 'Aucun numéro SMS actif avec profil de messagerie.' }, { status: 422 });
    const result = await sendSms(new Request(req.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: req.headers.get('cookie') || '' },
      body: JSON.stringify({ from: sender.number, to: contact.phone, text: body }),
    }));
    if (!result.ok) return result;
    const sent = await result.json();
    await prisma.smsMessage.update({ where: { id: sent.data.id }, data: { agentMessage: 'true' } });

    // Ensure botMode is disabled since a human just replied
    await prisma.contact.update({
      where: { id: contact.id },
      data: { botMode: false, assignedUserId: session.user.id }
    });

    return NextResponse.json({ message: { ...sent.data, agentMessage: 'true' } });
  } catch (error: any) {
    console.error("[INBOX_SEND_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
