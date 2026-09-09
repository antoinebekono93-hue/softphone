import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageIncomingRouting, normalizeIncomingRouting, wouldCreateForwardLoop } from "@/lib/pstn-forwarding-policy";

async function ownedNumber(id: string, user: { id: string; organizationId?: string | null; isSuperAdmin?: boolean; role?: string | null }) {
  const phoneNumber = await prisma.phoneNumber.findUnique({
    where: { id },
    include: { organization: { include: { pricingPlan: true } } },
  });
  if (!phoneNumber) return null;
  return canManageIncomingRouting({
    userId: user.id,
    userOrganizationId: user.organizationId,
    isSuperAdmin: user.isSuperAdmin,
    role: user.role,
    numberOrganizationId: phoneNumber.organizationId,
    assignedUserId: phoneNumber.assignedUserId,
  }) ? phoneNumber : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const phoneNumber = await ownedNumber((await params).id, session.user);
  if (!phoneNumber) return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
  return NextResponse.json({
    phoneNumberId: phoneNumber.id,
    mode: phoneNumber.incomingRoutingMode,
    forwardToE164: phoneNumber.forwardToE164,
    ringAppSeconds: phoneNumber.ringAppSeconds,
    isEnabled: phoneNumber.incomingRoutingEnabled,
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const phoneNumber = await ownedNumber((await params).id, session.user);
  if (!phoneNumber) return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
  try {
    const routing = normalizeIncomingRouting(await request.json());
    if (routing.mode !== "APP") {
      const plan = phoneNumber.organization.pricingPlan;
      if (!plan?.hasCallRouting || !plan.hasTransfer) {
        return NextResponse.json({ error: "FORWARDING_NOT_INCLUDED" }, { status: 403 });
      }
      const routes = await prisma.phoneNumber.findMany({
        where: { organizationId: phoneNumber.organizationId, status: "ACTIVE" },
        select: { number: true, forwardToE164: true, incomingRoutingEnabled: true, incomingRoutingMode: true },
      });
      if (wouldCreateForwardLoop(phoneNumber.number, routing.forwardToE164!, routes)) {
        return NextResponse.json({ error: "FORWARD_LOOP_BLOCKED" }, { status: 422 });
      }
    }
    const updated = await prisma.phoneNumber.update({
      where: { id: phoneNumber.id },
      data: {
        incomingRoutingMode: routing.mode,
        incomingRoutingEnabled: routing.isEnabled,
        forwardToE164: routing.forwardToE164,
        ringAppSeconds: routing.ringAppSeconds,
      },
      select: { id: true, incomingRoutingMode: true, incomingRoutingEnabled: true, forwardToE164: true, ringAppSeconds: true },
    });
    return NextResponse.json({
      phoneNumberId: updated.id,
      mode: updated.incomingRoutingMode,
      isEnabled: updated.incomingRoutingEnabled,
      forwardToE164: updated.forwardToE164,
      ringAppSeconds: updated.ringAppSeconds,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INVALID_ROUTING_CONFIGURATION";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
