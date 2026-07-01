"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Provisions a LiveKit tenant on Telnyx's platform.
 * Makes a POST to https://<region>.livekit-telnyx.com/provision
 */
export async function provisionLiveKitTenant(region: string, projectName: string, apiSecret: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) return { error: "TELNYX_API_KEY is not configured" };

    const url = `https://${region}.livekit-telnyx.com/provision`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: projectName,
        api_key: apiKey,
        api_secret: apiSecret
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[LiveKit Provision Error]", errorText);
      return { error: `Provisioning failed: ${res.statusText}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[LiveKit Provision Error]", error);
    return { error: "An unexpected error occurred during provisioning." };
  }
}

/**
 * Bridges a Telnyx Phone Number to a LiveKit Region.
 * 1. Creates a FQDN Connection.
 * 2. Adds the SIP FQDN to the connection.
 * 3. Assigns the Phone Number to the connection.
 */
export async function bridgeLiveKitTelephony(phoneNumberId: string, region: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) return { error: "TELNYX_API_KEY is not configured" };

    // Get the actual phone number from our DB
    const phone = await prisma.phoneNumber.findUnique({
      where: { id: phoneNumberId, organizationId: session.user.organizationId }
    });

    if (!phone) return { error: "Phone number not found in database" };
    if (!phone.telnyxId) return { error: "Phone number is missing Telnyx ID" };

    // 1. Create FQDN Connection
    const connName = `${region}-livekit-sip-connection-${Date.now().toString().slice(-4)}`;
    const fqdnRes = await fetch("https://api.telnyx.com/v2/fqdn_connections", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ connection_name: connName })
    });

    if (!fqdnRes.ok) {
      const err = await fqdnRes.text();
      console.error("[LiveKit Bridge Error - Create FQDN]", err);
      return { error: "Failed to create FQDN connection" };
    }

    const fqdnData = await fqdnRes.json();
    const connectionId = fqdnData.data.id;

    // 2. Add SIP FQDN to the connection
    const sipFqdn = `${region}.sip.livekit-telnyx.com`;
    const addFqdnRes = await fetch("https://api.telnyx.com/v2/fqdns", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        connection_id: connectionId,
        fqdn: sipFqdn,
        dns_record_type: "a",
        port: 5060
      })
    });

    if (!addFqdnRes.ok) {
      const err = await addFqdnRes.text();
      console.error("[LiveKit Bridge Error - Add FQDN]", err);
      return { error: "Failed to add FQDN to connection" };
    }

    // 3. Assign Phone Number to the connection
    const patchPhoneRes = await fetch(`https://api.telnyx.com/v2/phone_numbers/${phone.telnyxId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ connection_id: connectionId })
    });

    if (!patchPhoneRes.ok) {
      const err = await patchPhoneRes.text();
      console.error("[LiveKit Bridge Error - Patch Phone]", err);
      return { error: "Failed to assign phone number to connection" };
    }

    return { 
      success: true, 
      data: {
        phoneNumber: phone.number,
        connectionId: connectionId,
        sipEndpoint: sipFqdn
      }
    };
  } catch (error: any) {
    console.error("[LiveKit Bridge Error]", error);
    return { error: "An unexpected error occurred during bridging." };
  }
}
