import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = session.user.organizationId;

    const body = await req.json();
    const { name, templateId, contactIds } = body;

    if (!name || !templateId || !contactIds || !Array.isArray(contactIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify template
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id: templateId, organizationId }
    });

    if (!template || template.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Invalid or unapproved template' }, { status: 400 });
    }

    // Verify WhatsApp Account & Wallet Balance
    const account = await prisma.whatsAppAccount.findUnique({
      where: { organizationId },
      include: { organization: true }
    });

    if (!account || !account.phoneNumberId) {
      return NextResponse.json({ error: 'WhatsApp account not fully connected' }, { status: 400 });
    }

    if (account.organization.walletBalance <= 0) {
      return NextResponse.json({ error: 'Fonds insuffisants. Veuillez recharger votre portefeuille pour envoyer une campagne WhatsApp.' }, { status: 402 });
    }

    // Create Campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        templateId,
        organizationId,
        status: 'PROCESSING',
        body: template.name // just a ref
      }
    });

    // Fetch contacts
    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds }, organizationId }
    });

    let sentCount = 0;
    const apiKey = process.env.TELNYX_API_KEY;

    // Send messages (in a real prod app, this should be sent to a background worker like Redis/BullMQ)
    // For this prototype, we'll do it inline, but beware of Vercel 10s timeout if contacts array is huge.
    for (const contact of contacts) {
      try {
        const telnyxRes = await fetch(`https://api.telnyx.com/v2/whatsapp_messages/${account.phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: contact.phone,
            messaging_product: "whatsapp",
            recipient_type: "individual",
            type: "template",
            template: {
              name: template.name,
              language: {
                policy: "deterministic",
                code: template.language
              },
              components: JSON.parse(template.content || "[]") // Should resolve variables in future
            }
          })
        });

        if (telnyxRes.ok) {
          const data = await telnyxRes.json();
          const messageId = data.data?.messages?.[0]?.id || data.data?.id;

          // Log SMS message
          await prisma.smsMessage.create({
            data: {
              telnyxMessageId: messageId || `wa_${Date.now()}`,
              direction: "OUTBOUND",
              body: `[Campagne] ${template.name}`,
              status: "SENT",
              type: "WHATSAPP",
              fromNumber: account.phoneNumber,
              toNumber: contact.phone,
              organizationId,
              userId: session.user.id,
              contactId: contact.id
            }
          });

          // Log Campaign Recipient
          await prisma.campaignRecipient.create({
            data: {
              campaignId: campaign.id,
              contactId: contact.id,
              status: 'SENT',
              messageId
            }
          });

          sentCount++;
        }
      } catch (err) {
        console.error(`Failed to send campaign message to ${contact.phone}`, err);
      }
    }

    // Update campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'COMPLETED',
        sentCount
      },
      include: {
        template: true
      }
    });

    // Deduct cost
    await prisma.organization.update({
      where: { id: organizationId },
      data: { walletBalance: { decrement: sentCount * 0.05 } }
    });

    return NextResponse.json({ success: true, campaign: updatedCampaign }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Campaign Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
