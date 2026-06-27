import { NextResponse } from "next/server";
// @ts-ignore
import Telnyx from "telnyx";

const telnyx = new Telnyx(process.env.TELNYX_API_KEY as string);

export async function POST(req: Request) {
  try {
    const event = await req.json();

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

    // Telnyx requires a 200 OK response to acknowledge receipt of the webhook
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing Telnyx Webhook:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
