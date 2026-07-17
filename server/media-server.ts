import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// NOTE: using dynamic import for lib/billing.js in runtime if needed, 
// but since this is TS compiled via tsc, we can just import directly or dynamically inside the handlers.

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in .env.local");
  process.exit(1);
}

const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 Media WebSocket Server listening on ws://localhost:${PORT}/media`);

wss.on('connection', (telnyxWs, req) => {
  console.log(`[☎️ Telnyx connected] ${req.url}`);

  let streamId: string | null = null;
  let callControlId: string | null = null;
  let organizationId: string | null = null;
  let transcriptSegments: { role: string, text: string }[] = [];
  let isProcessingTranscript = false;
  
  let currentItemId: string | null = null;
  let currentContentIndex: number = 0;

  // Disable Nagle's algorithm for incoming Telnyx WS to reduce latency
  if ((telnyxWs as any)._socket) {
    (telnyxWs as any)._socket.setNoDelay(true);
  }

  // Connect to OpenAI Realtime API
  const openAiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Beta": "realtime=v1"
    }
  });

  let isSessionInitialized = false;

  openAiWs.on('open', () => {
    console.log('[🧠 OpenAI connected]');
    // Disable Nagle's algorithm for outgoing OpenAI WS
    if ((openAiWs as any)._socket) {
      (openAiWs as any)._socket.setNoDelay(true);
    }
    // We will initialize the session when we receive the Telnyx 'start' event with the AI Agent context.
  });

  openAiWs.on('message', (data) => {
    const response = JSON.stringify(data.toString()); // Wait, data is Buffer. 
    const msg = JSON.parse(data.toString());

    if (msg.type === 'response.audio.delta' && msg.delta) {
      if (msg.item_id) {
        currentItemId = msg.item_id;
        currentContentIndex = msg.content_index || 0;
      }
      
      // OpenAI sends base64 audio. We send it to Telnyx.
      if (streamId && telnyxWs.readyState === WebSocket.OPEN) {
        telnyxWs.send(JSON.stringify({
          event: 'media',
          stream_id: streamId,
          media: {
            payload: msg.delta
          }
        }));
      }
    }
    
    if (msg.type === 'response.audio_transcript.done' && msg.transcript) {
      console.log(`[AI]: ${msg.transcript}`);
      transcriptSegments.push({ role: 'AI', text: msg.transcript });
    }
    
    if (msg.type === 'conversation.item.input_audio_transcription.completed' && msg.transcript) {
      console.log(`[User]: ${msg.transcript}`);
      transcriptSegments.push({ role: 'User', text: msg.transcript });
    }

    if (msg.type === 'response.function_call_arguments.done') {
      console.log(`[🧠 OpenAI] Function call requested: ${msg.name}`);
      const callId = msg.call_id;
      const args = JSON.parse(msg.arguments);
      
      // We will execute the tool in an async IIFE so we don't block the WebSocket handler
      (async () => {
        try {
          let result = "";
          if (msg.name === 'transfer_to_human') {
            result = JSON.stringify({ success: true, message: "Escalade demandée avec succès." });
            // Here we could trigger a DB update or Pusher event just like in the WhatsApp webhook
          } else if (msg.name === 'verifier_stock') {
            const { verifier_stock } = await import('../lib/tools/transactions.js');
            result = await verifier_stock(args.sku_id);
          } else if (msg.name === 'create_payment_link') {
            const { create_payment_link } = await import('../lib/tools/transactions.js');
            result = await create_payment_link(args.sku_id, args.customer_email);
          } else if (msg.name === 'check_availability') {
            const { check_availability } = await import('../lib/tools/scheduling.js');
            // We stringify the return so OpenAI can read it
            const res = await check_availability(args.date);
            result = JSON.stringify(res);
          } else if (msg.name === 'book_appointment') {
            const { book_appointment } = await import('../lib/tools/scheduling.js');
            const res = await book_appointment(args.date, args.time, args.name, args.phone);
            result = JSON.stringify(res);
          } else if (msg.name === 'generate_quote') {
            const { generate_quote } = await import('../lib/tools/sales.js');
            const res = await generate_quote(organizationId as string, args);
            result = JSON.stringify(res);
          } else if (msg.name === 'generate_invoice') {
            const { generate_invoice } = await import('../lib/tools/sales.js');
            const res = await generate_invoice(organizationId as string, args);
            result = JSON.stringify(res);
          } else if (msg.name === 'create_support_ticket') {
            const { create_support_ticket } = await import('../lib/tools/support.js');
            const res = await create_support_ticket(organizationId as string, args);
            result = JSON.stringify(res);
          } else if (msg.name === 'check_stock_and_price') {
            const { check_stock_and_price } = await import('../lib/tools/inventory.js');
            const res = await check_stock_and_price(organizationId as string, args);
            result = JSON.stringify(res);
          } else {
            result = JSON.stringify({ error: "Unknown function" });
          }

          // Send result back to OpenAI
          if (openAiWs.readyState === WebSocket.OPEN) {
            openAiWs.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: callId,
                output: result
              }
            }));
            // Trigger a response creation so the AI speaks the result
            openAiWs.send(JSON.stringify({ type: 'response.create' }));
          }
        } catch (e: any) {
          console.error(`[Tools] Error executing ${msg.name}:`, e);
          if (openAiWs.readyState === WebSocket.OPEN) {
            openAiWs.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: callId,
                output: JSON.stringify({ error: e.message })
              }
            }));
            openAiWs.send(JSON.stringify({ type: 'response.create' }));
          }
        }
      })();
    }

    if (msg.type === 'input_audio_buffer.speech_started') {
      console.log('[🧠 OpenAI] User started speaking (Barge-in detected)');
      // Clear Telnyx media buffer to stop AI from speaking immediately
      if (streamId && telnyxWs.readyState === WebSocket.OPEN) {
        telnyxWs.send(JSON.stringify({
          event: 'clear_media',
          stream_id: streamId
        }));
        console.log(`[Telnyx] Sent clear_media for stream ${streamId}`);
      }

      // Truncate current item in OpenAI to prevent it from continuing context
      if (currentItemId && openAiWs.readyState === WebSocket.OPEN) {
        openAiWs.send(JSON.stringify({
          type: 'conversation.item.truncate',
          item_id: currentItemId,
          content_index: currentContentIndex,
          audio_end_ms: msg.audio_end_ms || 0
        }));
        console.log(`[🧠 OpenAI] Sent truncate for item ${currentItemId}`);
        currentItemId = null; // Reset
      }
    }
  });

  openAiWs.on('close', () => {
    console.log('[🧠 OpenAI disconnected]');
  });

  // Handle incoming messages from Telnyx
  telnyxWs.on('message', (message) => {
    const msg = JSON.parse(message.toString());

    if (msg.event === 'start') {
      streamId = msg.stream_id || msg.start?.stream_id;
      console.log(`[Telnyx] Stream started: ${streamId}`);

      // Decode client_state
      let agentPrompt = "You are a helpful virtual assistant.";
      let agentVoice = "alloy";
      
      try {
        const customParamsBase64 = msg.start?.custom_parameters;
        if (customParamsBase64) {
          const clientStateStr = Buffer.from(customParamsBase64, 'base64').toString('utf-8');
          const clientState = JSON.parse(clientStateStr);
          if (clientState.callControlId) callControlId = clientState.callControlId;
          if (clientState.agentPrompt) agentPrompt = clientState.agentPrompt;
          if (clientState.agentVoice) agentVoice = clientState.agentVoice;
          if (clientState.organizationId) organizationId = clientState.organizationId;
        }
      } catch (e) {
        console.error("[Telnyx] Failed to parse custom_parameters", e);
      }

      // Record call start time for billing
      const callStartTimeMs = Date.now();
      
      // Store on socket for disconnect handling
      (telnyxWs as any).callStartTimeMs = callStartTimeMs;
      (telnyxWs as any).organizationId = organizationId;

      // TODO: Check if walletBalance > 0 here (could reject the call if not)
      // For now, we will just let it connect and charge at the end, 
      // blocking them on the NEXT call as requested by the CEO.

      // Initialize OpenAI Session dynamically
      if (openAiWs.readyState === WebSocket.OPEN && !isSessionInitialized) {
        openAiWs.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ["text", "audio"],
            instructions: agentPrompt,
            voice: agentVoice,
            input_audio_format: "g711_ulaw",
            output_audio_format: "g711_ulaw",
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            input_audio_transcription: {
              model: "whisper-1"
            },
            tools: [
              {
                type: "function",
                name: "transfer_to_human",
                description: "Transfère l'appel à un humain.",
                parameters: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] }
              },
              {
                type: "function",
                name: "verifier_stock",
                description: "Vérifie le stock d'un produit.",
                parameters: { type: "object", properties: { sku_id: { type: "string" } }, required: ["sku_id"] }
              },
              {
                type: "function",
                name: "create_payment_link",
                description: "Crée un lien de paiement Flutterwave.",
                parameters: { type: "object", properties: { sku_id: { type: "string" } }, required: ["sku_id"] }
              },
              {
                type: "function",
                name: "check_availability",
                description: "Vérifie les disponibilités du calendrier pour une date (YYYY-MM-DD).",
                parameters: { type: "object", properties: { date: { type: "string" } }, required: ["date"] }
              },
              {
                type: "function",
                name: "book_appointment",
                description: "Réserve un créneau dans le calendrier.",
                parameters: { 
                  type: "object", 
                  properties: { 
                    date: { type: "string" },
                    time: { type: "string" },
                    name: { type: "string" },
                    phone: { type: "string" }
                  }, 
                  required: ["date", "time", "name", "phone"] 
                }
              },
              {
                type: "function",
                name: "generate_quote",
                description: "Génère un devis (Quote) pour un client.",
                parameters: {
                  type: "object",
                  properties: {
                    contact_phone: { type: "string" },
                    contact_name: { type: "string" },
                    amount: { type: "number" },
                    description: { type: "string" }
                  },
                  required: ["contact_phone", "amount", "description"]
                }
              },
              {
                type: "function",
                name: "generate_invoice",
                description: "Génère une facture (Invoice) pour un client.",
                parameters: {
                  type: "object",
                  properties: {
                    contact_phone: { type: "string" },
                    contact_name: { type: "string" },
                    amount: { type: "number" },
                    description: { type: "string" }
                  },
                  required: ["contact_phone", "amount", "description"]
                }
              },
              {
                type: "function",
                name: "create_support_ticket",
                description: "Créé un ticket de support technique ou réclamation pour un client.",
                parameters: {
                  type: "object",
                  properties: {
                    contact_phone: { type: "string" },
                    contact_name: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["LOW", "NORMAL", "HIGH", "URGENT"] }
                  },
                  required: ["contact_phone", "title", "description"]
                }
              },
              {
                type: "function",
                name: "check_stock_and_price",
                description: "Recherche un produit dans le catalogue pour vérifier son prix et son niveau de stock.",
                parameters: {
                  type: "object",
                  properties: {
                    product_name: { type: "string" }
                  },
                  required: ["product_name"]
                }
              }
            ],
            tool_choice: "auto"
          }
        }));
        isSessionInitialized = true;
        console.log(`[🧠 OpenAI] Session initialized for Agent Voice: ${agentVoice}`);

        // If it's an outbound campaign call, the AI must speak first
        let isOutbound = false;
        try {
           const customParamsBase64 = msg.start?.custom_parameters;
           if (customParamsBase64) {
             const clientState = JSON.parse(Buffer.from(customParamsBase64, 'base64').toString('utf-8'));
             if (clientState.campaignId) isOutbound = true;
           }
        } catch(e) {}

        if (isOutbound) {
          console.log(`[🧠 OpenAI] Outbound Call detected. Triggering AI to speak first.`);
          // Create an initial response
          openAiWs.send(JSON.stringify({ type: 'response.create' }));
        }
      }
    }

    if (msg.event === 'media' && msg.media?.payload) {
      // Send audio to OpenAI
      if (openAiWs.readyState === WebSocket.OPEN) {
        openAiWs.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: msg.media.payload
        }));
      }
    }

    if (msg.event === 'stop') {
      console.log(`[Telnyx] Stream stopped`);
      if (openAiWs.readyState === WebSocket.OPEN) {
        openAiWs.close();
      }
    }
  });

  const handleCallEnd = async () => {
    if (isProcessingTranscript) return;
    isProcessingTranscript = true;

    // Process Billing
    const startMs = (telnyxWs as any).callStartTimeMs;
    const orgId = (telnyxWs as any).organizationId;
    if (startMs && orgId) {
      const durationMs = Date.now() - startMs;
      const durationMinutes = Math.ceil(durationMs / 60000); // round up to nearest minute
      if (durationMinutes > 0) {
        try {
          const { chargeWallet } = await import('../lib/billing.js');
          // 0.15€ per minute as requested by the CEO
          const amountToCharge = durationMinutes * 0.15;
          await chargeWallet(orgId, amountToCharge, `Facturation de ${durationMinutes} min d'appel IA (WebRTC)`);
          console.log(`[Billing] Charged ${amountToCharge}€ to org ${orgId} for ${durationMinutes} minutes.`);
        } catch (e) {
          console.error(`[Billing] Failed to charge org ${orgId}:`, e);
        }
      }
    }

    if (callControlId && transcriptSegments.length > 0) {
      console.log(`[Transcript] Processing transcript for call ${callControlId}...`);
      const fullTranscript = transcriptSegments.map(s => `${s.role}: ${s.text}`).join('\n');
      
      let aiSummary = null;
      let leadScore = 50;
      let sentiment = 'NEUTRAL';

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: "json_object" },
            messages: [
              { 
                role: 'system', 
                content: `You are an expert sales analyst. Analyze this phone transcript.
Return a JSON object with:
- "summary": a concise, professional summary of the conversation in 2-3 sentences. Identify the main purpose and any action items.
- "leadScore": a number from 0 to 100 indicating how likely they are to buy (0=not interested, 100=ready to buy).
- "sentiment": either "POSITIVE", "NEGATIVE", or "NEUTRAL".`
              },
              { role: 'user', content: fullTranscript }
            ]
          })
        });
        
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          const resultStr = data.choices[0].message.content;
          const result = JSON.parse(resultStr);
          aiSummary = result.summary;
          leadScore = result.leadScore || 50;
          sentiment = result.sentiment || 'NEUTRAL';
        }
      } catch (e) {
        console.error('[Transcript] Failed to generate AI analysis:', e);
      }

      try {
        const updatedCall = await prisma.callLog.update({
          where: { telnyxCallControlId: callControlId },
          data: {
            transcriptionText: fullTranscript,
            transcript: transcriptSegments, // Save as JSON for QA and UI
            aiSummary: aiSummary
          }
        });
        console.log(`[Transcript] Successfully saved transcript & summary for ${callControlId}`);
        
        // Update Contact Lead Score and Sentiment
        if (updatedCall.contactId) {
           await prisma.contact.update({
             where: { id: updatedCall.contactId },
             data: {
               leadScore,
               sentiment
             }
           });
           console.log(`[AI] Updated Contact ${updatedCall.contactId} - Score: ${leadScore}, Sentiment: ${sentiment}`);
           
           // Trigger Automation for Completed Call
           try {
             const contactInfo = await prisma.contact.findUnique({ where: { id: updatedCall.contactId } });
             if (contactInfo) {
               const { executeAutomation } = await import('../lib/automations.js');
               await executeAutomation(updatedCall.organizationId, 'CALL_COMPLETED', { contact: contactInfo });
             }
           } catch (autoErr) {
             console.error("[Automation Error in media-server]", autoErr);
           }
        }

        // Trigger QA Evaluation (Async, without waiting)
        const { evaluateCallQA } = await import('../lib/ai/qa-evaluator.js');
        evaluateCallQA(updatedCall.id).catch(console.error);

      } catch (e) {
        console.error('[Transcript] Failed to update Prisma CallLog:', e);
      }
    }
  };

  telnyxWs.on('close', async () => {
    console.log('[☎️ Telnyx disconnected]');
    if (openAiWs.readyState === WebSocket.OPEN) {
      openAiWs.close();
    }
    await handleCallEnd();
  });
});
