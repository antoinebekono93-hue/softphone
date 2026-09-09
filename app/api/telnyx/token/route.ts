import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const API_BASE = "https://api.telnyx.com/v2";
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForProvisioning(userId: string, connectionId: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await wait(200);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telnyxTelephonyCredentialId: true, telnyxCredentialConnectionId: true },
    });
    if (user?.telnyxTelephonyCredentialId &&
        !user.telnyxTelephonyCredentialId.startsWith("provisioning:") &&
        user.telnyxCredentialConnectionId === connectionId) {
      return user.telnyxTelephonyCredentialId;
    }
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [settings, user] = await Promise.all([
      prisma.systemSettings.findUnique({
        where: { id: "default" },
        select: { telnyxApiKey: true, telnyxConnectionId: true },
      }),
      prisma.user.findFirst({
        where: { id: session.user.id, organizationId: session.user.organizationId, isCallable: true },
        select: {
          id: true,
          organizationId: true,
          name: true,
          telnyxTelephonyCredentialId: true,
          telnyxCredentialConnectionId: true,
        },
      }),
    ]);
    if (!user) return NextResponse.json({ error: "CALLING_NOT_ALLOWED" }, { status: 403 });

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
    if (!connection?.active) return NextResponse.json({ error: "TELNYX_CONNECTION_INACTIVE" }, { status: 503 });

    let credentialId = user.telnyxTelephonyCredentialId;
    const credentialMatches = credentialId &&
      !credentialId.startsWith("provisioning:") &&
      user.telnyxCredentialConnectionId === connectionId;

    if (!credentialMatches) {
      if (credentialId?.startsWith("provisioning:") && user.telnyxCredentialConnectionId === connectionId) {
        credentialId = await waitForProvisioning(user.id, connectionId);
        if (!credentialId) {
          return NextResponse.json({ error: "TELNYX_CREDENTIAL_PROVISIONING" }, { status: 409 });
        }
      } else {
        const previousCredentialId = credentialId;
        const previousConnectionId = user.telnyxCredentialConnectionId;
        const claim = `provisioning:${randomUUID()}`;
        const claimed = await prisma.user.updateMany({
          where: {
            id: user.id,
            telnyxTelephonyCredentialId: previousCredentialId,
            telnyxCredentialConnectionId: previousConnectionId,
          },
          data: { telnyxTelephonyCredentialId: claim, telnyxCredentialConnectionId: connectionId },
        });
        if (claimed.count !== 1) {
          credentialId = await waitForProvisioning(user.id, connectionId);
          if (!credentialId) return NextResponse.json({ error: "TELNYX_CREDENTIAL_PROVISIONING" }, { status: 409 });
        } else {
          try {
            const createResponse = await fetch(`${API_BASE}/telephony_credentials`, {
              method: "POST",
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({
                connection_id: connectionId,
                name: `softphone-${user.id}`,
                tag: `organization:${user.organizationId}`,
              }),
            });
            const created = await createResponse.json().catch(() => null);
            if (!createResponse.ok || typeof created?.data?.id !== "string") {
              throw new Error(`TELNYX_CREDENTIAL_CREATE_FAILED_${createResponse.status}`);
            }
            credentialId = created.data.id;
            await prisma.user.update({
              where: { id: user.id },
              data: {
                telnyxTelephonyCredentialId: credentialId,
                telnyxCredentialConnectionId: connectionId,
              },
            });

            // A changed master connection rotates the user's credential. The
            // old credential is removed only after the replacement is durable.
            if (previousCredentialId && !previousCredentialId.startsWith("provisioning:")) {
              await fetch(`${API_BASE}/telephony_credentials/${previousCredentialId}`, {
                method: "DELETE",
                headers,
              }).catch((error) => console.warn("Unable to remove rotated Telnyx credential", error));
            }
          } catch (error) {
            await prisma.user.updateMany({
              where: { id: user.id, telnyxTelephonyCredentialId: claim },
              data: {
                telnyxTelephonyCredentialId: previousCredentialId,
                telnyxCredentialConnectionId: previousConnectionId,
              },
            });
            throw error;
          }
        }
      }
    }

    if (!credentialId || credentialId.startsWith("provisioning:")) {
      return NextResponse.json({ error: "TELNYX_WEBRTC_CREDENTIAL_MISSING" }, { status: 503 });
    }
    const tokenResponse = await fetch(`${API_BASE}/telephony_credentials/${credentialId}/token`, {
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
    if (!token) return NextResponse.json({ error: "TELNYX_WEBRTC_TOKEN_EMPTY" }, { status: 502 });

    return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("WebRTC Token Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "TELNYX_WEBRTC_TOKEN_UNAVAILABLE" }, { status: 503 });
  }
}
