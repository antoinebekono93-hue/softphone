import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import telnyxLib from "telnyx";

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

    const telnyx = telnyxLib(apiKey);

    // connectionId now expects a Telephony Credential ID
    // In the new Telnyx WebRTC flow, we generate a JWT directly from the Telephony Credential ID
    try {
      const response = await telnyx.telephonyCredentials.createToken(connectionId);
      
      return NextResponse.json({
        token: response,
      });
    } catch (err: any) {
      console.error("Telnyx token generation failed:", err);
      return NextResponse.json({ error: `Erreur Telnyx: ${err.message || 'Token generation failed'}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error("[/api/telnyx/token] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
