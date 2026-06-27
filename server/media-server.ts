import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
  let transcriptSegments: { role: string, text: string }[] = [];
  let isProcessingTranscript = false;

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
    // We will initialize the session when we receive the Telnyx 'start' event with the AI Agent context.
  });

  openAiWs.on('message', (data) => {
    const response = JSON.stringify(data.toString()); // Wait, data is Buffer. 
    const msg = JSON.parse(data.toString());

    if (msg.type === 'response.audio.delta' && msg.delta) {
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
        }
      } catch (e) {
        console.error("[Telnyx] Failed to parse custom_parameters", e);
      }

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
            input_audio_transcription: {
              model: "whisper-1"
            }
          }
        }));
        isSessionInitialized = true;
        console.log(`[🧠 OpenAI] Session initialized for Agent Voice: ${agentVoice}`);
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

    if (callControlId && transcriptSegments.length > 0) {
      console.log(`[Transcript] Processing transcript for call ${callControlId}...`);
      const fullTranscript = transcriptSegments.map(s => `${s.role}: ${s.text}`).join('\n');
      
      let aiSummary = null;
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'You are an assistant that summarizes phone call transcripts. Provide a concise, professional summary of the conversation in 2-3 sentences. Identify the main purpose and any action items.' 
              },
              { role: 'user', content: fullTranscript }
            ]
          })
        });
        
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          aiSummary = data.choices[0].message.content;
        }
      } catch (e) {
        console.error('[Transcript] Failed to generate AI summary:', e);
      }

      try {
        await prisma.callLog.update({
          where: { telnyxCallControlId: callControlId },
          data: {
            transcriptionText: fullTranscript,
            aiSummary: aiSummary
          }
        });
        console.log(`[Transcript] Successfully saved transcript & summary for ${callControlId}`);
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
