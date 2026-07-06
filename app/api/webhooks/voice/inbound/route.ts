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
            telnyxCallControlId: callControlId,
            direction: "INBOUND",
            fromNumber: fromNumber,
            toNumber: toNumber,
            organizationId: account.organizationId,
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
        // Fetch contact to get Agentic Memory
        const contact = await prisma.contact.findFirst({
          where: { phone: fromNumber, organizationId: account.organizationId }
        });

        // [Phase 1 & 2] Fetch Context Engine and Agentic Memory
        const { getSessionContext } = await import('@/lib/context-engine');
        const sessionCtx = await getSessionContext(callControlId);
        
        let contextText = "";
        if (contact && contact.aiSummary) {
          // Décrypter ou lire les faits extraits s'ils sont lisibles
          contextText = `Context Client (Agentic Memory): ${contact.aiSummary}`;
        }

        // [Phase 3] Framework Nomi & Silence Tactique
        const systemPrompt = `Tu es ${aiAgent.name}, un expert en vente. 
Applique le Framework NOMI (Valider, Isoler, Recadrer) en cas d'objection.
Si objection prix : "Je comprends que le budget soit une priorité. Si ce n'était pas le cas, est-ce la solution choisie ?"
Si objection timing : "Généralement, on repousse quand il y a d'autres incendies. Qu'est-ce qui changera au prochain trimestre ?"
Voici ton instruction de base : ${aiAgent.prompt}.
${contextText}`;

        // Sauvegarder le prompt dans la session Redis
        const { setSessionContext } = await import('@/lib/context-engine');
        await setSessionContext(callControlId, { prompt: systemPrompt, contactId: contact?.id }, 3600);

        const apiKey = process.env.TELNYX_API_KEY;
        
        // Au lieu d'un simple "speak", on lance une collecte vocale (Gather) avec un délai de silence de 3-5 secondes.
        // Cela permet d'appliquer la règle du "Silence Tactique" et d'attendre que le client se révèle.
        await fetch(`https://api.telnyx.com/v2/calls/${callControlId}/actions/gather_using_speak`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            payload: aiAgent.greeting || `Bonjour, je suis ${aiAgent.name}. Comment puis-je vous aider aujourd'hui ?`,
            voice: aiAgent.voice || "Polly.Mathieu-Neural",
            language: aiAgent.language || "fr-FR",
            maximum_tries: 1,
            timeout_millis: 60000,
            // [Silence Tactique] Laisser le client parler même après une courte pause (ici 3000ms = 3s à 5s)
            maximum_silence_millis: 4000,
            client_state: Buffer.from(JSON.stringify({ step: "gathering", callId: callControlId })).toString('base64')
          })
        });
      } else {
        // Pas d'IA, on diffuse un message par défaut
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
