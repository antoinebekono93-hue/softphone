import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    let to = "";
    let from = "";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Fallback if configured as Call Control JSON webhook
      const rawBody = await request.text();
      const signature = request.headers.get('telnyx-signature-ed25519');
      const timestamp = request.headers.get('telnyx-timestamp');
      const publicKey = process.env.TELNYX_PUBLIC_KEY;
      
      let body: any = {};
      if (signature && timestamp && publicKey) {
         try {
            // @ts-ignore (Assuming telnyx.webhooks is imported or available)
            body = require("@/lib/telnyx").telnyx.webhooks.constructEvent(rawBody, signature, timestamp, publicKey);
         } catch (err: any) {
            console.error('[Telnyx Webhook] Signature verification failed:', err.message);
            return new NextResponse('Invalid signature', { status: 400 });
         }
      } else {
         body = JSON.parse(rawBody);
      }
      
      to = body.data?.payload?.to || "";
      from = body.data?.payload?.from || "";
    } else {
      // TeXML Webhook
      const formData = await request.formData().catch(() => null);
      if (formData) {
        to = formData.get("To")?.toString() || "";
        from = formData.get("From")?.toString() || "";
      }
    }

    console.log(`[Webhook] Inbound call from ${from} to ${to}`);

    // 1. Find the Phone Number in our DB to see who it belongs to
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: { number: to },
      include: { aiEmployee: true }
    });

    if (phoneNumber && phoneNumber.aiEmployee && phoneNumber.aiEmployee.isActive) {
      const agent = phoneNumber.aiEmployee;
      console.log(`[Webhook] Call matched AI Agent: ${agent.name}`);

      // Generate TeXML to connect the call to a WebSocket (OpenAI Realtime / Custom AI Server)
      // Option A: Forward to a WebSocket server
      
      // We pass the agent ID in the custom parameters so the WebSocket server knows which prompt to use.
      const texml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://ai.antigravity.io/stream">
      <Parameter name="agentId" value="${agent.id}" />
      <Parameter name="organizationId" value="${agent.organizationId}" />
    </Stream>
  </Connect>
</Response>`;

      return new NextResponse(texml, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    // Fallback if no AI Agent is configured for this number
    // We just ring the SIP connection or play a message.
    const texmlFallback = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Bienvenue. Nous transférons votre appel.</Say>
</Response>`;

    return new NextResponse(texmlFallback, {
      headers: { "Content-Type": "application/xml" },
    });

  } catch (error) {
    console.error("[Webhook Error]", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Une erreur est survenue.</Say></Response>`,
      { status: 200, headers: { "Content-Type": "application/xml" } }
    );
  }
}
