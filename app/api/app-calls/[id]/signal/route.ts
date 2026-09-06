import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPusherServer } from "@/lib/pusher";
import { appCallChannels, APP_CALL_EVENTS } from "@/lib/app-call-channels";
import {
  SignalPayload,
  buildServerSignal,
  isSignalAllowedForState,
  validateSignalPayload,
} from "@/lib/app-call-signals";
import { createSignalRateGuard } from "@/lib/rate-limiter";
import { logAppCallDecision } from "@/lib/app-call-policy";
import { logServerCallEvent } from "@/lib/app-call-observability";

export const dynamic = "force-dynamic";

/**
 * Relais SERVEUR du signaling APP_TO_APP.
 *
 * Le client ne déclenche jamais directement sur le canal d'appel : il POSTe ici
 * un PAYLOAD (type + sdp/candidate). Le serveur :
 *   1. authentifie l'utilisateur (auth(), jamais le senderId du navigateur) ;
 *   2. valide le payload (types, tailles SDP/candidats/JSON) ;
 *   3. vérifie qu'il est bien participant de la session (+ org) ;
 *   4. vérifie que la session n'est pas terminale ;
 *   5. vérifie que le type de signal est autorisé pour l'état courant ;
 *   6. applique la garde anti-flood (budget de signaux/min par session, env
 *      APP_CALL_SIGNAL_MAX_PER_MINUTE, défaut 180 — raisonnable, 3/s soutenus,
 *      jamais bloquant pour une négociation/restart ICE réelle) ;
 *   7. construit un signal authentifié (senderId/toId/sessionId posés serveur) ;
 *   8. publie sur le canal d'appel via Pusher SERVEUR.
 *
 * L'audio ne transite JAMAIS ici — signaling uniquement.
 *
 * Anti-abus :
 *  - budget anti-flood (in-memory, best-effort multi-instance — documenté dans
 *    lib/rate-limiter.ts) pour borner le coût Pusher par session ;
 *  - au-delà du budget, refus 429 + log ABUSE_DETECTED borné (audit trail) ;
 *  - oracle anti-énumération : non-participant → 404 (pas 403).
 */

const TERMINAL = ["ENDED", "MISSED", "DECLINED", "FAILED"] as const;

// Garde anti-flood par session (module-level, aucune I/O au préalable).
// Configurable via env : APP_CALL_SIGNAL_MAX_PER_MINUTE (par session).
const signalRateGuard = createSignalRateGuard({
  maxPerMinute: parseIntSafe(process.env.APP_CALL_SIGNAL_MAX_PER_MINUTE, 180),
});

function parseIntSafe(raw: string | undefined, fallback: number): number {
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    logServerCallEvent({
      level: "warn",
      event: "CALL_UNAUTHORIZED",
      callId: id,
      details: { path: "/api/app-calls/[id]/signal" },
    });
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

  const validation = validateSignalPayload(body?.payload);
  if (!validation.valid) {
    logServerCallEvent({
      level: "warn",
      event: "SIGNAL_REJECTED",
      callId: id,
      details: { userId, reason: validation.reason },
    });
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }
  const payload = body.payload as SignalPayload;

  const appCall = await prisma.appCallSession.findUnique({ where: { id } });
  if (!appCall) {
    logServerCallEvent({
      level: "debug",
      event: "CALL_NOT_FOUND",
      callId: id,
      details: { path: "/api/app-calls/[id]/signal" },
    });
    // 404 (pas 403) : ni l'existence d'un callId ni sa visibilité ne sont
    // révélées à un utilisateur hors session/org.
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }
  if (appCall.organizationId !== orgId) {
    logServerCallEvent({
      level: "warn",
      event: "CALL_ACCESS_DENIED",
      callId: id,
      details: { userId, reason: "CROSS_ORGANIZATION" },
    });
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const isCaller = appCall.callerId === userId;
  const isCallee = appCall.calleeId === userId;
  if (!isCaller && !isCallee) {
    // Idem : non-participant → 404 (anti-énumération).
    logServerCallEvent({
      level: "warn",
      event: "CALL_ACCESS_DENIED",
      callId: id,
      details: { userId, reason: "NOT_PARTICIPANT" },
    });
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  // Session terminale → plus aucun signal client accepté.
  if (TERMINAL.includes(appCall.status as (typeof TERMINAL)[number])) {
    return NextResponse.json({ error: "Call already ended" }, { status: 409 });
  }

  if (!isSignalAllowedForState({ sessionStatus: appCall.status, isCaller, signalType: payload.type })) {
    logServerCallEvent({
      level: "warn",
      event: "SIGNAL_NOT_ALLOWED",
      callId: id,
      details: {
        userId,
        signalType: payload.type,
        sessionStatus: appCall.status,
      },
    });
    return NextResponse.json(
      { error: "Signal not allowed in current state" },
      { status: 409 }
    );
  }

  // Garde anti-flood : budget de signaux par session (borne coût Pusher).
  if (!signalRateGuard.allow(`session:${id}`)) {
    logServerCallEvent({
      level: "warn",
      event: "SIGNAL_RATE_LIMITED",
      callId: id,
      details: { userId, signalType: payload.type },
    });
    if (signalRateGuard.shouldLogAbuse(`session:${id}`)) {
      // Log borné (au plus 1/min/session) pour l'audit trail anti-abus.
      await logAppCallDecision(orgId, userId, "ABUSE_DETECTED", {
        reason: "SIGNAL_RATE_LIMIT",
        sessionId: id,
        type: payload.type,
      });
    }
    return NextResponse.json(
      { error: "Too many signals — slow down" },
      { status: 429 }
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
    logServerCallEvent({
      level: "error",
      event: "SIGNAL_PUBLISH_FAILED",
      callId: id,
      details: { userId, signalType: payload.type, peerId },
    });
    console.error("[app-calls/signal] trigger failed", {
      sessionId: id,
      callerId: appCall.callerId,
      calleeId: appCall.calleeId,
      organizationId: orgId,
      type: payload.type,
    }, err);
    return NextResponse.json({ error: "Signal publish failed" }, { status: 500 });
  }

  // Événement de succès : ICE_CANDIDATE en debug (verbeux par nature) pour ne
  // pas noyer les logs des appels longs ; les autres types en info.
  logServerCallEvent({
    level: payload.type === "ICE_CANDIDATE" ? "debug" : "info",
    event: "SIGNAL_RELAYED",
    callId: id,
    details: { userId, signalType: payload.type, peerId },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}