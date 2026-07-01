import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, voice, provider, language } = await req.json();

    if (!text || !voice) {
      return NextResponse.json({ error: "Text and voice are required" }, { status: 400 });
    }

    if (!process.env.TELNYX_API_KEY) {
      return NextResponse.json({ error: "Telnyx API key not configured" }, { status: 500 });
    }

    const payload: any = {
      text,
      voice,
    };

    // Special handling for Grok voices
    if (provider === "xai") {
      payload.provider = "xai";
      payload.xai = {
        voice_id: voice.replace("xAI.", ""),
        language: language || "auto",
        output_format: "mp3",
        sample_rate: 24000
      };
      // For Grok, voice field doesn't need the prefix if we use provider xai, 
      // but the docs say "voice: xAI.eve" in one place and "voice_id: eve" in another.
      // We'll pass the exact voice ID inside xai block.
    }

    const response = await fetch("https://api.telnyx.com/v2/text-to-speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Telnyx TTS Error]", errorData);
      return NextResponse.json({ error: "TTS Generation failed", details: errorData }, { status: response.status });
    }

    // Return the binary stream to the client
    const arrayBuffer = await response.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": arrayBuffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error("[TTS API Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
