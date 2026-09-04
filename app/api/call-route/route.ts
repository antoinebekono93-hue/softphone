import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveCallDestination } from "@/lib/call-routing";

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
    const status =
      result.reason === "UNAUTHORIZED"
        ? 401
        : result.reason === "EMPTY_TARGET"
        ? 400
        : result.reason === "SELF_CALL"
        ? 400
        : 403;
    return NextResponse.json({ error: result.reason }, { status });
  }

  if (result.type === "APP_TO_PSTN" && !result.destination) {
    return NextResponse.json({ error: "EMPTY_TARGET" }, { status: 400 });
  }

  return NextResponse.json({ route: result }, { status: 200 });
}
