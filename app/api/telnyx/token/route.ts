import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const API_BASE = "https://api.telnyx.com/v2";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: { telnyxApiKey: true, telnyxConnectionId: true },
    });
    const apiKey = settings?.telnyxApiKey?.trim() || process.env.TELNYX_API_KEY?.trim();
    const connectionId = settings?.telnyxConnectionId?.trim() || process.env.TELNYX_SIP_CONNECTION_ID?.trim();
    if (!apiKey || !connectionId) {
      return NextResponse.json({ error: "TELNYX_WEBRTC_NOT_CONFIGURED" }, { status: 503 });
    }

    const headers = { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };
    const connectionResponse = await fetch(`${API_BASE}/credential_connections/${connectionId}`, {
      headers,
      cache: "no-store",
    });
    if (!connectionResponse.ok) {
      console.error("Configured Telnyx connection unavailable", connectionResponse.status);
      return NextResponse.json({ error: "TELNYX_CONNECTION_UNAVAILABLE" }, { status: 502 });
    }
    const connection = (await connectionResponse.json()).data;
    if (!connection?.active) {
      return NextResponse.json({ error: "TELNYX_CONNECTION_INACTIVE" }, { status: 503 });
    }

    const credentialResponse = await fetch(
      `${API_BASE}/telephony_credentials?filter[resource_id]=${encodeURIComponent(`connection:${connectionId}`)}&page[size]=100`,
      { headers, cache: "no-store" },
    );
    if (!credentialResponse.ok) {
      console.error("Failed to list Telnyx WebRTC credentials", credentialResponse.status);
      return NextResponse.json({ error: "TELNYX_CREDENTIAL_LOOKUP_FAILED" }, { status: 502 });
    }
    const credentials = (await credentialResponse.json()).data ?? [];
    const credential = credentials.find((item: any) =>
      !item.expired &&
      (item.connection_id === connectionId || item.resource_id === `connection:${connectionId}`),
    );
    if (!credential?.id) {
      // Provisioning belongs in God Mode, never in a user's token request.
      return NextResponse.json({ error: "TELNYX_WEBRTC_CREDENTIAL_MISSING" }, { status: 503 });
    }

    const tokenResponse = await fetch(`${API_BASE}/telephony_credentials/${credential.id}/token`, {
      method: "POST",
      headers,
      cache: "no-store",
    });
    if (!tokenResponse.ok) {
      const upstream = await tokenResponse.text().catch(() => "");
      console.error("Failed to generate Telnyx WebRTC token", tokenResponse.status, upstream.slice(0, 300));
      return NextResponse.json({ error: "TELNYX_WEBRTC_TOKEN_FAILED" }, { status: 502 });
    }
    const token = (await tokenResponse.text()).trim();
    if (!token) {
      return NextResponse.json({ error: "TELNYX_WEBRTC_TOKEN_EMPTY" }, { status: 502 });
    }
    return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("WebRTC Token Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "TELNYX_WEBRTC_TOKEN_UNAVAILABLE" }, { status: 503 });
  }
}
