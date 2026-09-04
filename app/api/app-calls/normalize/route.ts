import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ResolveResult =
  | { found: true; user: { id: string; name: string | null; callUsername: string | null; callExtension: string | null } }
  | { found: false };

/**
 * Résolution backend d'une cible d'appel APP_TO_APP saisie au clavier
 * (username, extension ou email) vers un utilisateur de la MÊME organisation.
 * La résolution se fait UNIQUEMENT côté serveur (jamais dans le navigateur).
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

  const raw = (body.target ?? "").trim();
  if (!raw) {
    return NextResponse.json({ found: false } satisfies ResolveResult, { status: 200 });
  }

  const orgId = session.user.organizationId;
  const lower = raw.toLowerCase();

  // Ne jamais se résoudre soi-même (pas de self-call).
  const user = await prisma.user.findFirst({
    where: {
      organizationId: orgId,
      isCallable: true,
      id: { not: session.user.id },
      OR: [
        { callUsername: { equals: lower } },
        { callExtension: { equals: lower } },
        { email: { equals: lower } },
      ],
    },
    select: { id: true, name: true, callUsername: true, callExtension: true },
  });

  if (!user) {
    return NextResponse.json({ found: false } satisfies ResolveResult, { status: 200 });
  }

  return NextResponse.json({
    found: true,
    user,
  } satisfies ResolveResult);
}
