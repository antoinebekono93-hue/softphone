import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Fetch the call log
    const callLog = await prisma.callLog.findUnique({
      where: { 
        id,
        organizationId: session.user.organizationId 
      },
    });

    if (!callLog) {
      return NextResponse.json({ error: "Call log not found" }, { status: 404 });
    }

    if (!callLog.recordingUrl) {
      return NextResponse.json({ error: "No recording available for this call" }, { status: 400 });
    }

    if (!process.env.TELNYX_API_KEY) {
      return NextResponse.json({ error: "Telnyx API key not configured" }, { status: 500 });
    }

    // Telnyx STT API expects multipart/form-data
    const formData = new FormData();
    // Use deepgram/nova-3 for highest accuracy, or openai/whisper-large-v3-turbo for broad multilingual support.
    formData.append("model", "openai/whisper-large-v3-turbo");
    formData.append("file_url", callLog.recordingUrl);

    const response = await fetch("https://api.telnyx.com/v2/ai/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`
        // Do NOT set Content-Type header manually when sending FormData via fetch
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Telnyx STT Error]", data);
      return NextResponse.json({ error: "Transcription failed", details: data }, { status: response.status });
    }

    const transcriptionText = data.text;

    // Save back to database
    await prisma.callLog.update({
      where: { id },
      data: { transcriptionText },
    });

    return NextResponse.json({ success: true, text: transcriptionText });
  } catch (error: any) {
    console.error("[Transcribe API Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
