import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const RECONCILIATION_WINDOW_MS = 3 * 60 * 1000;

/**
 * GET /api/telnyx/active-call
 * Reconcilation (scénario I) : si le navigateur s'ouvre APRÈS l'arrivée d'un
 * appel PSTN entrant (`pstn:incoming` Pusher déjà perdu), on retrouve le
 * dernier callLog INBOUND INITIATED du tenant et on vérifie qu'il était routé
 * vers CET utilisateur (même logique que le webhook). Retourne le même payload
 * que `pstn:incoming` pour alimenter l'UI de sonnerie, ou `{ call: null }`.
 *
 * Sécurité : aucune donnée hors du tenant du user n'est retournée.
 * Un appel déjà répondu / terminé est exclu (status ≠ INITIATED).
 */
export async function GET() {
  const session = await auth();
  const organizationId = session?.user?.organizationId;
  if (!session?.user?.id || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const callLog = await prisma.callLog.findFirst({
    where: {
      organizationId,
      direction: "INBOUND",
      status: "INITIATED",
      startedAt: { gte: new Date(Date.now() - RECONCILIATION_WINDOW_MS) },
    },
    orderBy: { startedAt: "desc" },
    include: {
      phoneNumber: {
        include: { assignedUser: { select: { id: true } } },
      },
    },
  });

  if (!callLog?.phoneNumber) {
    return NextResponse.json({ call: null });
  }

  // Miroir du routage du webhook : assignedUser sinon premier user de l'org.
  let recipientId: string | null = callLog.phoneNumber.assignedUser?.id ?? null;
  if (!recipientId) {
    const firstUser = await prisma.user.findFirst({
      where: { organizationId },
      select: { id: true },
    });
    recipientId = firstUser?.id ?? null;
  }

  if (recipientId !== userId) {
    return NextResponse.json({ call: null });
  }

  return NextResponse.json({
    call: {
      callControlId: callLog.telnyxCallControlId,
      from: callLog.fromNumber,
      to: callLog.toNumber,
      phoneNumberId: callLog.phoneNumberId,
      organizationId: callLog.organizationId,
      callerName: null,
    },
  });
}