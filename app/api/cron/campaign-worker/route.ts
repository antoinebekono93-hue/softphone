import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This route should ideally be protected by a cron secret in production
// ex: if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) ...

export async function GET(req: Request) {
  try {
    console.log("[Campaign Worker] Waking up to process pending messages...");

    // Find campaigns that are in SENDING status
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: "SENDING" },
      include: {
        phoneNumber: true, // The sender number
        template: true,    // WhatsApp Template (if any)
      }
    });

    if (activeCampaigns.length === 0) {
      return NextResponse.json({ message: "No active campaigns to process." });
    }

    let totalProcessed = 0;

    for (const campaign of activeCampaigns) {
      if (!campaign.phoneNumber) {
        console.error(`[Campaign Worker] Campaign ${campaign.id} has no sender number assigned. Marking as FAILED.`);
        await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "FAILED" } });
        continue;
      }

      // Fetch a batch of PENDING recipients (Batch size of 50 to avoid timeout)
      const pendingRecipients = await prisma.campaignRecipient.findMany({
        where: {
          campaignId: campaign.id,
          status: "PENDING"
        },
        take: 50,
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
          // Determine the channel (SMS, WHATSAPP, RCS). 
          // For now, let's assume if it has a WhatsApp template, it's WhatsApp.
          // Otherwise, we default to SMS.
          const channel = campaign.template ? "WHATSAPP" : "SMS";
          
          // Format the message body (allow variable replacement like {{firstName}})
          let text = campaign.body || "";
          if (recipient.contact) {
            text = text.replace("{{firstName}}", recipient.contact.firstName || "");
            text = text.replace("{{lastName}}", recipient.contact.lastName || "");
          }

          // Call the Unified Messaging Engine internally
          // We can't easily fetch to our own route in Serverless without an absolute URL,
          // so we'll directly call the Telnyx API from here for maximum speed.
          
          const telnyxPayload: any = {
            from: campaign.phoneNumber.number,
            to: recipient.contact.phone,
          };

          if (channel === "WHATSAPP" && campaign.template) {
            telnyxPayload.type = "whatsapp";
            telnyxPayload.whatsapp = {
              type: "template",
              template: {
                name: campaign.template.name,
                language: { code: campaign.template.language || "fr" },
                components: [] // We could dynamically inject contact fields here
              }
            };
          } else {
            telnyxPayload.text = text;
          }

          const res = await fetch("https://api.telnyx.com/v2/messages", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(telnyxPayload)
          });

          const data = await res.json();

          if (res.ok) {
            // Update recipient status to SENT
            await prisma.campaignRecipient.update({
              where: { id: recipient.id },
              data: { 
                status: "SENT",
                messageId: data.data?.id
              }
            });
            // Update Campaign sent count
            await prisma.campaign.update({
              where: { id: campaign.id },
              data: { sentCount: { increment: 1 } }
            });
          } else {
            // Mark as failed
            await prisma.campaignRecipient.update({
              where: { id: recipient.id },
              data: { status: "FAILED" }
            });
            console.error(`[Campaign Worker] Telnyx Error for ${recipient.contact.phone}:`, data);
          }
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
