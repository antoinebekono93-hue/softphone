import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPusherServer } from "@/lib/pusher";
import { appCallChannels, APP_CALL_EVENTS } from "@/lib/app-call-channels";
import {
  SignalPayload,
  buildServerSignal,
  isSignalAllowedForState,
} from "@/lib/app-call-signals";

export const dynamic = "force-dynamic";

/**
 * Relais SERVEUR du signaling APP_TO_APP.
 *
 * Le client ne déclenche jamais directement sur le canal d'appel : il POSTe ici
 * un PAYLOAD (type + sdp/candidate). Le serveur :
 *   1. authentifie l'utilisateur (auth(), jamais le senderId du navigateur) ;
 *   2. vérifie qu'il est bien participant de la session ;
 *   3. vérifie l'organisation + session non terminale ;
 *   4. vérifie que le type de signal est autorisé pour l'état courant ;
 *   5. construit un signal authentifié (senderId/toId/sessionId posés serveur) ;
 *   6. publie sur le canal d'appel via Pusher SERVEUR.
 *
 * L'audio ne transite JAMAIS ici — signaling uniquement.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const orgId = session.user.organizationId;

  let body: { payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body.payload as SignalPayload | undefined;
  if (!payload || typeof payload.type !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const appCall = await prisma.appCallSession.findUnique({ where: { id } });
  if (!appCall) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }
  if (appCall.organizationId !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isCaller = appCall.callerId === userId;
  const isCallee = appCall.calleeId === userId;
  if (!isCaller && !isCallee) {
    // Tentative d'envoyer un signal sur la session d'un autre utilisateur.
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Session terminale → plus aucun signal client accepté.
  const TERMINAL = ["ENDED", "MISSED", "DECLINED", "FAILED"] as const;
  if (TERMINAL.includes(appCall.status as (typeof TERMINAL)[number])) {
    return NextResponse.json({ error: "Call already ended" }, { status: 409 });
  }

  const signalType = payload.type as (typeof import("@/lib/app-call-signals").CALL_SIGNAL_TYPES)[keyof typeof import("@/lib/app-call-signals").CALL_SIGNAL_TYPES];

  if (!isSignalAllowedForState({ sessionStatus: appCall.status, isCaller, signalType })) {
    return NextResponse.json(
      { error: "Signal not allowed in current state" },
      { status: 409 }
    );
  }

  // Destinataire = l'AUTRE participant (déterminé par le serveur, jamais par le client).
  const peerId = isCaller ? appCall.calleeId : appCall.callerId;

  const signal = buildServerSignal({
    sessionId: id,
    senderId: userId,
    peerId,
    payload,
  });

  try {
    await getPusherServer()?.trigger(appCallChannels.call(id), APP_CALL_EVENTS.SIGNAL, signal);
  } catch (err) {
    console.error("[app-calls/signal] trigger failed", {
      sessionId: id,
      callerId: appCall.callerId,
      calleeId: appCall.calleeId,
      organizationId: orgId,
      type: payload.type,
    }, err);
    return NextResponse.json({ error: "Signal publish failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
