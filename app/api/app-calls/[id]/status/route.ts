import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { appCallChannels, APP_CALL_EVENTS } from "@/lib/app-call-channels";
import {
  expireStaleRingingSessions,
  APP_CALL_TERMINAL_STATUSES,
} from "@/lib/app-call-session";

export const dynamic = "force-dynamic";

/**
 * Transitions interdites : la table autorisées ci-dessous est la SEULE source
 * de vérité pour valider une transition. ACTIVE n'est accepté que depuis
 * OFFERING/RINGING/CONNECTING (le client signale que WebRTC est connected, mais
 * le serveur re-vérifie participant + session + état précédent + org).
 *
 *   OFFERING -> CONNECTING/ENDED
 *   RINGING  -> CONNECTING/ACTIVE/DECLINED/MISSED/ENDED
 *   CONNECTING -> ACTIVE/FAILED/ENDED
 *   ACTIVE   -> ENDED/FAILED
 *   (terminal -> aucun)
 */

// (préfixe : transitions valides par état courant)
const CLI_TRANSITIONS: Record<string, string[]> = {
  OFFERING: ["CONNECTING", "ENDED"],
  RINGING: ["CONNECTING", "ACTIVE", "DECLINED", "MISSED", "ENDED"],
  CONNECTING: ["ACTIVE", "FAILED", "ENDED"],
  ACTIVE: ["ENDED", "FAILED"],
};

type StatusBody =
  | { status: "CONNECTING" }
  | { status: "ACTIVE" }
  | { status: "ENDED" }
  | { status: "DECLINED" }
  | { status: "MISSED" }
  | { status: "FAILED"; reason?: string };

const PEER_EVENT: Record<string, string> = {
  CONNECTING: APP_CALL_EVENTS.ACCEPTED,
  ACTIVE: APP_CALL_EVENTS.ACCEPTED,
  DECLINED: APP_CALL_EVENTS.DECLINED,
  MISSED: APP_CALL_EVENTS.ENDED,
  ENDED: APP_CALL_EVENTS.ENDED,
  FAILED: APP_CALL_EVENTS.ENDED,
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: StatusBody;
  try {
    body = (await request.json()) as StatusBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Self-healing du timeout (M4) : avant tout, on expire les sons obsolètes.
  // Idempotent — n'affecte pas ce traitement si cette session est encore jeune.
  try {
    await expireStaleRingingSessions();
  } catch (err) {
    console.error("[app-calls/status] expireStaleRingingSessions failed", err);
  }

  const appCall = await prisma.appCallSession.findUnique({ where: { id } });
  if (!appCall) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const isCaller = appCall.callerId === userId;
  const isCallee = appCall.calleeId === userId;
  if (!isCaller && !isCallee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Seul le callee peut accepter (CONNECTING) ou refuser (DECLINED).
  if (
    (body.status === "CONNECTING" ||
      body.status === "DECLINED" ||
      body.status === "ACTIVE") &&
    !isCallee
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Le caller peut raccrocher (ENDED) ; seul lui ou le callee en cours.
  if (body.status === "ENDED" && !isCaller && !isCallee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const untilSelfHeal = await prisma.appCallSession.findUnique({ where: { id } });
  const currentStatus = untilSelfHeal?.status ?? appCall.status;

  const allowed = CLI_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(body.status)) {
    return NextResponse.json(
      { error: "Invalid state transition" },
      { status: 409 }
    );
  }

  const now = new Date();
  const terminal = APP_CALL_TERMINAL_STATUSES.includes(
    body.status as (typeof APP_CALL_TERMINAL_STATUSES)[number]
  );
  const durationSeconds = terminal
    ? Math.max(
        0,
        Math.floor((now.getTime() - appCall.startedAt.getTime()) / 1000)
      )
    : undefined;

  await prisma.appCallSession.update({
    where: { id },
    data: {
      status: body.status,
      ...(body.status === "CONNECTING" ? { answeredAt: now } : {}),
      ...(body.status === "ACTIVE" ? { connectedAt: now } : {}),
      ...(terminal
        ? {
            endedAt: now,
            durationSeconds,
            failReason:
              body.status === "FAILED" ? (body.reason as string) ?? null : null,
          }
        : {}),
    },
  });

  // Décrémente le compteur d'appels actifs UNIQUEMENT lors du passage vers un
  // état terminal, pour ne jamais décrémenter deux fois (update unique).
  if (
    terminal &&
    !APP_CALL_TERMINAL_STATUSES.includes(
      currentStatus as (typeof APP_CALL_TERMINAL_STATUSES)[number]
    )
  ) {
    await prisma.organization.update({
      where: { id: appCall.organizationId },
      data: { activeCallsCount: { decrement: 1 } },
    });
  }

  const peerId = isCaller ? appCall.calleeId : appCall.callerId;
  const event = PEER_EVENT[body.status];
  if (event) {
    try {
      await pusherServer.trigger(appCallChannels.user(peerId), event, {
        callId: id,
        status: body.status,
        durationSeconds,
      });
    } catch (err) {
      console.error("[app-calls/status] status trigger failed", err);
    }
  }

  return NextResponse.json(
    {
      call: {
        id,
        status: body.status,
        durationSeconds: durationSeconds ?? undefined,
      },
    },
    { status: 200 }
  );
}
