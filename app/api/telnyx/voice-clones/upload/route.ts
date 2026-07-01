import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // This route handles multipart/form-data directly and forwards it to Telnyx
    const formData = await req.formData();
    
    // We can directly send this FormData to Telnyx!
    // Using native fetch with FormData automatically sets the correct Content-Type with boundary
    const response = await fetch("https://api.telnyx.com/v2/voice_clones/from_upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(err, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Voice Clones Upload Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
