import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return new NextResponse("Missing contactId", { status: 400 });
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

    // Verify contact belongs to the organization
    const contact = await prisma.contact.findUnique({
      where: {
        id: contactId,
        organizationId,
      },
    });

    if (!contact) {
      return new NextResponse("Contact not found", { status: 404 });
    }

    // Fetch sms messages (SMS and WhatsApp)
    const smsMessages = await prisma.smsMessage.findMany({
      where: { contactId },
      orderBy: { sentAt: "asc" },
    });

    // Fetch social messages (Instagram, Messenger, etc.)
    const socialMessages = await prisma.socialMessage.findMany({
      where: { contactId },
      orderBy: { createdAt: "asc" },
    });

    // Fetch call logs
    const callLogs = await prisma.callLog.findMany({
      where: { contactId },
      orderBy: { startedAt: "asc" },
    });

    // Unify all interactions into a single timeline
    const timeline: any[] = [];

    smsMessages.forEach((msg) => {
      timeline.push({
        id: msg.id,
        type: msg.type, // 'SMS' or 'WHATSAPP'
        direction: msg.direction,
        body: msg.body,
        mediaUrls: msg.mediaUrls || [],
        timestamp: new Date(msg.sentAt).getTime(),
        status: msg.status,
      });
    });

    socialMessages.forEach((msg) => {
      timeline.push({
        id: msg.id,
        type: msg.provider, // 'INSTAGRAM', 'MESSENGER', etc.
        direction: msg.direction,
        body: msg.content,
        mediaUrls: [],
        timestamp: new Date(msg.createdAt).getTime(),
        status: "DELIVERED",
      });
    });

    callLogs.forEach((call) => {
      timeline.push({
        id: call.id,
        type: "CALL",
        direction: call.direction,
        body: call.transcriptionText || "Appel vocal " + (call.direction === "INBOUND" ? "reçu" : "émis"),
        mediaUrls: call.recordingUrl ? [call.recordingUrl] : [],
        timestamp: new Date(call.startedAt).getTime(),
        status: call.status,
      });
    });

    // Sort timeline chronologically
    timeline.sort((a, b) => a.timestamp - b.timestamp);

    // Map timestamp back to ISO string for the frontend
    const formattedTimeline = timeline.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp).toISOString()
    }));

    return NextResponse.json({ messages: formattedTimeline, contact });
  } catch (error: any) {
    console.error("[INBOX_MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
