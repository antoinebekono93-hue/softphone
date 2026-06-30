import { NextResponse } from "next/server";
import { telnyx } from "@/lib/telnyx";
import { prisma } from "@/lib/prisma";

// Keep track of gathering states temporarily in memory (For production, use Redis or a DB table)

async function processEvent(event: any) {
  try {
    console.log("Telnyx Webhook Event received:", event?.data?.event_type);

    // Make sure it's a Call Control event
    if (event?.data?.event_type === "call.initiated") {
      const callControlId = event.data.payload.call_control_id;
      const direction = event.data.payload.direction;

      if (direction === "incoming") {
        // Answering the incoming call to play audio or bridge
        const call = new telnyx.Call({ call_control_id: callControlId });
        await call.answer();
        
        // In a real app, you would look up the WebRTC SIP URI of the specific user
        // For now, we bridge/dial the default SIP connection assigned to the organization
        // The SIP connection ID is where our frontend WebRTC client is registered
        const sipConnectionId = process.env.TELNYX_SIP_CONNECTION_ID;
        
        if (sipConnectionId) {
            // Dial out to the WebRTC SIP Connection to ring the Softphone
            // We use the SIP connection ID as the destination via the 'connection_id' parameter
            await telnyx.calls.create({
                connection_id: sipConnectionId,
                to: "sip:softphone@sip.telnyx.com", // This will ring any WebRTC client registered to this connection
                from: event.data.payload.from,
            });
            
            // NOTE: When the second leg connects (call.answered event), we would bridge them together.
            // For simplicity in this demo route, we just dial the SIP connection.
        }
      }
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
        event = telnyx.webhooks.constructEvent(rawBody, signature, timestamp, publicKey);
      } catch (err: any) {
        console.error('[Telnyx Webhook] Signature verification failed:', err.message);
        return new NextResponse('Invalid signature', { status: 400 });
      }
    } else {
      // Fallback if public key is not configured (e.g. local dev)
      console.warn('[Telnyx Webhook] No signature verification performed (missing headers or PUBLIC_KEY)');
      event = JSON.parse(rawBody);
    }

    // Run async to return 200 OK fast
    processEvent(event).catch(console.error);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing Telnyx Webhook:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
