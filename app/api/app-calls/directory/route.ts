import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Annuaire d'appel APP_TO_APP : liste les utilisateurs CALLABLES de la MÊME
 * organisation (MVP intra-org uniquement — pas d'annuaire inter-org public).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      organizationId: session.user.organizationId,
      isCallable: true,
      OR: [{ callUsername: { not: null } }, { callExtension: { not: null } }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      callUsername: true,
      callExtension: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users });
}
