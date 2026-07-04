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
    const credentials = listData.data;
    
    let credentialId;

    if (!credentials || credentials.length === 0) {
      // Create a default credential automatically
      console.log("No Telephony Credential found. Creating a default one...");
      // To create a telephony credential, we must attach it to a SIP Connection
      const connRes = await fetch("https://api.telnyx.com/v2/credential_connections", {
        headers: {
          "Authorization": `Bearer ${TELNYX_API_KEY}`,
          "Accept": "application/json"
        }
      });
      const connData = await connRes.json();
      const connections = connData.data || [];
      
      if (connections.length === 0) {
        return NextResponse.json({ error: "No SIP Connection found on Telnyx. Please create one first." }, { status: 500 });
      }

      const sipConnectionId = connections[0].id;

      const createRes = await fetch("https://api.telnyx.com/v2/telephony_credentials", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TELNYX_API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          connection_id: sipConnectionId
        })
      });

      if (!createRes.ok) {
        console.error("Failed to create Telephony Credential:", await createRes.text());
        return NextResponse.json({ error: "Failed to create Telephony Credential" }, { status: 500 });
      }

      const createData = await createRes.json();
      credentialId = createData.data.id;
      console.log("Successfully created Telephony Credential:", credentialId);
    } else {
      credentialId = credentials[0].id;
    }

    // 2. Request the WebRTC Token using the Telephony Credential ID
    const tokenRes = await fetch(`https://api.telnyx.com/v2/telephony_credentials/${credentialId}/token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TELNYX_API_KEY}`,
        "Accept": "application/json"
      }
    });

    if (tokenRes.ok) {
      const tokenString = await tokenRes.text();
      return NextResponse.json({ token: tokenString });
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
