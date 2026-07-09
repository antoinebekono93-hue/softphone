import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = session.user.organizationId;

    const { name, templateId, groupIds, botEnabled, aiGoal } = await req.json();

    if (!name || !templateId || !groupIds || groupIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch contacts from selected groups
    const targetGroups = await prisma.contactGroup.findMany({
      where: {
        id: { in: groupIds },
        organizationId
      },
      include: { contacts: true }
    });

    // Flatten and deduplicate contacts based on id (Phase 2: Respecter les Opt-outs)
    const uniqueContactsMap = new Map();
    targetGroups.forEach(group => {
      group.contacts.forEach(contact => {
        // IMPORTANT: Ne pas inclure les contacts désinscrits
        if (!contact.optedOut && !uniqueContactsMap.has(contact.id)) {
          uniqueContactsMap.set(contact.id, contact);
        }
      });
    });

    const targetContacts = Array.from(uniqueContactsMap.values());

    if (targetContacts.length === 0) {
      return NextResponse.json({ error: 'No contacts found in selected groups' }, { status: 400 });
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
        body: template.name,
        botEnabled: !!botEnabled,
        aiGoal: aiGoal || null
      }
    });

    let sentCount = 0;
    const apiKey = process.env.TELNYX_API_KEY;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Send messages (in a real prod app, this should be sent to a background worker like Redis/BullMQ)
    // For this prototype, we'll do it inline, but beware of Vercel 10s timeout if contacts array is huge.
    for (const contact of targetContacts) {
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

          // --- AI OUTBOUND CAMPAIGN LOGIC ---
          if (botEnabled) {
            let threadId = contact.openaiThreadId;
            if (!threadId) {
              const newThread = await openai.beta.threads.create();
              threadId = newThread.id;
            }

            // Mettre à jour le contact (botMode = true, enregistrer le thread)
            await prisma.contact.update({
              where: { id: contact.id },
              data: { botMode: true, openaiThreadId: threadId, escalationStatus: 'NONE' }
            });

            // Injecter le contexte de la campagne dans le thread
            const prompt = `[SYSTEM MESSAGE - CAMPAGNE MARKETING OUTBOUND]
Nous venons d'envoyer la campagne marketing '${campaign.name}' à ce contact.
Si le client répond à ce message, voici ton objectif absolu : ${aiGoal}
S'il ne répond pas, NE LUI ÉCRIS RIEN. Attends sa réponse.`;

            await openai.beta.threads.messages.create(threadId, {
              role: "assistant",
              content: prompt
            });
          }
          // ----------------------------------
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
