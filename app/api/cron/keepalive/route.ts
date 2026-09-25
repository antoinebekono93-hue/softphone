import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Gardien anti-veille Nhost : exécute un SELECT 1 qui force le pool
 * Prisma/PgBouncer à ouvrir une connexion, ce qui réveille la base si
 * le projet s'est endormi (free tier). Appelé très régulièrement par le
 * cron GitHub Actions — décalé de quelques minutes par rapport au job
 * `frequent` pour répartir les pings.
 */
export async function GET(req: Request) {
  if (!requireCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "alive",
      database: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        status: "degraded",
        database: "error",
        error: e.message,
      },
      { status: 503 }
    );
  }
}