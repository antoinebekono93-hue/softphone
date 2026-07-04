import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

export async function GET(req: Request) {
  try {
    if (!TELNYX_API_KEY) {
      throw new Error("Missing TELNYX_API_KEY environment variable");
    }

    // [MOCK AUTH]: Fetch the first organization for the MVP
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    // Since finding the Telephony Credential ID in the Telnyx Portal can be confusing,
    // we will automatically fetch the first credential from your Telnyx account using your API key.
    const listRes = await fetch("https://api.telnyx.com/v2/telephony_credentials", {
      headers: {
        "Authorization": `Bearer ${TELNYX_API_KEY}`,
        "Accept": "application/json"
      }
    });

    if (!listRes.ok) {
       console.error("Failed to list Telnyx credentials", await listRes.text());
       return NextResponse.json({ error: "Failed to list credentials" }, { status: 500 });
    }

    const listData = await listRes.json();
    const credentials = listData.data || [];

    if (credentials.length === 0) {
       // MOCK RESPONSE to unblock the frontend UI if no credentials exist
       return NextResponse.json({ 
         token: "mock_jwt_token_for_ui", 
         warning: "Real SIP credentials missing on Telnyx account. Please create one." 
       });
    }

    // Use the very first credential found
    const credentialId = credentials[0].id;

    // Generate the WebRTC token using this credential ID
    const tokenRes = await fetch(`https://api.telnyx.com/v2/telephony_credentials/${credentialId}/token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TELNYX_API_KEY}`,
        "Accept": "application/json"
      }
    });

    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      return NextResponse.json({ token: tokenData.data });
    }

    // Fallback if token generation fails
    return NextResponse.json({ 
      token: "mock_jwt_token_for_ui", 
      warning: "Failed to generate real WebRTC token." 
    });

  } catch (error: any) {
    console.error("WebRTC Token Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
