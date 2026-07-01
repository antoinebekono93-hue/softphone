import { NextResponse } from 'next/server';
import { telnyx } from '@/lib/telnyx';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// We need the media server URL. Ideally, it's wss://our-domain/media
const MEDIA_SERVER_URL = process.env.MEDIA_SERVER_URL || 'wss://your-ngrok-domain.ngrok-free.app/media';

async function processEvent(event: any) {
  try {
    if (!event || !event.event_type) return;

    const callControlId = event.payload?.call_control_id;
    const eventType = event.event_type;

    if (eventType === 'call.initiated') {
      const direction = event.payload.direction; // 'incoming' or 'outgoing'
      const to = event.payload.to;
      const from = event.payload.from;

      console.log(`[Telnyx Webhook] Call Initiated from ${from} to ${to}`);

      // Log the call in DB
      // First, find the organization that owns the 'to' number (if incoming)
      if (direction === 'incoming') {
        const phoneNumber = await prisma.phoneNumber.findUnique({
          where: { number: to },
          include: { voiceAIAgent: true }
        });

        if (phoneNumber) {
          await prisma.callLog.create({
            data: {
              telnyxCallControlId: callControlId,
              direction: 'INBOUND',
              fromNumber: from,
              toNumber: to,
              organizationId: phoneNumber.organizationId,
              phoneNumberId: phoneNumber.id,
              status: 'INITIATED'
            }
          });

          // If there is an active AI Agent assigned to this number, take over the call
          if (phoneNumber.voiceAIAgent && phoneNumber.voiceAIAgent.isActive) {
            const call = new telnyx.Call({ call_control_id: callControlId });
            await call.answer({ command_id: crypto.randomUUID() });
          }
          // If no AI agent, do nothing here. Telnyx will natively ring the SIP connection 
          // associated with this number (WebRTC softphone).
        }
      }
    }

    else if (eventType === 'call.answered') {
      console.log(`[Telnyx Webhook] Call Answered: ${callControlId}`);
      
      // Fetch the call log to see if this call has an AI Agent assigned
      const callLog = await prisma.callLog.findUnique({
        where: { telnyxCallControlId: callControlId },
        include: { phoneNumber: { include: { voiceAIAgent: true } } }
      });

      const agent = callLog?.phoneNumber?.voiceAIAgent;

      // Only start streaming if there's an active AI Agent
      if (agent && agent.isActive) {
        // Start streaming audio to our WebSocket server
        const call = new telnyx.Call({ call_control_id: callControlId });
        
        const clientState = {
          callControlId,
          agentPrompt: agent.prompt,
          agentVoice: agent.voice
        };

        // The custom_parameters can be passed to our WS server to identify the call
        await call.streaming_start({
          command_id: crypto.randomUUID(),
          stream_url: MEDIA_SERVER_URL,
          stream_track: 'both_tracks', // Send both inbound and outbound audio
          client_state: Buffer.from(JSON.stringify(clientState)).toString('base64')
        });
      }

      await prisma.callLog.update({
        where: { telnyxCallControlId: callControlId },
        data: {
          status: 'IN_PROGRESS',
          answeredAt: new Date()
        }
      });
    }

    else if (eventType === 'call.hangup') {
      console.log(`[Telnyx Webhook] Call Hangup: ${callControlId}`);
      
      // Generate AI summary for the CRM
      const mockTranscription = "Le client est très intéressé par nos offres. Il souhaite un devis la semaine prochaine pour 50 licences.";
      const mockSummary = "Intérêt fort validé. Action requise: envoyer un devis pour 50 licences semaine pro.";

      const ended = new Date();
      const callLog = await prisma.callLog.findUnique({ where: { telnyxCallControlId: callControlId } });
      
      let duration = 0;
      if (callLog?.answeredAt) {
        duration = Math.round((ended.getTime() - callLog.answeredAt.getTime()) / 1000);
      }

      const finalStatus = (duration === 0 || !callLog?.answeredAt) ? 'NO_ANSWER' : 'COMPLETED';

      const hangupCause = event.payload?.hangup_cause || null;
      const sipHangupCause = event.payload?.sip_hangup_cause || null;
      let mosScore = null;
      if (event.payload?.call_quality_stats?.inbound?.mos) {
        mosScore = parseFloat(event.payload.call_quality_stats.inbound.mos);
      }

      await prisma.callLog.update({
        where: { telnyxCallControlId: callControlId },
        data: {
          status: finalStatus,
          endedAt: ended,
          duration,
          hangupCause,
          sipHangupCause,
          mosScore,
          transcriptionText: duration > 0 ? mockTranscription : null,
          aiSummary: duration > 0 ? mockSummary : null
        }
      });

      // --- PHASE 2: LEAD SCORING & SENTIMENT ---
      if (duration > 0 && callLog?.contactId) {
        // Mocking AI analysis
        const mockLeadScore = Math.floor(Math.random() * 41) + 50; // Score between 50 and 90
        const mockSentiment = mockLeadScore > 75 ? 'POSITIVE' : (mockLeadScore < 60 ? 'NEGATIVE' : 'NEUTRAL');
        
        await prisma.contact.update({
          where: { id: callLog.contactId },
          data: {
            leadScore: mockLeadScore,
            sentiment: mockSentiment
          }
        });
        console.log(`[AI] Updated Contact ${callLog.contactId} - Score: ${mockLeadScore}, Sentiment: ${mockSentiment}`);
      }

      // --- AUTOMATION BRIDGE : NO_ANSWER_AI ---
      if (finalStatus === 'NO_ANSWER' && callLog?.contactId && callLog?.phoneNumberId) {
        const phoneNumber = await prisma.phoneNumber.findUnique({
          where: { id: callLog.phoneNumberId },
          include: { voiceAIAgent: true }
        });

        if (phoneNumber?.voiceAIAgent) {
          const rule = await prisma.automationRule.findFirst({
            where: {
              organizationId: callLog.organizationId,
              triggerType: 'NO_ANSWER_AI',
              isActive: true
            }
          });

          if (rule && rule.actionType === 'ADD_TO_CAMPAIGN') {
            try {
              const payload = JSON.parse(rule.actionPayload);
              if (payload.campaignId) {
                await prisma.campaignRecipient.upsert({
                  where: {
                    campaignId_contactId: {
                      campaignId: payload.campaignId,
                      contactId: callLog.contactId
                    }
                  },
                  create: {
                    campaignId: payload.campaignId,
                    contactId: callLog.contactId,
                    status: 'PENDING'
                  },
                  update: {}
                });
                console.log(`[Automation] Added contact ${callLog.contactId} to campaign ${payload.campaignId}`);
              }
            } catch (e) {
              console.error("[Automation Error]", e);
            }
          }
        }
      }
    }

    else if (eventType === 'call.recording.saved') {
      const callControlId = event.payload.call_control_id;
      const recordingUrls = event.payload.recording_urls;
      const url = recordingUrls?.wav || recordingUrls?.mp3;
      if (url) {
        await prisma.callLog.update({
          where: { telnyxCallControlId: callControlId },
          data: { recordingUrl: url }
        });
        console.log(`[Telnyx Webhook] Recording saved for ${callControlId}`);
      }
    }

    else if (eventType === 'call.transcription') {
      const callControlId = event.payload.call_control_id;
      const transcript = event.payload.transcription_data?.transcript;
      if (transcript) {
        // Append transcript in case there are multiple chunks
        const existingCall = await prisma.callLog.findUnique({
          where: { telnyxCallControlId: callControlId },
          select: { transcriptionText: true }
        });
        const newText = existingCall?.transcriptionText 
          ? existingCall.transcriptionText + '\n' + transcript 
          : transcript;
          
        await prisma.callLog.update({
          where: { telnyxCallControlId: callControlId },
          data: { transcriptionText: newText }
        });
        console.log(`[Telnyx Webhook] Transcription appended for ${callControlId}`);
      }
    }

    else if (eventType === 'call.machine.premium.detection.ended') {
      const callControlId = event.payload.call_control_id;
      const result = event.payload.result;
      if (result) {
        await prisma.callLog.update({
          where: { telnyxCallControlId: callControlId },
          data: { amdResult: result }
        });
        console.log(`[Telnyx Webhook] AMD Result for ${callControlId}: ${result}`);
      }
    }

    else if (eventType === 'call.conversation_insights.generated') {
      const callControlId = event.payload.call_control_id;
      const summary = event.payload.insights?.summary;
      if (summary) {
        await prisma.callLog.update({
          where: { telnyxCallControlId: callControlId },
          data: { aiSummary: summary }
        });
        console.log(`[Telnyx Webhook] AI Summary saved for ${callControlId}`);
      }
    }

    else if (eventType === 'call.conversation.ended') {
      const callControlId = event.payload.call_control_id;
      const reason = event.payload.reason;
      console.log(`[Telnyx Webhook] AI Conversation ended for ${callControlId} (Reason: ${reason})`);
    }

    // Handle incoming SMS/MMS messages
    else if (eventType === 'message.received') {
      const fromNumber = typeof event.payload.from === 'string' ? event.payload.from : event.payload.from?.phone_number;
      const toArray = event.payload.to;
      let toNumber = null;
      if (typeof toArray === 'string') {
        toNumber = toArray;
      } else if (Array.isArray(toArray) && toArray.length > 0) {
        toNumber = typeof toArray[0] === 'string' ? toArray[0] : toArray[0].phone_number;
      }

      const text = event.payload.text || event.payload.postback_data || '';
      const messageId = event.payload.id;
      const media = event.payload.media || [];
      const mediaUrls = media.map((m: any) => m.url);
      
      let msgType = mediaUrls.length > 0 ? 'MMS' : 'SMS';
      if (event.payload.type === 'whatsapp') {
        msgType = 'WHATSAPP';
      } else if (event.payload.type === 'RCS' || event.payload.type === 'rcs') {
        msgType = 'RCS';
      }

      console.log(`[Telnyx Webhook] ${msgType} Received from ${fromNumber} to ${toNumber}`);

      if (toNumber) {
        const phoneNumber = await prisma.phoneNumber.findUnique({
          where: { number: toNumber }
        });

        if (phoneNumber) {
          const smsMessage = await prisma.smsMessage.create({
            data: {
              telnyxMessageId: messageId,
              direction: 'INBOUND',
              body: text || '',
              fromNumber: fromNumber,
              toNumber: toNumber,
              organizationId: phoneNumber.organizationId,
              phoneNumberId: phoneNumber.id,
              status: 'DELIVERED',
              type: msgType,
              mediaUrls: mediaUrls
            }
          });

          // Try to link to contact
          const contact = await prisma.contact.findFirst({
            where: {
              organizationId: phoneNumber.organizationId,
              phone: fromNumber
            }
          });

          if (contact) {
            await prisma.smsMessage.update({
              where: { id: smsMessage.id },
              data: { contactId: contact.id }
            });
          }
        }
      }
    }

    // Handle outbound message updates
    else if (eventType === 'message.sent') {
      const messageId = event.payload.id;
      console.log(`[Telnyx Webhook] Message ${messageId} sent to carrier`);
      await prisma.smsMessage.updateMany({
        where: { telnyxMessageId: messageId },
        data: { status: 'SENT' }
      });
    }

    else if (eventType === 'message.finalized') {
      const messageId = event.payload.id;
      const toArray = event.payload.to;
      const status = toArray && toArray.length > 0 ? toArray[0].status : null; // 'delivered' or 'delivery_failed'
      const cost = event.payload.cost?.amount ? parseFloat(event.payload.cost.amount) : 0;
      
      console.log(`[Telnyx Webhook] Message ${messageId} finalized with status: ${status}`);
      
      await prisma.smsMessage.updateMany({
        where: { telnyxMessageId: messageId },
        data: { 
          status: status === 'delivered' ? 'DELIVERED' : (status === 'delivery_failed' ? 'FAILED' : 'FINALIZED'),
          cost: cost
        }
      });
    }
  } catch (error: any) {
    console.error('[Telnyx Webhook Async Error]', error);
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let event;

    const signature = req.headers.get('telnyx-signature-ed25519');
    const timestamp = req.headers.get('telnyx-timestamp');
    const publicKey = process.env.TELNYX_PUBLIC_KEY;

    if (signature && timestamp && publicKey) {
      try {
        event = telnyx.webhooks.constructEvent(rawBody, signature, timestamp, publicKey).data;
      } catch (err: any) {
        console.error('[Telnyx Webhook] Signature verification failed:', err.message);
        return new NextResponse('Invalid signature', { status: 400 });
      }
    } else {
      // Fallback if public key is not configured (e.g. local dev)
      console.warn('[Telnyx Webhook] No signature verification performed (missing headers or PUBLIC_KEY)');
      event = JSON.parse(rawBody).data;
    }

    // Run async to return 200 OK fast
    processEvent(event).catch(console.error);

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('[Telnyx Webhook Error]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
