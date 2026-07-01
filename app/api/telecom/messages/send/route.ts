import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { from, to, text, channel = "SMS", mediaUrls = [], whatsappTemplate } = body;

    if (!TELNYX_API_KEY) {
      return NextResponse.json({ error: "Missing Telnyx API Key" }, { status: 500 });
    }
    if (!from || !to) {
      return NextResponse.json({ error: "Missing 'from' or 'to' numbers" }, { status: 400 });
    }

    // [MOCK AUTH]: Fetch org using the from number
    const phoneNumber = await prisma.phoneNumber.findUnique({
      where: { number: from }
    });

    if (!phoneNumber) {
      return NextResponse.json({ error: "Sender number not found in organization" }, { status: 404 });
    }

    // Build the Telnyx payload based on the channel
    let telnyxPayload: any = {
      from: from,
      to: to,
    };

    if (channel === "SMS") {
      telnyxPayload.text = text;
      if (mediaUrls.length > 0) {
        telnyxPayload.media_urls = mediaUrls;
      }
    } else if (channel === "WHATSAPP") {
      // Telnyx automatically routes to WhatsApp if the sender is configured as a WhatsApp Business Account
      // But we can specify WhatsApp specific parameters if it's a template
      if (whatsappTemplate) {
        telnyxPayload.type = "whatsapp";
        telnyxPayload.whatsapp = {
          type: "template",
          template: {
            name: whatsappTemplate.name,
            language: { code: whatsappTemplate.language || "fr" },
            components: whatsappTemplate.components || []
          }
        };
      } else {
        telnyxPayload.text = text; // Session message (must be within 24h window)
      }
    } else if (channel === "RCS") {
      // RCS logic via Telnyx Messaging Profile
      telnyxPayload.text = text;
      telnyxPayload.type = "rcs"; 
      // Rich cards can be added here if passed in the payload
    }

    console.log(`[Messaging Engine] Sending ${channel} from ${from} to ${to}...`);

    const res = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TELNYX_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(telnyxPayload)
    });

    const responseData = await res.json();

    if (!res.ok) {
      console.error("[Messaging Engine] Telnyx API Error:", responseData);
      return NextResponse.json({ error: responseData.errors?.[0]?.detail || "Failed to send message" }, { status: res.status });
    }

    // Save to database as PENDING (webhook will update to SENT/DELIVERED)
    const sms = await prisma.smsMessage.create({
      data: {
        telnyxMessageId: responseData.data?.id || `manual-${Date.now()}`,
        direction: "OUTBOUND",
        fromNumber: from,
        toNumber: to,
        body: text || "[Rich Media/Template]",
        type: channel,
        status: "PENDING",
        organizationId: phoneNumber.organizationId,
        phoneNumberId: phoneNumber.id
      }
    });

    return NextResponse.json({ success: true, data: sms });
  } catch (error: any) {
    console.error("[Messaging Engine Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
