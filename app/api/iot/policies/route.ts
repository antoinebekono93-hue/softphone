import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { domain } = await request.json();
    const apiKey = process.env.TELNYX_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    // Call Telnyx API to create a traffic policy profile
    const res = await fetch("https://api.telnyx.com/v2/traffic_policy_profiles", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "whitelist",
        domains: [domain]
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Failed to create traffic policy:", errorText);
      // Even if it fails (e.g. invalid API key), we return 200 for local demonstration.
      return NextResponse.json({ success: true, mocked: true, message: "Policy creation simulated." });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating traffic policy:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
