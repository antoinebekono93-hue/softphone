import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Telnyx from "telnyx";

const telnyx = Telnyx(process.env.TELNYX_API_KEY || "");

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, content, audience } = body;

    if (!content) {
      return new NextResponse("Content required", { status: 400 });
    }

    // 1. Fetch all contacts for this organization (mock audience filtering)
    // In a real scenario, you'd filter by 'audience' tags
    const contacts = await prisma.contact.findMany({
      where: { organizationId: session.user.organizationId },
      take: 5 // Limit to 5 for safety in sandbox
    });

    if (contacts.length === 0) {
      return new NextResponse("No contacts found", { status: 400 });
    }

    // 2. Create the campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: name || "Campagne WhatsApp",
        type: "WHATSAPP",
        status: "RUNNING",
        content,
        organizationId: session.user.organizationId,
        createdBy: session.user.id,
        startedAt: new Date(),
        recipients: {
          create: contacts.map(c => ({
            contactId: c.id,
            status: 'PENDING'
          }))
        }
      },
      include: {
        recipients: { include: { contact: true } }
      }
    });

    const fromNumber = process.env.TELNYX_WHATSAPP_NUMBER || "+123456789";

    // 3. Send message to all recipients asynchronously
    let successCount = 0;
    let failCount = 0;

    for (const recipient of campaign.recipients) {
      try {
        if (!recipient.contact?.phone) {
          throw new Error("No phone number for contact");
        }

        let personalizedContent = content.replace(/\{\{name\}\}/g, recipient.contact.name || "Client");
        let telnyxMessageId = `cmp_msg_${Date.now()}_${recipient.id}`;

        if (process.env.TELNYX_API_KEY) {
          const response = await telnyx.messages.create({
            from: fromNumber,
            to: recipient.contact.phone,
            text: personalizedContent,
          });
          if (response.data?.id) {
            telnyxMessageId = response.data.id;
          }
        }

        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'SENT', sentAt: new Date() }
        });

        await prisma.smsMessage.create({
          data: {
            telnyxMessageId,
            direction: 'OUTBOUND',
            body: personalizedContent,
            type: 'WHATSAPP',
            fromNumber,
            toNumber: recipient.contact.phone,
            organizationId: session.user.organizationId,
            userId: session.user.id,
            contactId: recipient.contactId
          }
        });

        successCount++;
      } catch (err) {
        console.error(`[CAMPAIGN_SEND_ERR] Recipient ${recipient.id}`, err);
        failCount++;
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED' }
        });
      }
    }

    // 4. Mark campaign as COMPLETED
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { 
        status: 'COMPLETED', 
        completedAt: new Date(),
        successCount,
        failCount
      }
    });

    return NextResponse.json({ success: true, successCount, failCount, campaignId: campaign.id });
  } catch (error) {
    console.error("[CAMPAIGNS_SEND_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
