import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logServerCallEvent } from "@/lib/app-call-observability";

export const dynamic = "force-dynamic";

/**
 * Détail d'une session APP_TO_APP (participants uniquement).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    logServerCallEvent({
      level: "warn",
      event: "CALL_UNAUTHORIZED",
      callId: id,
      details: { path: "/api/app-calls/[id]" },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appCall = await prisma.appCallSession.findUnique({
    where: { id },
    include: {
      caller: { select: { id: true, name: true, callUsername: true, callExtension: true } },
      callee: { select: { id: true, name: true, callUsername: true, callExtension: true } },
    },
  });
  if (!appCall) {
    logServerCallEvent({
      level: "debug",
      event: "CALL_NOT_FOUND",
      callId: id,
      details: { path: "/api/app-calls/[id]" },
    });
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }
  if (appCall.callerId !== session.user.id && appCall.calleeId !== session.user.id) {
    // 404 (pas 403) : anti-énumération — on ne révèle pas qu'un callId existe.
    logServerCallEvent({
      level: "warn",
      event: "CALL_ACCESS_DENIED",
      callId: id,
      details: { userId: session.user.id, path: "/api/app-calls/[id]" },
    });
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  return NextResponse.json({ call: appCall });
}
