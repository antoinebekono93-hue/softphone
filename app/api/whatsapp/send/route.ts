import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { toNumber, body } = await req.json();

    if (!toNumber || !body) {
      return NextResponse.json({ error: "Numéro de destination ou texte manquant" }, { status: 400 });
    }

    // 1. Récupération de l'organisation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: "Aucune organisation trouvée" }, { status: 400 });
    }

    // 2. Récupération des accès WhatsApp de l'organisation
    const waAccount = await prisma.whatsAppAccount.findUnique({
      where: { organizationId: user.organizationId },
    });

    if (!waAccount || !waAccount.phoneNumber) {
      return NextResponse.json({ error: "Aucun compte WhatsApp associé" }, { status: 400 });
    }

    // 3. Appel de l'API Telnyx pour envoyer le message
    // On utilise la clé API Telnyx globale (ou celle de l'organisation si BYOK)
    const telnyxApiKey = process.env.TELNYX_API_KEY;
    
    // Note: Dans un environnement réel avec un numéro WhatsApp enregistré sur Telnyx :
    /*
    const response = await fetch("https://api.telnyx.com/v2/messages/whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${telnyxApiKey}`
      },
      body: JSON.stringify({
        from: waAccount.phoneNumber, // Le numéro enregistré via l'Embedded Signup
        to: toNumber,
        text: { body: body }
      })
    });
    const result = await response.json();
    */

    // Simulation de l'ID Telnyx pour la démo
    const mockTelnyxMessageId = `msg_${Math.random().toString(36).substring(7)}`;

    // 4. Trouver ou créer le contact
    const contact = await prisma.contact.upsert({
      where: { 
        organizationId_phone: {
          organizationId: user.organizationId,
          phone: toNumber
        }
      },
      update: {},
      create: {
        organizationId: user.organizationId,
        phone: toNumber,
        name: "Client Inconnu",
      }
    });

    // 5. Sauvegarder dans la DB
    const smsMessage = await prisma.smsMessage.create({
      data: {
        telnyxMessageId: mockTelnyxMessageId,
        direction: "OUTBOUND",
        body: body,
        status: "IN_FLIGHT",
        type: "WHATSAPP",
        fromNumber: waAccount.phoneNumber,
        toNumber: toNumber,
        organizationId: user.organizationId,
        contactId: contact.id,
      }
    });

    return NextResponse.json({ success: true, message: smsMessage });
  } catch (error: any) {
    console.error("[/api/whatsapp/send] Erreur:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi du message" }, { status: 500 });
  }
}
