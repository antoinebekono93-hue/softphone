import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPusherServer } from "@/lib/pusher";
import { appCallChannels, APP_CALL_EVENTS } from "@/lib/app-call-channels";
import {
  expireStaleRingingSessions,
  expireOverdueActiveSessions,
} from "@/lib/app-call-session";
import { logServerCallEvent } from "@/lib/app-call-observability";

export const dynamic = "force-dynamic";

/**
 * Reaper des appels APP_TO_APP (M4 + fair-use durée).
 *  - expireStaleRingingSessions : appels jamais décrochés → MISSED (sonnerie).
 *  - expireOverdueActiveSessions : appels ACTIVE au-delà de
 *    maxCallDurationSeconds du plan → ENDED forcé (le client peut être défaillant
 *    ou malveillant : la durée maximale est AUSSI enforce côté serveur).
 * Exécuter périodiquement via Vercel Cron (p. ex. toutes les minutes).
 * Sécurisé par CRON_SECRET ; auto-excludé en dev.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expired = await expireStaleRingingSessions();
    const forceEnded = await expireOverdueActiveSessions();

    // Notifie chaque peer (le sonneur) que l'appel a expiré (MISSED).
    for (const s of expired) {
      logServerCallEvent({
        level: "info",
        event: "CALL_MISSED_TIMEOUT",
        callId: s.sessionId,
        details: { callerId: s.callerId, calleeId: s.calleeId },
      });
      try {
        await getPusherServer()?.trigger(appCallChannels.user(s.callerId), APP_CALL_EVENTS.ENDED, {
          callId: s.sessionId,
          status: "MISSED",
          reason: "timeout",
        });
      } catch (err) {
        console.error("[cron/app-calls-timeout] notify failed", s.sessionId, err);
      }
    }

    // Notifie les DEUX participants qu'un appel ACTIVE a été forcé en ENDED
    // (fair-use maxCallDurationSeconds atteint).
    for (const s of forceEnded) {
      logServerCallEvent({
        level: "info",
        event: "CALL_FORCE_ENDED_MAX_DURATION",
        callId: s.sessionId,
        details: { callerId: s.callerId, calleeId: s.calleeId },
      });
      for (const participantId of [s.callerId, s.calleeId]) {
        try {
          await getPusherServer()?.trigger(
            appCallChannels.user(participantId),
            APP_CALL_EVENTS.ENDED,
            { callId: s.sessionId, status: "ENDED", reason: "max-duration" }
          );
        } catch (err) {
          console.error("[cron/app-calls-timeout] force-end notify failed", s.sessionId, err);
        }
      }
    }

    return NextResponse.json({
      expired: expired.length,
      forceEnded: forceEnded.length,
    });
  } catch (err) {
    console.error("[cron/app-calls-timeout] failed", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

// Keep prisma import referenced (shared module guarantees no tree-shake surprises)
void prisma;