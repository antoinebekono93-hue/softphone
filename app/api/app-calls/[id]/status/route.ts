import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPusherServer } from "@/lib/pusher";
import { appCallChannels, APP_CALL_EVENTS } from "@/lib/app-call-channels";
import {
  expireStaleRingingSessions,
  canApplyStatusTransition,
  APP_CALL_TERMINAL_STATUSES,
} from "@/lib/app-call-session";
import { logServerCallEvent } from "@/lib/app-call-observability";

export const dynamic = "force-dynamic";

/**
 * Transitions de statut APP_TO_APP — SEULE source de vérité côté serveur.
 *
 * - La matrice + les rôles sont centralisés dans canApplyStatusTransition
 *   (lib/app-call-session.ts), testable, et jamais dupliqués ici.
 * - GARDE ANTI-COURSE (activeCallsCount) : la mise à jour passe par
 *   `updateMany WHERE status = <état lu>`. Sur une transition terminale
 *   concurrente (ex : les DEUX participants PATCH ENDED en même temps, ou un
 *   ENDED vs le reaper), UN SEUL updateMany matche : un seul passage libère le
 *   slot (decrement). Le perdant obtient un succès idempotent SANS
 *   décrémenter deux fois ni re-notifier le peer.
 * - Oracle anti-énumération : un non-participant reçoit 404 (comme un id
 *   inexistant), pas 403 — on ne révèle pas l'existence d'un callId.
 */

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

const isTerminal = (status: string) =>
  APP_CALL_TERMINAL_STATUSES.includes(
    status as (typeof APP_CALL_TERMINAL_STATUSES)[number]
  );

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    logServerCallEvent({
      level: "warn",
      event: "CALL_UNAUTHORIZED",
      callId: id,
      details: { path: "/api/app-calls/[id]/status" },
    });
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
    logServerCallEvent({
      level: "debug",
      event: "CALL_NOT_FOUND",
      callId: id,
    });
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const isCaller = appCall.callerId === userId;
  const isCallee = appCall.calleeId === userId;
  if (!isCaller && !isCallee) {
    // 404 (pas 403) : un non-participant ne doit pas distinguer "existe" de
    // "n'existe pas" (oracle anti-énumération de callIds). Le détail reste
    // côté serveur (log warn) sans rien révéler au client.
    logServerCallEvent({
      level: "warn",
      event: "CALL_ACCESS_DENIED",
      callId: id,
      details: { userId, status: appCall.status },
    });
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const transition = canApplyStatusTransition({
    currentStatus: appCall.status,
    nextStatus: body.status,
    isCaller,
    isCallee,
  });
  if (!transition.ok) {
    logServerCallEvent({
      level: "warn",
      event: "CALL_INVALID_TRANSITION",
      callId: id,
      details: {
        userId,
        currentStatus: appCall.status,
        requestedStatus: body.status,
        reason: transition.reason,
      },
    });
    const status = transition.reason === "FORBIDDEN_ROLE" ? 403 : 409;
    const error =
      transition.reason === "FORBIDDEN_ROLE" ? "Forbidden" : "Invalid state transition";
    return NextResponse.json({ error }, { status });
  }

  const now = new Date();
  const terminal = isTerminal(body.status);
  const durationSeconds = terminal
    ? Math.max(0, Math.floor((now.getTime() - appCall.startedAt.getTime()) / 1000))
    : undefined;

  // Mise à jour ATOMIQUE conditionnelle : seul le racer dont l'état lu est
  // encore l'état courant en base matche (count === 1).
  const res = await prisma.appCallSession.updateMany({
    where: { id, status: appCall.status },
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

  if (res.count === 0) {
    // L'état a changé entre notre lecture et l'écriture (peer / reaper).
    const latest = await prisma.appCallSession.findUnique({
      where: { id },
      select: { status: true },
    });
    // Retry idempotent : la session est déjà dans l'état demandé, ou déjà
    // terminale alors qu'on terminait aussi → succès SANS double libération
    // du slot ni double notification.
    if (latest && (latest.status === body.status || (terminal && isTerminal(latest.status)))) {
      logServerCallEvent({
        level: "debug",
        event: "CALL_STATE_CHANGE_IDEMPOTENT",
        callId: id,
        details: { requestedStatus: body.status, currentStatus: latest.status },
      });
      return NextResponse.json(
        { call: { id, status: body.status, durationSeconds } },
        { status: 200 }
      );
    }
    logServerCallEvent({
      level: "warn",
      event: "CALL_STATE_CONFLICT",
      callId: id,
      details: {
        userId,
        requestedStatus: body.status,
        currentStatus: latest?.status ?? null,
        isTerminal: terminal,
      },
    });
    return NextResponse.json({ error: "Invalid state transition" }, { status: 409 });
  }

  // count === 1 : on est le SEUL racer à avoir effectué cette transition.
  // Libère le slot UNIQUEMENT ici (jamais auparavant, jamais en cas de count 0).
  if (terminal) {
    logServerCallEvent({
      level: body.status === "FAILED" ? "warn" : "info",
      event: "CALL_STATE_TERMINAL",
      callId: id,
      details: {
        userId,
        status: body.status,
        durationSeconds,
        failReason: body.status === "FAILED" ? (body.reason ?? null) : null,
      },
    });
    await prisma.organization.update({
      where: { id: appCall.organizationId },
      data: { activeCallsCount: { decrement: 1 } },
    });
  } else {
    logServerCallEvent({
      level: "info",
      event:
        body.status === "CONNECTING" ? "CALL_ACCEPTED" : "CALL_CONNECTED",
      callId: id,
      details: { userId, status: body.status },
    });
  }

  const peerId = isCaller ? appCall.calleeId : appCall.callerId;
  const event = PEER_EVENT[body.status];
  if (event) {
    try {
      await getPusherServer()?.trigger(appCallChannels.user(peerId), event, {
        callId: id,
        status: body.status,
        durationSeconds,
      });
    } catch (err) {
      logServerCallEvent({
        level: "error",
        event: "STATUS_TRIGGER_FAILED",
        callId: id,
        details: { userId, status: body.status, peerId },
      });
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