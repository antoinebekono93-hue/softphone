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
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[/api/webhooks/whatsapp] Erreur:", error);
    // Telnyx attend un 200 même s'il y a eu une erreur interne pour éviter les redondances infinies (retries)
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
