import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConfiguredTelnyxClient } from "@/lib/telnyx";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const call = await prisma.callLog.findFirst({
    where: { id: (await params).id, organizationId: session.user.organizationId, voicemailStatus: "SAVED" },
    select: { voicemailRecordingId: true, recordingUrl: true },
  });
  if (!call) return NextResponse.json({ error: "Message vocal introuvable" }, { status: 404 });

  let downloadUrl: string | null = null;
  if (call.voicemailRecordingId) {
    const telnyx = await getConfiguredTelnyxClient();
    const recording = await telnyx.recordings.retrieve(call.voicemailRecordingId);
    downloadUrl = recording?.data?.download_urls?.mp3 || recording?.data?.download_urls?.wav || null;
  }
  downloadUrl ||= call.recordingUrl;
  if (!downloadUrl) return NextResponse.json({ error: "Enregistrement indisponible" }, { status: 404 });

  try {
    const target = new URL(downloadUrl);
    if (target.protocol !== "https:") throw new Error("INVALID_RECORDING_URL");
    return NextResponse.redirect(target, 307);
  } catch {
    return NextResponse.json({ error: "URL d’enregistrement invalide" }, { status: 502 });
  }
}
