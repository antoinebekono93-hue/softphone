import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POST as sendSms } from '@/app/api/sms/send/route';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, content, channel } = body;

    if (channel !== 'SMS') return NextResponse.json({ error: 'Seules les campagnes SMS sont prises en charge ici en production.' }, { status: 501 });

    if (!content) {
      return new NextResponse("Content required", { status: 400 });
    }

    const sender = await prisma.phoneNumber.findFirst({
      where: { organizationId: session.user.organizationId, status: 'ACTIVE', messagingProfileId: { not: null } },
      orderBy: { createdAt: 'asc' },
    });
    if (!sender) return NextResponse.json({ error: 'Aucun numéro SMS actif avec profil de messagerie.' }, { status: 422 });
    // Limite explicite pour éviter une requête HTTP longue et des envois en masse accidentels.
    const contacts = await prisma.contact.findMany({
      where: { organizationId: session.user.organizationId, optedOut: false },
      take: 20,
    });

    if (contacts.length === 0) {
      return new NextResponse("No contacts found", { status: 400 });
    }

    // 2. Create the campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: name || "Campagne SMS",
        channel: 'SMS',
        phoneNumberId: sender.id,
        status: "SENDING",
        body: content,
        organizationId: session.user.organizationId,
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

    // Envoi réel ; les accusés de livraison arrivent ensuite via webhook.
    let successCount = 0;
    let failCount = 0;

    for (const recipient of campaign.recipients) {
      try {
        if (!recipient.contact?.phone) {
          throw new Error("No phone number for contact");
        }

        const personalizedContent = content.replace(/\{\{name\}\}/g, recipient.contact.name || "Client");
        const response = await sendSms(new Request(req.url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: req.headers.get('cookie') || '' },
          body: JSON.stringify({ from: sender.number, to: recipient.contact.phone, text: personalizedContent }),
        }));
        if (!response.ok) throw new Error(`Envoi SMS refusé (${response.status})`);
        const sent = await response.json();
        const telnyxMessageId = sent.data.telnyxMessageId;

        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'SENT', messageId: telnyxMessageId }
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

    // La campagne est terminée côté soumission, pas nécessairement livrée.
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { 
        status: 'COMPLETED',
        sentCount: successCount
      }
    });

    return NextResponse.json({ success: true, successCount, failCount, campaignId: campaign.id });
  } catch (error) {
    console.error("[CAMPAIGNS_SEND_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
