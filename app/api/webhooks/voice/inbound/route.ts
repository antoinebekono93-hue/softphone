import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Webhook for Telnyx Call Control API
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[Voice Webhook Reçu]", JSON.stringify(payload, null, 2));

    const eventData = payload?.data;
    if (!eventData) return NextResponse.json({ success: true });

    const eventType = eventData.event_type;
    const callControlId = eventData.payload?.call_control_id;
    const fromNumber = eventData.payload?.from;
    const toNumber = eventData.payload?.to;

    if (!callControlId) return NextResponse.json({ success: true });

    // 1. Trouver le compte WhatsApp/Voice associé au numéro
    const account = await prisma.whatsAppAccount.findFirst({
      where: { phoneNumber: toNumber } // On suppose que le même numéro sert pour le vocal
    });

    if (!account) return NextResponse.json({ success: true });

    // 2. Gestion de l'état de l'appel
    if (eventType === "call.initiated") {
      // Étape A : L'appel arrive, on décroche
      console.log(`[Voice] Appel entrant de ${fromNumber}. Décrochage...`);
      
      const apiKey = process.env.TELNYX_API_KEY;
      await fetch(`https://api.telnyx.com/v2/calls/${callControlId}/actions/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_state: Buffer.from(JSON.stringify({ step: "answered" })).toString('base64')
        })
      });

      // Mettre à jour le CRM (Log de l'appel)
      const contact = await prisma.contact.findFirst({
        where: { phone: fromNumber, organizationId: account.organizationId }
      });

      if (contact) {
        await prisma.callLog.create({
          data: {
            duration: 0,
            status: "IN_PROGRESS",
            contactId: contact.id
          }
        });
      }

    } else if (eventType === "call.answered") {
      // Étape B : L'appel est décroché, on connecte l'Agent IA Vocal
      console.log(`[Voice] Appel ${callControlId} répondu. Connexion à l'IA Vocale...`);
      
      const aiAgent = await prisma.voiceAIAgent.findFirst({
        where: { organizationId: account.organizationId, isActive: true }
      });

      if (aiAgent) {
        // Dans une intégration réelle (ex: Bland AI, Vapi, ou Telnyx TexML), 
        // on ferait un pont (Bridge) vers le serveur WebSocket de l'IA.
        // Ici on simule une synthèse vocale (Speak) d'accueil.
        const apiKey = process.env.TELNYX_API_KEY;
        await fetch(`https://api.telnyx.com/v2/calls/${callControlId}/actions/speak`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            payload: `Bonjour, je suis ${aiAgent.name}, l'assistant vocal de la société. Comment puis-je vous aider aujourd'hui ?`,
            voice: aiAgent.voiceId || "Polly.Mathieu-Neural",
            language: "fr-FR"
          })
        });
      } else {
        // Pas d'IA, on diffuse un message par défaut puis on raccroche ou on transfère
        const apiKey = process.env.TELNYX_API_KEY;
        await fetch(`https://api.telnyx.com/v2/calls/${callControlId}/actions/speak`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            payload: "Bonjour, tous nos conseillers sont actuellement occupés. Veuillez nous laisser un message.",
            voice: "Polly.Mathieu-Neural",
            language: "fr-FR"
          })
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Voice Webhook Error]", error);
    return NextResponse.json({ success: false }, { status: 200 }); // 200 pour éviter les retries Telnyx
  }
}
