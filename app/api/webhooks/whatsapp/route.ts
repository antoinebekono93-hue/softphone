import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[Webhook WhatsApp Reçu]", JSON.stringify(payload, null, 2));

    const eventData = payload?.data;
    if (!eventData) {
      return NextResponse.json({ success: true });
    }

    const eventType = eventData.event_type;

    // Traitement des messages entrants
    if (eventType === "message.received") {
      const payloadInfo = eventData.payload;
      const telnyxMessageId = payloadInfo.id;
      const fromNumber = payloadInfo.from?.phone_number;
      const toNumber = payloadInfo.to?.[0]?.phone_number;
      const body = payloadInfo.text?.body || "Message sans texte";
      
      if (!fromNumber || !toNumber) {
        return NextResponse.json({ success: true });
      }

      // 1. Trouver le compte WhatsApp correspondant au numéro de destination
      const waAccount = await prisma.whatsAppAccount.findFirst({
        where: { phoneNumber: toNumber }
      });

      if (waAccount) {
        // 2. Créer ou trouver le contact (le client qui envoie le message WhatsApp)
        const contact = await prisma.contact.upsert({
          where: { 
            organizationId_phone: {
              organizationId: waAccount.organizationId,
              phone: fromNumber
            }
          },
          update: {},
          create: {
            organizationId: waAccount.organizationId,
            phone: fromNumber,
            name: payloadInfo.from?.profile?.name || "Client WhatsApp",
          }
        });

        // 3. Sauvegarder le message dans la base de données
        await prisma.smsMessage.create({
          data: {
            telnyxMessageId: telnyxMessageId,
            direction: "INBOUND",
            body: body,
            status: "DELIVERED",
            type: "WHATSAPP",
            fromNumber: fromNumber,
            toNumber: toNumber,
            organizationId: waAccount.organizationId,
            contactId: contact.id,
          }
        });
        
        console.log(`[WhatsApp] Message enregistré pour l'organisation ${waAccount.organizationId}`);

        // 4. INTELLIGENCE CRM : Mettre à jour le Pipeline de Ventes
        // Si le client répond, nous le faisons avancer dans le pipeline
        
        // Chercher s'il y a déjà une opportunité en cours (ni gagnée ni perdue)
        const existingOpp = await prisma.opportunity.findFirst({
          where: {
            contactId: contact.id,
            organizationId: waAccount.organizationId,
            stage: { notIn: ["WON", "LOST"] }
          },
          orderBy: { updatedAt: 'desc' }
        });

        if (existingOpp) {
          // Si l'opportunité est "Nouveau" ou "Qualifié", on la passe en "Négociation" car le client a répondu
          if (existingOpp.stage === "NEW" || existingOpp.stage === "QUALIFIED" || existingOpp.stage === "PROPOSAL") {
            await prisma.opportunity.update({
              where: { id: existingOpp.id },
              data: { stage: "NEGOTIATION" }
            });
            console.log(`[CRM] Opportunité ${existingOpp.id} passée en Négociation.`);
          }
        } else {
          // S'il n'y a pas d'opportunité, on en crée une automatiquement (Lead entrant)
          await prisma.opportunity.create({
            data: {
              name: `Lead WhatsApp: ${contact.name || contact.phone}`,
              stage: "QUALIFIED", // Client qualifié puisqu'il a interagi
              expectedRevenue: 0,
              contactId: contact.id,
              organizationId: waAccount.organizationId,
            }
          });
          console.log(`[CRM] Nouvelle opportunité créée pour ${contact.phone}`);
        }
      }
    // Traitement des mises à jour de statuts (Delivered, Read)
    } else if (eventType === "message.status.updated") {
      const payloadInfo = eventData.payload;
      const telnyxMessageId = payloadInfo.id;
      const status = payloadInfo.status; // 'delivered', 'read', 'failed'

      // Chercher le message sortant pour mettre à jour son statut
      const message = await prisma.smsMessage.findUnique({
        where: { telnyxMessageId }
      });

      if (message) {
        // Mettre à jour le message
        await prisma.smsMessage.update({
          where: { id: message.id },
          data: { status: status.toUpperCase() }
        });

        // Mettre à jour le destinataire de la campagne si le message y est lié
        const campaignRecipient = await prisma.campaignRecipient.findFirst({
          where: { messageId: message.id }
        });

        if (campaignRecipient) {
          const newStatus = status.toUpperCase(); // DELIVERED, READ
          await prisma.campaignRecipient.update({
            where: { id: campaignRecipient.id },
            data: { status: newStatus }
          });

          // Incrémenter les compteurs de la campagne
          if (newStatus === 'DELIVERED') {
            await prisma.campaign.update({
              where: { id: campaignRecipient.campaignId },
              data: { deliveredCount: { increment: 1 } }
            });
          } else if (newStatus === 'READ') {
            await prisma.campaign.update({
              where: { id: campaignRecipient.campaignId },
              data: { readCount: { increment: 1 } }
            });
          }
          console.log(`[Campagne] Statut ${newStatus} mis à jour pour le message ${message.id}`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[/api/webhooks/whatsapp] Erreur:", error);
    // Telnyx attend un 200 même s'il y a eu une erreur interne pour éviter les redondances infinies (retries)
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
