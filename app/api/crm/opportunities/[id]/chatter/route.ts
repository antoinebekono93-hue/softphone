import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Telnyx from "telnyx";
const telnyx = Telnyx(process.env.TELNYX_API_KEY || "");

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: resolvedParams.id, organizationId: session.user.organizationId },
      include: {
        internalNotes: {
          include: { author: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!opportunity) {
      return new NextResponse("Not found", { status: 404 });
    }

    let smsMessages: any[] = [];
    let callLogs: any[] = [];

    if (opportunity.contactId) {
      smsMessages = await prisma.smsMessage.findMany({
        where: { contactId: opportunity.contactId },
        orderBy: { sentAt: 'desc' }
      });

      callLogs = await prisma.callLog.findMany({
        where: { contactId: opportunity.contactId },
        orderBy: { startedAt: 'desc' }
      });
    }

    // Format feed items
    const feed = [
      ...opportunity.internalNotes.map(n => ({
        id: `note_${n.id}`,
        type: 'note',
        author: n.author.name || 'User',
        time: n.createdAt,
        content: n.content
      })),
      ...smsMessages.map(s => ({
        id: `sms_${s.id}`,
        type: s.direction === 'INBOUND' ? 'whatsapp_in' : 'whatsapp_out',
        author: s.direction === 'INBOUND' ? 'Client' : 'Vous',
        time: s.sentAt,
        content: s.body
      })),
      ...callLogs.map(c => ({
        id: `call_${c.id}`,
        type: 'call',
        author: 'Système',
        time: c.startedAt,
        content: `Appel ${c.direction === 'INBOUND' ? 'entrant' : 'sortant'} - Durée: ${c.duration}s. ${c.aiSummary ? 'Résumé: ' + c.aiSummary : ''}`
      }))
    ];

    // Sort combined feed by time descending
    feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json(feed);
  } catch (error) {
    console.error("[CHATTER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { type, content } = body;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: resolvedParams.id, organizationId: session.user.organizationId },
      include: { contact: true }
    });

    if (!opportunity) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (type === 'note') {
      const note = await prisma.internalNote.create({
        data: {
          content,
          opportunityId: opportunity.id,
          contactId: opportunity.contactId,
          organizationId: session.user.organizationId,
          authorId: session.user.id
        }
      });
      return NextResponse.json(note);
    }

    if (type === 'whatsapp') {
      if (!opportunity.contact?.phone) {
        return new NextResponse("Le contact n'a pas de numéro de téléphone", { status: 400 });
      }
      
      // Send via Telnyx WhatsApp API
      // The 'from' number should be your registered WhatsApp Business number in Telnyx
      const fromNumber = process.env.TELNYX_WHATSAPP_NUMBER || "+123456789";
      
      let telnyxMessageId = `msg_${Date.now()}`;
      try {
        if (process.env.TELNYX_API_KEY) {
          const response = await telnyx.messages.create({
            from: fromNumber,
            to: opportunity.contact.phone,
            text: content,
            // To send explicitly via WhatsApp, you might need a WhatsApp profile,
            // but Telnyx messages.create handles SMS/WhatsApp based on the sender ID type.
          });
          if (response.data && response.data.id) {
            telnyxMessageId = response.data.id;
          }
        }
      } catch (err) {
        console.error("[TELNYX_SEND_ERROR]", err);
        // We continue saving to DB even if send fails for debug purposes in this sandbox
      }

      const sms = await prisma.smsMessage.create({
        data: {
          telnyxMessageId,
          direction: "OUTBOUND",
          body: content,
          type: "WHATSAPP",
          fromNumber: "+123456789", // Should be the org's WA number
          toNumber: opportunity.contact.phone,
          organizationId: session.user.organizationId,
          userId: session.user.id,
          contactId: opportunity.contactId
        }
      });

      return NextResponse.json(sms);
    }

    return new NextResponse("Invalid type", { status: 400 });
  } catch (error) {
    console.error("[CHATTER_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
