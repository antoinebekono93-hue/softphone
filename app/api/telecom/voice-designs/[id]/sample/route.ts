import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const response = await fetch(`https://api.telnyx.com/v2/voice_designs/${id}/sample`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ error: "Failed to download sample", details: errorData }, { status: response.status });
    }

    // Return the binary audio stream (WAV)
    const arrayBuffer = await response.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": arrayBuffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error("[Voice Design Sample GET Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
