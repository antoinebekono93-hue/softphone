import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import OpenAI from 'openai';
import { sendWhatsAppForOrganization } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = session.user.organizationId;

    const { name, channel, templateId, messageText, groupIds, botEnabled, aiGoal, socialAccountId } = await req.json();

    if (!name || !channel || !groupIds || groupIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch contacts from selected groups
    const targetGroups = await prisma.contactGroup.findMany({
      where: {
        id: { in: groupIds },
        organizationId
      },
      include: { 
        contacts: {
          include: {
            socialMessages: {
              where: { provider: 'FACEBOOK' },
              take: 1
            }
          }
        } 
      }
    });

    const uniqueContactsMap = new Map();
    targetGroups.forEach(group => {
      group.contacts.forEach(contact => {
        if (!contact.optedOut && !uniqueContactsMap.has(contact.id)) {
          uniqueContactsMap.set(contact.id, contact);
        }
      });
    });

    const targetContacts = Array.from(uniqueContactsMap.values());

    if (targetContacts.length === 0) {
      return NextResponse.json({ error: 'No contacts found in selected groups' }, { status: 400 });
    }

    let sentCount = 0;
    let campaign;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // ----------------------------------------------------
    // WHATSAPP CAMPAIGN LOGIC
    // ----------------------------------------------------
    if (channel === 'WHATSAPP') {
      const template = await prisma.whatsAppTemplate.findUnique({
        where: { id: templateId, organizationId }
      });

      if (!template || template.status !== 'APPROVED') {
        return NextResponse.json({ error: 'Invalid or unapproved template' }, { status: 400 });
      }

      campaign = await prisma.campaign.create({
        data: {
          name,
          channel: 'WHATSAPP',
          templateId,
          organizationId,
          status: 'PROCESSING',
          body: template.name,
          botEnabled: !!botEnabled,
          aiGoal: aiGoal || null
        }
      });

      for (const contact of targetContacts) {
        try {
          const sent = await sendWhatsAppForOrganization({
            organizationId,
            userId: session.user.id,
            to: contact.phone,
            content: {
              type: 'template',
              template: template.telnyxId
                ? { template_id: template.telnyxId }
                : { name: template.name, language: { policy: 'deterministic', code: template.language } },
            },
          });
          await prisma.campaignRecipient.create({
              data: {
                campaignId: campaign.id,
                contactId: contact.id,
                status: 'QUEUED',
                messageId: sent.message.telnyxMessageId,
              }
            });
            sentCount++;

            if (botEnabled) {
              let threadId = contact.openaiThreadId;
              if (!threadId) {
                const newThread = await openai.beta.threads.create();
                threadId = newThread.id;
              }
              await prisma.contact.update({
                where: { id: contact.id },
                data: { botMode: true, openaiThreadId: threadId, escalationStatus: 'NONE' }
              });
              await openai.beta.threads.messages.create(threadId, {
                role: "assistant",
                content: `[SYSTEM MESSAGE - CAMPAGNE MARKETING OUTBOUND]\nNous venons d'envoyer la campagne marketing '${campaign.name}' à ce contact.\nSi le client répond, voici ton objectif : ${aiGoal}`
              });
            }
        } catch (err) {
          console.error(`Failed to send WA campaign message to ${contact.phone}`, err);
        }
      }
    } 
    // ----------------------------------------------------
    // MESSENGER CAMPAIGN LOGIC
    // ----------------------------------------------------
    else if (channel === 'MESSENGER') {
      if (!socialAccountId || !messageText) {
        return NextResponse.json({ error: 'Missing socialAccountId or message body' }, { status: 400 });
      }

      const socialAccount = await prisma.socialAccount.findUnique({
        where: { id: socialAccountId, organizationId, provider: 'FACEBOOK' }
      });

      if (!socialAccount) {
        return NextResponse.json({ error: 'Social Account not found' }, { status: 404 });
      }

      campaign = await prisma.campaign.create({
        data: {
          name,
          channel: 'MESSENGER',
          socialAccountId,
          organizationId,
          status: 'PROCESSING',
          body: messageText,
          botEnabled: !!botEnabled,
          aiGoal: aiGoal || null
        }
      });

      for (const contact of targetContacts) {
        // Find the PSID (senderId) for this contact on this social account
        const previousMessage = contact.socialMessages?.find((m: any) => m.provider === 'FACEBOOK');
        const psid = previousMessage ? previousMessage.senderId : null;

        if (psid) {
          try {
            const fbRes = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${socialAccount.accessToken}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messaging_type: "MESSAGE_TAG", // Using MESSAGE_TAG or standard based on 24h
                tag: "ACCOUNT_UPDATE", // Generic tag for prototype
                recipient: { id: psid },
                message: { text: messageText }
              })
            });

            if (fbRes.ok) {
              const data = await fbRes.json();
              await prisma.campaignRecipient.create({
                data: {
                  campaignId: campaign.id,
                  contactId: contact.id,
                  status: 'SENT',
                  messageId: data.message_id
                }
              });

              // Log in Social Messages
              await prisma.socialMessage.create({
                data: {
                  provider: 'FACEBOOK',
                  direction: 'OUTBOUND',
                  content: messageText,
                  senderId: socialAccount.accountId,
                  recipientId: psid,
                  contactId: contact.id,
                  organizationId,
                  aiEmployeeId: socialAccount.aiEmployeeId
                }
              });

              sentCount++;

              if (botEnabled) {
                let threadId = contact.openaiThreadId;
                if (!threadId) {
                  const newThread = await openai.beta.threads.create();
                  threadId = newThread.id;
                }
                await prisma.contact.update({
                  where: { id: contact.id },
                  data: { botMode: true, openaiThreadId: threadId, escalationStatus: 'NONE' }
                });
                await openai.beta.threads.messages.create(threadId, {
                  role: "assistant",
                  content: `[SYSTEM MESSAGE - CAMPAGNE MESSENGER OUTBOUND]\nNous venons d'envoyer la campagne '${campaign.name}' via Messenger.\nSi le client répond, voici ton objectif : ${aiGoal}`
                });
              }
            } else {
               const errData = await fbRes.json();
               console.error("FB Send error:", errData);
            }
          } catch (err) {
            console.error(`Failed to send Messenger campaign message to ${psid}`, err);
          }
        }
      }
    } else {
      return NextResponse.json({ error: 'Unsupported channel' }, { status: 400 });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'COMPLETED', sentCount }
    });

    return NextResponse.json({ success: true, campaign: updatedCampaign }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Campaign Exception]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
