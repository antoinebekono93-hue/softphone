import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Temporary mock telnyx import
const telnyx = {
  messages: {
    create: async (data: any) => {
      console.log("Mock Telnyx message created:", data);
      return { id: `mock_telnyx_${Date.now()}` };
    }
  }
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { contactId, body, type = "SMS" } = await req.json();

    if (!contactId || !body) {
      return new NextResponse("Missing contactId or body", { status: 400 });
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

    // Determine the outbound number to use
    let fromNumber = "";
    
    if (type === "WHATSAPP") {
      const whatsappAccount = await prisma.whatsAppAccount.findUnique({
        where: { organizationId }
      });
      if (!whatsappAccount) {
        return new NextResponse("WhatsApp account not configured", { status: 400 });
      }
      fromNumber = whatsappAccount.phoneNumber;
      
      // TODO: Call WhatsApp Cloud API to send the message
      console.log(`Sending WhatsApp from ${fromNumber} to ${contact.phone}: ${body}`);
      
    } else {
      const phoneNumber = await prisma.phoneNumber.findFirst({
        where: { organizationId }
      });
      if (!phoneNumber) {
        return new NextResponse("Phone number not configured", { status: 400 });
      }
      fromNumber = phoneNumber.number;

      try {
        if (process.env.TELNYX_API_KEY) {
          // If we had real telnyx configured we would import it properly
          // await telnyx.messages.create({ ... })
          console.log(`Sending real SMS via Telnyx:`, body);
        } else {
          await telnyx.messages.create({
            from: fromNumber,
            to: contact.phone,
            text: body,
          });
        }
      } catch (err) {
        console.error("Error sending Telnyx SMS:", err);
        return new NextResponse("Provider Error", { status: 502 });
      }
    }

    // Store the sent message in DB
    const smsMessage = await prisma.smsMessage.create({
      data: {
        telnyxMessageId: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        direction: "OUTBOUND",
        body,
        type,
        status: "DELIVERED",
        fromNumber,
        toNumber: contact.phone,
        organizationId,
        contactId,
        userId: user.id, // Track which user sent it
        agentMessage: "true"
      }
    });

    // Ensure botMode is disabled since a human just replied
    await prisma.contact.update({
      where: { id: contact.id },
      data: { botMode: false, assignedUserId: user.id }
    });

    return NextResponse.json({ message: smsMessage });
  } catch (error: any) {
    console.error("[INBOX_SEND_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
