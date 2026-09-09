import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { releasePstnReservation } from "@/lib/pstn-billing";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const attemptId = typeof body?.attemptId === "string" ? body.attemptId : "";
  if (!/^[0-9a-f-]{36}$/i.test(attemptId)) {
    return NextResponse.json({ error: "INVALID_ATTEMPT" }, { status: 400 });
  }
  const callControlId = `pending:${attemptId}`;
  const callLog = await prisma.callLog.findFirst({
    where: {
      telnyxCallControlId: callControlId,
      userId: session.user.id,
      organizationId: session.user.organizationId,
      status: { in: ["PREAUTHORIZING", "PREAUTHORIZED"] },
    },
    select: { id: true, organizationId: true },
  });
  if (!callLog) return NextResponse.json({ ok: true });

  await releasePstnReservation({
    organizationId: callLog.organizationId,
    callControlId,
    callLogId: callLog.id,
    reason: "SDK_START_FAILED",
  });
  await prisma.callLog.update({
    where: { id: callLog.id },
    data: { status: "FAILED", endedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
