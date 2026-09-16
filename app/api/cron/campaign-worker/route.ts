import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/security";
import { getConfiguredTelnyxClient } from '@/lib/telnyx';
import { validateSms, messagingWebhookUrl } from '@/lib/sms-policy';
import { randomUUID } from 'crypto';
import { confirmSmsCharge, refundSmsCharge, reserveSmsCharge } from '@/lib/billing';

export async function GET(req: Request) {
  try {
    if (!requireCronSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[Campaign Worker] Waking up to process pending messages...");

    // Find campaigns that are in SENDING status
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: "SENDING", channel: 'SMS' },
      include: {
        phoneNumber: { include: { messagingProfile: true } },
      }
    });

    if (activeCampaigns.length === 0) {
      return NextResponse.json({ message: "No active campaigns to process." });
    }

    let totalProcessed = 0;

    for (const campaign of activeCampaigns) {
      if (!campaign.phoneNumber || campaign.phoneNumber.organizationId !== campaign.organizationId || campaign.phoneNumber.status !== 'ACTIVE' || !campaign.phoneNumber.messagingProfile || campaign.phoneNumber.messagingProfile.organizationId !== campaign.organizationId) {
        console.error(`[Campaign Worker] Campaign ${campaign.id} has no sender number assigned. Marking as FAILED.`);
        await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "FAILED" } });
        continue;
      }

      // Borne le nombre d'envois par exécution pour respecter la durée Vercel.
      const pendingRecipients = await prisma.campaignRecipient.findMany({
        where: {
          campaignId: campaign.id,
          status: "PENDING"
        },
        take: 20,
        include: {
          contact: true
        }
      });

      if (pendingRecipients.length === 0) {
        // If there are no pending recipients, the campaign is completed
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: "COMPLETED" }
        });
        console.log(`[Campaign Worker] Campaign ${campaign.id} completed.`);
        continue;
      }

      // Process the batch
      for (const recipient of pendingRecipients) {
        try {
          // Format the message body (allow variable replacement like {{firstName}})
          let text = campaign.body || "";
          if (recipient.contact) {
            const contactName = recipient.contact.name || "";
            text = text.replace("{{name}}", contactName);
            text = text.replace("{{firstName}}", contactName.split(" ")[0] || "");
            text = text.replace("{{lastName}}", contactName.split(" ").slice(1).join(" ") || "");
          }

          if (recipient.contact.optedOut) {
            await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: 'FAILED' } });
            totalProcessed++;
            continue;
          }
          const sms = validateSms({ from: campaign.phoneNumber.number, to: recipient.contact.phone, text });
          const client = await getConfiguredTelnyxClient();
          const webhookUrl = messagingWebhookUrl();
          let reservation;
          try { reservation = await reserveSmsCharge(campaign.organizationId, randomUUID()); }
          catch (error) {
            const insufficient = error instanceof Error && error.message === 'Insufficient funds in wallet';
            if (insufficient) {
              await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'FAILED' } });
            }
            throw error;
          }
          let response;
          try {
            response = await client.messages.send({
              from: sms.from,
              to: sms.to,
              text: sms.text,
              messaging_profile_id: campaign.phoneNumber.messagingProfile.telnyxId,
              webhook_url: webhookUrl,
              use_profile_webhooks: true,
            }, { maxRetries: 0 });
          } catch (error: any) {
            const status = Number(error?.status ?? error?.statusCode);
            if (status >= 400 && status < 500) await refundSmsCharge(campaign.organizationId, reservation.reference, `Refus Telnyx ${status}`);
            throw error;
          }
          const messageId = response.data?.id;
          if (!messageId) throw new Error('Telnyx n’a pas renvoyé de message ID');
          await confirmSmsCharge(reservation.reference, messageId);
          await prisma.smsMessage.upsert({
            where: { telnyxMessageId: messageId },
            update: { contactId: recipient.contactId },
            create: {
              telnyxMessageId: messageId,
              direction: 'OUTBOUND',
              body: sms.text || '',
              type: 'SMS',
              status: 'QUEUED',
              fromNumber: sms.from,
              toNumber: sms.to,
              organizationId: campaign.organizationId,
              phoneNumberId: campaign.phoneNumber.id,
              contactId: recipient.contactId,
            },
          });
            // Update recipient status to SENT
            await prisma.campaignRecipient.update({
              where: { id: recipient.id },
              data: { 
                status: "SENT",
                messageId
              }
            });
            // Update Campaign sent count
            await prisma.campaign.update({
              where: { id: campaign.id },
              data: { sentCount: { increment: 1 } }
            });
        } catch (err) {
          console.error(`[Campaign Worker] Error sending to ${recipient.contact.phone}:`, err);
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "FAILED" }
          });
        }
        totalProcessed++;
      }
    }

    return NextResponse.json({ success: true, processed: totalProcessed });
  } catch (error: any) {
    console.error("[Campaign Worker Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
