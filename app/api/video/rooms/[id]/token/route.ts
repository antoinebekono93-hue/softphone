import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // https://developers.telnyx.com/api-reference/rooms-client-tokens/create-client-token-to-join-a-room
    const res = await fetch(`https://api.telnyx.com/v2/rooms/${id}/actions/generate_join_client_token`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        refresh_token_ttl_secs: 3600,
        token_ttl_secs: 600
      })
    });
    
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating video token:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
