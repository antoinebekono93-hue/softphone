import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Les webhooks email (SendGrid Inbound Parse / Postmark) envoient souvent du multipart/form-data
    // Pour simplifier l'exemple, nous allons extraire le JSON ou le form data selon le content-type
    
    let fromEmail = "";
    let textBody = "";
    let toEmail = "";
    let messageId = `email_${Date.now()}`;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      fromEmail = formData.get("from")?.toString() || "";
      toEmail = formData.get("to")?.toString() || "";
      textBody = formData.get("text")?.toString() || formData.get("text/plain")?.toString() || "";
      messageId = formData.get("Message-Id")?.toString() || messageId;
    } else {
      const payload = await req.json();
      fromEmail = payload.From || payload.from || "";
      toEmail = payload.To || payload.to || "";
      textBody = payload.TextBody || payload.text || "";
      messageId = payload.MessageID || payload.messageId || messageId;
    }

    if (!fromEmail || !textBody) {
       return NextResponse.json({ success: true, warning: "Missing fields" });
    }

    // Nettoyage de l'email (ex: "John Doe <john@doe.com>" -> "john@doe.com")
    const cleanEmail = fromEmail.match(/<(.+)>/)?.[1] || fromEmail;

    // 1. Trouver l'organisation (En B2B, chaque organisation pourrait avoir un alias email ex: contact@org.antigravity.com)
    // Ici on associe au premier compte pour l'exemple
    const waAccount = await prisma.whatsAppAccount.findFirst();

    if (waAccount) {
      // 2. Trouver ou Créer le contact via l'email
      const contact = await prisma.contact.upsert({
        where: { id: "temp_email_upsert" },
        update: {},
        create: {
          organizationId: waAccount.organizationId,
          phone: `EMAIL_${cleanEmail}`, // Fallback obligatoire
          email: cleanEmail,
          name: fromEmail.split("<")[0].trim() || cleanEmail
        }
      }).catch(async () => {
         let c = await prisma.contact.findFirst({
           where: { email: cleanEmail, organizationId: waAccount.organizationId }
         });
         if (!c) {
           c = await prisma.contact.create({
             data: {
               organizationId: waAccount.organizationId,
               phone: `EMAIL_${cleanEmail}`,
               email: cleanEmail,
               name: cleanEmail
             }
           });
         }
         return c;
      });

      // 3. Sauvegarder le message avec le type EMAIL
      await prisma.smsMessage.create({
        data: {
          telnyxMessageId: messageId,
          direction: "INBOUND",
          body: textBody.substring(0, 5000), // Limite de taille pour la BD
          status: "DELIVERED",
          type: "EMAIL", // <-- Le canal
          fromNumber: cleanEmail,
          toNumber: toEmail,
          organizationId: waAccount.organizationId,
          contactId: contact.id,
        }
      });

      console.log(`[Email] Message de ${cleanEmail} enregistré dans l'Inbox.`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Email Webhook Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
