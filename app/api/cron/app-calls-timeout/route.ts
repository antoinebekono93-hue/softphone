import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { appCallChannels, APP_CALL_EVENTS } from "@/lib/app-call-channels";
import { expireStaleRingingSessions } from "@/lib/app-call-session";

export const dynamic = "force-dynamic";

/**
 * Reaper des appels APP_TO_APP jamais décrochés (M4).
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

    // Notifie chaque peer (le sonneur) que l'appel a expiré.
    for (const s of expired) {
      try {
        await pusherServer.trigger(appCallChannels.user(s.callerId), APP_CALL_EVENTS.ENDED, {
          callId: s.sessionId,
          status: "MISSED",
          reason: "timeout",
        });
      } catch (err) {
        console.error("[cron/app-calls-timeout] notify failed", s.sessionId, err);
      }
    }

    return NextResponse.json({ expired: expired.length });
  } catch (err) {
    console.error("[cron/app-calls-timeout] failed", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

// Keep prisma import referenced (shared module guarantees no tree-shake surprises)
void prisma;
