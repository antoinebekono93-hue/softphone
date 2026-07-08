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

    } else if (eventType === "call.machine.premium.detection.ended" || eventType === "call.machine.detection.ended") {
      const result = eventData.payload?.result;
      console.log(`[Voice] AMD Result for ${callControlId}: ${result}`);
      
      // Si c'est un répondeur ("machine"), on raccroche immédiatement selon les instructions du CEO
      if (result === "machine") {
         const apiKey = process.env.TELNYX_API_KEY;
         await fetch(`https://api.telnyx.com/v2/calls/${callControlId}/actions/hangup`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` }
         });

         // Update Contact if this was a campaign
         // We would need to extract CampaignContactId from client_state
         let clientState: any = {};
         if (eventData.payload.client_state) {
            clientState = JSON.parse(Buffer.from(eventData.payload.client_state, 'base64').toString('utf-8'));
         }
         if (clientState.contactId) {
            await prisma.campaignContact.update({
               where: { id: clientState.contactId },
               data: { status: "VOICEMAIL" }
            });
         }
      }
    } else if (eventType === "call.answered") {
      console.log(`[Voice] Appel ${callControlId} répondu. Connexion au WebSocket Media Server...`);
      
      // Récupérer le contexte (Campagne Outbound ou Agent Inbound)
      let clientState: any = {};
      if (eventData.payload?.client_state) {
        clientState = JSON.parse(Buffer.from(eventData.payload.client_state, 'base64').toString('utf-8'));
      }

      let agentPrompt = "Tu es un assistant IA très utile et chaleureux.";
      let agentVoice = "alloy";

      // Si Outbound Campaign
      if (clientState.campaignId) {
         agentPrompt = clientState.agentPrompt || agentPrompt;
         await prisma.campaignContact.update({
            where: { id: clientState.contactId },
            data: { status: "ANSWERED" }
         });
      } else {
         // Inbound: Fetch AI Agent profile
         const aiAgent = await prisma.voiceAIAgent.findFirst({
           where: { organizationId: account?.organizationId }
         });
         if (aiAgent) {
           agentPrompt = aiAgent.prompt;
           agentVoice = "alloy"; // Map to OpenAI voice if needed
         }
      }

      // Connect to WebSocket using TeXML
      const apiKey = process.env.TELNYX_API_KEY;
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://your-domain.com/media";
      
      // Update client_state to pass to WebSocket
      const newClientState = Buffer.from(JSON.stringify({ 
        callControlId,
        agentPrompt,
        agentVoice,
        organizationId: account?.organizationId
      })).toString('base64');

      const texml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="${wsUrl}" />
    </Connect>
</Response>`;

      // Telnyx does not have a direct TeXML injection via actions/answer, but we can use actions/texml
      // Alternatively, we send the stream command directly using API V2
      await fetch(`https://api.telnyx.com/v2/calls/${callControlId}/actions/playback_start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            audio_url: "https://example.com/silence.mp3", // Dummy just to keep connection while streaming
            client_state: newClientState
          })
      });

      // Start Stream
      await fetch(`https://api.telnyx.com/v2/calls/${callControlId}/actions/streaming_start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stream_url: wsUrl,
          client_state: newClientState
        })
      });

    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Voice Webhook Error]", error);
    return NextResponse.json({ success: false }, { status: 200 }); // 200 pour éviter les retries Telnyx
  }
}
