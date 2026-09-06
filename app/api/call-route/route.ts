import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveCallDestination } from "@/lib/call-routing";
import { logServerCallEvent } from "@/lib/app-call-observability";

export const dynamic = "force-dynamic";

/**
 * Endpoint UNIQUE de routage d'appel (source de vérité serveur).
 *
 * Renvoie la décision explicite : APP_TO_APP (utilisateur plateforme) ou
 * APP_TO_PSTN (destination E.164). Le client ne décide jamais lui-même du type
 * d'appel : il soumet sa saisie ici puis agit selon la réponse.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    logServerCallEvent({
      level: "warn",
      event: "CALL_UNAUTHORIZED",
      details: { path: "/api/call-route" },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { target?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await resolveCallDestination({
    callerId: session.user.id,
    organizationId: session.user.organizationId,
    target: body.target ?? "",
  });

  if (result.type === "ERROR") {
    logServerCallEvent({
      level: "warn",
      event: "CALL_TARGET_ROUTING_FAILED",
      details: { userId: session.user.id, reason: result.reason },
    });
    const status =
      result.reason === "UNAUTHORIZED"
        ? 401
        : result.reason === "EMPTY_TARGET" || result.reason === "INVALID_TARGET"
        ? 400
        : result.reason === "SELF_CALL"
        ? 400
        : 403;
    return NextResponse.json({ error: result.reason }, { status });
  }

  if (result.type === "APP_TO_PSTN" && !result.destination) {
    return NextResponse.json({ error: "EMPTY_TARGET" }, { status: 400 });
  }

  logServerCallEvent({
    level: "debug",
    event: "CALL_TARGET_ROUTED",
    details: {
      userId: session.user.id,
      routeType: result.type,
    },
  });

  return NextResponse.json({ route: result }, { status: 200 });
}
