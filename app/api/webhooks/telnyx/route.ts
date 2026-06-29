import { NextResponse } from 'next/server';
import { telnyx } from '@/lib/telnyx';
import { prisma } from '@/lib/prisma';

// We need the media server URL. Ideally, it's wss://our-domain/media
const MEDIA_SERVER_URL = process.env.MEDIA_SERVER_URL || 'wss://your-ngrok-domain.ngrok-free.app/media';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const event = payload.data;

    if (!event || !event.event_type) {
      return new NextResponse('Invalid payload', { status: 400 });
    }

    const callControlId = event.payload.call_control_id;
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
            await call.answer();
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

      await prisma.callLog.update({
        where: { telnyxCallControlId: callControlId },
        data: {
          status: 'COMPLETED',
          endedAt: ended,
          duration,
          transcriptionText: mockTranscription,
          aiSummary: mockSummary
        }
      });
    }

    // Handle incoming SMS/MMS messages
    else if (eventType === 'message.received') {
      const fromNumber = event.payload.from.phone_number;
      const toArray = event.payload.to;
      const toNumber = toArray && toArray.length > 0 ? toArray[0].phone_number : null;
      const text = event.payload.text;
      const messageId = event.payload.id;

      console.log(`[Telnyx Webhook] SMS Received from ${fromNumber} to ${toNumber}`);

      if (toNumber) {
        const phoneNumber = await prisma.phoneNumber.findUnique({
          where: { number: toNumber }
        });

        if (phoneNumber) {
          await prisma.smsMessage.create({
            data: {
              telnyxMessageId: messageId,
              direction: 'INBOUND',
              body: text,
              fromNumber: fromNumber,
              toNumber: toNumber,
              organizationId: phoneNumber.organizationId,
              phoneNumberId: phoneNumber.id,
              status: 'DELIVERED'
            }
          });
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('[Telnyx Webhook Error]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
