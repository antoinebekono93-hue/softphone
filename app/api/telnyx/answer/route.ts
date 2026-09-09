import { NextResponse } from "next/server";
import { getConfiguredTelnyxClient } from "@/lib/telnyx";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import crypto from "crypto";
import {
  authorizePstnCallAction,
  canAnswerCall,
  isValidCallControlId,
} from "@/lib/pstn-call-control";

export const dynamic = "force-dynamic";

/**
 * POST /api/telnyx/answer
 * Répond à un appel PSTN entrant via l'API Telnyx Call Control.
 * Utilisé quand le client Pusher déclenche l'UI d'appel entrant mais que
 * le SDK Telnyx WebRTC natif n'a pas reçu l'event SIP.
 *
 * Sécurité :
 *  - session obligatoire ;
 *  - callControlId appartenant à un callLog du tenant du user (sinon 404,
 *    on ne divulgue pas l'existence du call) ;
 *  - destinataire vérifié (assignedUser OU membre de l'org) ;
 *  - verrou d'état : le call doit être INITIATED/RINGING (409 sinon) ;
 *  - un second answer sur un appel déjà muté est rejeté par Telnyx → 409.
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
      // "not-found" et "forbidden" → 404 (pas de fuite d'existence entre tenants).
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (!canAnswerCall(callLog.status)) {
      return NextResponse.json(
        { error: "Call is not in an answerable state" },
        { status: 409 },
      );
    }

    const telnyx = await getConfiguredTelnyxClient();
    const call = new telnyx.Call({ call_control_id: callControlId });
    await call.answer({ command_id: crypto.randomUUID() });

    console.log(`[Telnyx Answer] Call ${callControlId} answered via API`);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const res = (error as { response?: { status?: number } })?.response;
    if (res?.status === 422 || res?.status === 400) {
      // La commande Telnyx a été refusée (double answer / appel déjà terminé / état incohérent).
      return NextResponse.json({ error: "Call is already ended or answered" }, { status: 409 });
    }
    console.error("[Telnyx Answer Error]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to answer call" },
      { status: 500 },
    );
  }
}
