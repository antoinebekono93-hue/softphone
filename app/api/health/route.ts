import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/health
 * Endpoint de santé sans authentification (pour monitoring / healthchecks).
 *  - status `ok` → 200, sinon `degraded` → 503.
 * Après ajout d'autres services (Redis, Telnyx), ajouter des checks ici.
 */
export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};
  let healthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (err) {
    console.error("[health] database check failed", err);
    checks.database = "error";
    healthy = false;
  }

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "antigravity-saas",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}