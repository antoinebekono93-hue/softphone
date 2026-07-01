import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

  try {
    const res = await fetch("https://api.telnyx.com/v2/rooms", {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      // Mock fallback if API fails
      return NextResponse.json({ data: [] });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching video rooms:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

  try {
    const body = await req.json();
    const res = await fetch("https://api.telnyx.com/v2/rooms", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        unique_name: body.unique_name || `room-${Date.now()}`,
        max_participants: body.max_participants || 50,
        enable_recording: body.enable_recording || false
      })
    });
    
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating video room:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
