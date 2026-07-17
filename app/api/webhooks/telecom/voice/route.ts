import { NextResponse } from "next/server";
import { telnyx } from "@/lib/telnyx";
import { prisma } from "@/lib/prisma";
import crypto from 'crypto';

async function processEvent(event: any) {
  try {
    const eventType = event?.data?.event_type;
    const payload = event?.data?.payload;
    if (!eventType || !payload) return;
    
    console.log(`[Voice Webhook] ${eventType} - CallControlId: ${payload.call_control_id}`);
    
    // Parse client_state if exists
    let clientState: any = {};
    if (payload.client_state) {
        try {
            clientState = JSON.parse(Buffer.from(payload.client_state, 'base64').toString('utf-8'));
        } catch (e) {}
    }

    const call = new telnyx.Call({ call_control_id: payload.call_control_id });
    
    let orgId: string | undefined;
    const ourNumber = payload.direction === "incoming" ? payload.to : payload.from;
    
    // Clean up SIP formatting if necessary
    let cleanNumber = ourNumber;
    if (cleanNumber && cleanNumber.startsWith('sip:')) {
      cleanNumber = cleanNumber.replace('sip:', '').split('@')[0];
    }

    if (cleanNumber) {
      const phone = await prisma.phoneNumber.findFirst({
        where: { number: cleanNumber }
      });
      if (phone) {
        orgId = phone.organizationId;
      }
    }

    switch (eventType) {
      case "call.initiated":
        if (payload.direction === "incoming") {
          const isFromWebRTC = payload.from.includes('sip:');
          
          // 1. Answer the incoming leg
          await call.answer({ command_id: crypto.randomUUID() });
          
          // 2. Create CallLog entry
          if (orgId) {
              await prisma.callLog.create({
                  data: {
                      telnyxCallControlId: payload.call_control_id,
                      direction: isFromWebRTC ? "OUTBOUND" : "INBOUND",
                      status: "INITIATED",
                      fromNumber: payload.from,
                      toNumber: payload.to,
                      organizationId: orgId,
                  }
              });
          }

          if (isFromWebRTC) {
              // Outbound Dialer (WebRTC -> PSTN)
              const defaultConnId = process.env.TELNYX_SIP_CONNECTION_ID;
              if (defaultConnId) {
                  await telnyx.calls.create({
                      command_id: crypto.randomUUID(),
                      connection_id: defaultConnId,
                      to: payload.to,
                      from: process.env.TELNYX_DEFAULT_OUTBOUND_NUMBER || payload.from.replace('sip:', '').split('@')[0],
                      client_state: Buffer.from(JSON.stringify({ inboundCallControlId: payload.call_control_id })).toString('base64')
                  });
              }
          } else {
              // Inbound CCaaS (PSTN -> WebRTC)
              const sipConnectionId = process.env.TELNYX_SIP_CONNECTION_ID;
              if (sipConnectionId) {
                  await telnyx.calls.create({
                      command_id: crypto.randomUUID(),
                      connection_id: sipConnectionId,
                      to: "sip:softphone@sip.telnyx.com", 
                      from: payload.from,
                      client_state: Buffer.from(JSON.stringify({ inboundCallControlId: payload.call_control_id })).toString('base64')
                  });
              }
          }
        }
        break;

      case "call.answered":
        if (orgId) {
            await prisma.callLog.updateMany({
                where: { telnyxCallControlId: payload.call_control_id },
                data: { status: "IN_PROGRESS", answeredAt: new Date() }
            });
        }
        
        // Bridge the two legs if we have an inboundCallControlId in client_state
        if (clientState && clientState.inboundCallControlId) {
            console.log(`[Voice Webhook] Bridging ${payload.call_control_id} with ${clientState.inboundCallControlId}`);
            await call.bridge({
                command_id: crypto.randomUUID(),
                call_control_id: clientState.inboundCallControlId
            });
        }
        break;

      case "call.bridged":
        console.log(`[Voice Webhook] Call successfully bridged: ${payload.call_control_id}`);
        break;

      case "call.hangup":
        console.log(`[Voice Webhook] Hangup: ${payload.hangup_cause} (SIP: ${payload.sip_hangup_cause})`);
        if (orgId) {
            const now = new Date();
            const callLogs = await prisma.callLog.findMany({ where: { telnyxCallControlId: payload.call_control_id } });
            if (callLogs.length > 0) {
                let duration = 0;
                if (callLogs[0].answeredAt) {
                    duration = Math.floor((now.getTime() - callLogs[0].answeredAt.getTime()) / 1000);
                }
                await prisma.callLog.updateMany({
                    where: { telnyxCallControlId: payload.call_control_id },
                    data: {
                        status: "COMPLETED",
                        endedAt: now,
                        duration: duration,
                        hangupCause: payload.hangup_cause || null,
                        sipHangupCause: payload.sip_hangup_cause || null,
                    }
                });
            }
        }
        break;
        
      default:
        break;
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

    if (!signature || !timestamp || !publicKey) {
      console.error('[Telnyx Webhook] Missing signature headers or PUBLIC_KEY config');
      return new NextResponse('Missing signature headers or configuration', { status: 400 });
    }

    try {
      event = telnyx.webhooks.constructEvent(rawBody, signature, timestamp, publicKey);
    } catch (err: any) {
      console.error('[Telnyx Webhook] Signature verification failed:', err.message);
      return new NextResponse('Invalid signature', { status: 400 });
    }

    // Run async to return 200 OK fast
    processEvent(event).catch(console.error);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing Telnyx Webhook:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
