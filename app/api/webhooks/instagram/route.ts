import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "antigravity_secret_token";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[Webhook Instagram Reçu]", JSON.stringify(payload, null, 2));

    if (payload.object === "instagram") {
      for (const entry of payload.entry) {
        // IG Business Account ID
        const igAccountId = entry.id;

        for (const messagingEvent of entry.messaging) {
          const senderId = messagingEvent.sender.id;
          const text = messagingEvent.message?.text;
          const mid = messagingEvent.message?.mid;

          if (text && senderId && mid) {
            // Trouver le SocialAccount lié à ce compte Instagram
            const socialAccount = await prisma.socialAccount.findFirst({
              where: { accountId: igAccountId, provider: "INSTAGRAM", status: "ACTIVE" }
            });

            if (socialAccount) {
              // 2. Trouver ou créer le contact via instagramId
              const contact = await prisma.contact.upsert({
                where: { 
                  // On simule une clé unique sur IG. Prisma n'a pas @unique sur instagramId + org, 
                  // donc on cherche le premier
                  id: "temp_ig_upsert" 
                },
                update: {},
                create: {
                  organizationId: socialAccount.organizationId,
                  phone: `IG_${senderId}`, // Fallback car le tel est obligatoire
                  instagramId: senderId,
                  name: `Utilisateur Instagram (${senderId})`
                }
              }).catch(async () => {
                 // Fallback manuel si upsert fail à cause de la clé
                 let c = await prisma.contact.findFirst({
                   where: { instagramId: senderId, organizationId: socialAccount.organizationId }
                 });
                 if (!c) {
                   c = await prisma.contact.create({
                     data: {
                       organizationId: socialAccount.organizationId,
                       phone: `IG_${senderId}`,
                       instagramId: senderId,
                       name: `Utilisateur Instagram (${senderId})`
                     }
                   });
                 }
                 return c;
              });

              // 3. Sauvegarder le message
              await prisma.smsMessage.create({
                data: {
                  telnyxMessageId: mid, // On utilise le mid d'Instagram
                  direction: "INBOUND",
                  body: text,
                  status: "DELIVERED",
                  type: "INSTAGRAM", // <-- Le canal
                  fromNumber: senderId, // On met l'ID Instagram
                  toNumber: igAccountId,
                  organizationId: socialAccount.organizationId,
                  contactId: contact.id,
                }
              });

              console.log(`[Instagram] Message de ${senderId} enregistré.`);
            }
          }
        }
      }
      return NextResponse.json({ success: true });
    }

    return new NextResponse("Not Found", { status: 404 });
  } catch (error: any) {
    console.error("[Instagram Webhook Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
