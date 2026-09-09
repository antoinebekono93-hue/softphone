import { NextResponse } from "next/server";
import { getConfiguredTelnyxClient } from "@/lib/telnyx";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import crypto from "crypto";
import {
  authorizePstnCallAction,
  canHangupCall,
  isValidCallControlId,
} from "@/lib/pstn-call-control";

export const dynamic = "force-dynamic";

/**
 * POST /api/telnyx/hangup
 * Raccroche / refuse un appel PSTN via l'API Telnyx Call Control.
 *
 * Sécurité (mêmes règles que /api/telnyx/answer) :
 *  - session obligatoire ;
 *  - callControlId appartenant à un callLog du tenant du user (404 sinon) ;
 *  - destinataire vérifié (assignedUser OU membre de l'org) ;
 *  - verrou d'état : refuse toute action sur un call déjà terminé (409) ;
 *  - un second hangup est rejeté par Telnyx → 409.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = { id: session.user.id, organizationId: session.user.organizationId };

    const body = await req.json().catch(() => null);
    const callControlId = body?.callControlId ?? null;
    if (!isValidCallControlId(callControlId)) {
      return NextResponse.json({ error: "Missing or invalid callControlId" }, { status: 400 });
    }

    const callLog = await prisma.callLog.findUnique({
      where: { telnyxCallControlId: callControlId },
      include: {
        phoneNumber: { include: { assignedUser: { select: { id: true } } } },
      },
    });

    const authz = authorizePstnCallAction({ user, callLog });
    if (authz !== "ok" || !callLog) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (!canHangupCall(callLog.status)) {
      return NextResponse.json(
        { error: "Call is already ended" },
        { status: 409 },
      );
    }

    const claimed = await prisma.callLog.updateMany({
      where: {
        id: callLog.id,
        status: callLog.status,
        NOT: { status: { in: ["ENDING", "COMPLETED", "NO_ANSWER", "FAILED", "DENIED"] } },
      },
      data: {
        status: "ENDING",
        ...(callLog.forwardStatus === "SCHEDULED" ? { forwardStatus: "CANCELLED" } : {}),
      },
    });
    if (claimed.count !== 1) {
      return NextResponse.json({ error: "Call is already ended or being forwarded" }, { status: 409 });
    }

    const telnyx = await getConfiguredTelnyxClient();
    try {
      await telnyx.calls.actions.hangup(callControlId, { command_id: crypto.randomUUID() });
    } catch (error) {
      await prisma.callLog.updateMany({
        where: { id: callLog.id, status: "ENDING" },
        data: { status: callLog.status, forwardStatus: callLog.forwardStatus },
      });
      throw error;
    }

    console.log(`[Telnyx Hangup] Call ${callControlId} hung up via API`);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const res = (error as { response?: { status?: number } })?.response;
    if (res?.status === 422 || res?.status === 400) {
      return NextResponse.json({ error: "Call is already ended" }, { status: 409 });
    }
    console.error("[Telnyx Hangup Error]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to hangup call" },
      { status: 500 },
    );
  }
}
