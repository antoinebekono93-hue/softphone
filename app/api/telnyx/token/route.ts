import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, email: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { telnyxConnectionId: true, telnyxApiKey: true }
    });

    // In a real multi-tenant app, we might use the master API key and a specific connection ID per org.
    // Here we use the environment variable as fallback.
    const apiKey = org?.telnyxApiKey || process.env.TELNYX_API_KEY;
    const connectionId = org?.telnyxConnectionId || process.env.TELNYX_SIP_CONNECTION_ID;

    if (!apiKey || !connectionId) {
      return NextResponse.json({ error: "Telnyx integration not fully configured (missing API Key or Connection ID)." }, { status: 400 });
    }

    // Generate a WebRTC credential token valid for 24 hours
    // According to Telnyx docs, On-Demand Credentials for WebRTC uses POST /v2/webrtc/credentials
    const response = await fetch("https://api.telnyx.com/v2/webrtc/credentials", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        connection_id: connectionId
      })
    });


    if (!response.ok) {
      const err = await response.json();
      console.error("Telnyx token generation failed:", err);
      return NextResponse.json({ error: `Erreur Telnyx: ${err?.errors?.[0]?.detail || JSON.stringify(err)}` }, { status: 500 });
    }

    const data = await response.json();
    
    // Return the generated JWT to the client
    return NextResponse.json({
      token: data.data.token || data.data.sip_username, // Fallbacks
    });

  } catch (error: any) {
    console.error("[/api/telnyx/token] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
