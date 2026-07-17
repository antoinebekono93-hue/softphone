import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = user.organization.id;

    // Fetch contacts that have at least one interaction (SMS, Social, or Call)
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId,
        OR: [
          { smsMessages: { some: {} } },
          { socialMessages: { some: {} } },
          { callLogs: { some: {} } }
        ]
      },
      include: {
        smsMessages: {
          orderBy: { sentAt: 'desc' },
          take: 1
        },
        socialMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        callLogs: {
          orderBy: { startedAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Map to a cleaner format for the frontend
    const formattedContacts = contacts.map(c => {
      const latestSms = c.smsMessages[0];
      const latestSocial = c.socialMessages[0];
      const latestCall = c.callLogs[0];

      let lastMsg: any = null;
      let lastTime = 0;

      if (latestSms && new Date(latestSms.sentAt).getTime() > lastTime) {
        lastTime = new Date(latestSms.sentAt).getTime();
        lastMsg = {
          body: latestSms.body,
          sentAt: latestSms.sentAt,
          direction: latestSms.direction,
          type: latestSms.type
        };
      }

      if (latestSocial && new Date(latestSocial.createdAt).getTime() > lastTime) {
        lastTime = new Date(latestSocial.createdAt).getTime();
        lastMsg = {
          body: latestSocial.content,
          sentAt: latestSocial.createdAt,
          direction: latestSocial.direction,
          type: latestSocial.provider
        };
      }

      if (latestCall && new Date(latestCall.startedAt).getTime() > lastTime) {
        lastTime = new Date(latestCall.startedAt).getTime();
        lastMsg = {
          body: latestCall.transcriptionText || 'Appel vocal',
          sentAt: latestCall.startedAt,
          direction: latestCall.direction,
          type: 'CALL'
        };
      }

      return {
        id: c.id,
        name: c.name || c.phone,
        phone: c.phone,
        botMode: c.botMode,
        escalationStatus: c.escalationStatus,
        aiSummary: c.aiSummary,
        lastMessage: lastMsg
      };
    }).sort((a, b) => {
      // Sort by latest message date
      const dateA = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ contacts: formattedContacts });
  } catch (error: any) {
    console.error('[Inbox Contacts Error]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
