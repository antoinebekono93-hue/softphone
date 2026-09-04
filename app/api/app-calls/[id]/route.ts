import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }
  if (appCall.callerId !== session.user.id && appCall.calleeId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ call: appCall });
}
