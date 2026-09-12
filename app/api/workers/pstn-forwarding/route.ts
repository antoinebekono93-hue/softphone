import { NextResponse } from "next/server";
import { processDuePstnForwards } from "@/lib/pstn-forwarding";
import { processDuePstnVoicemails } from "@/lib/pstn-voicemail";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization");
  if (!expected || supplied !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [forwarding, voicemail] = await Promise.all([processDuePstnForwards(), processDuePstnVoicemails()]);
    return NextResponse.json({ forwarding, voicemail });
  } catch (error) {
    console.error("[PSTN Forward Worker]", error);
    return NextResponse.json({ error: "FORWARD_WORKER_FAILED" }, { status: 500 });
  }
}
