import { NextResponse } from "next/server";
import { auth } from "@/auth";



export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { messages, model, tools, temperature } = body;

    const telnyxPayload: any = {
      model: model || "zai-org/GLM-5.1-FP8",
      messages,
      stream: true,
      temperature: temperature ?? 0.7,
    };

    if (tools && tools.length > 0) {
      telnyxPayload.tools = tools;
      telnyxPayload.tool_choice = "auto";
    }

    const res = await fetch("https://api.telnyx.com/v2/ai/openai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(telnyxPayload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Inference Chat Error]", err);
      return new NextResponse(err, { status: res.status });
    }

    // Return the stream directly to the client
    return new NextResponse(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("[Inference Chat Exception]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
