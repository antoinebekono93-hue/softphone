import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.callLog.findMany({
    where: {
      organizationId: session.user.organizationId,
      voicemailStatus: "SAVED",
      OR: [{ voicemailRecordingId: { not: null } }, { recordingUrl: { not: null } }],
    },
    select: {
      id: true,
      fromNumber: true,
      toNumber: true,
      startedAt: true,
      endedAt: true,
      duration: true,
      transcriptionText: true,
      voicemailRecordingId: true,
    },
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return NextResponse.json(messages.map((message) => ({
    ...message,
    audioUrl: `/api/voicemails/${message.id}/audio`,
  })));
}
