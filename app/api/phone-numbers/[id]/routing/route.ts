import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  canManageIncomingRouting,
  forwardingPlanDenialPayload,
  normalizeIncomingRouting,
  wouldCreateForwardLoop,
} from "@/lib/pstn-forwarding-policy";
import { normalizeVoicemailSettings, voicemailPlanDenialPayload } from "@/lib/pstn-voicemail-policy";

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
    voicemailEnabled: phoneNumber.voicemailEnabled,
    voicemailDelaySeconds: phoneNumber.voicemailDelaySeconds,
    voicemailGreeting: phoneNumber.voicemailGreeting,
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const phoneNumber = await ownedNumber((await params).id, session.user);
  if (!phoneNumber) return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
  try {
    const body = await request.json();
    const routing = normalizeIncomingRouting(body);
    const voicemail = normalizeVoicemailSettings({
      voicemailEnabled: body.voicemailEnabled ?? phoneNumber.voicemailEnabled,
      voicemailDelaySeconds: body.voicemailDelaySeconds ?? phoneNumber.voicemailDelaySeconds,
      voicemailGreeting: body.voicemailGreeting ?? phoneNumber.voicemailGreeting,
    });
    if (routing.mode !== "APP") {
      const plan = phoneNumber.organization.pricingPlan;
      const denial = forwardingPlanDenialPayload(plan);
      if (denial) {
        return NextResponse.json(denial, { status: 403 });
      }
      const routes = await prisma.phoneNumber.findMany({
        where: { organizationId: phoneNumber.organizationId, status: "ACTIVE" },
        select: { number: true, forwardToE164: true, incomingRoutingEnabled: true, incomingRoutingMode: true },
      });
      if (wouldCreateForwardLoop(phoneNumber.number, routing.forwardToE164!, routes)) {
        return NextResponse.json({ error: "FORWARD_LOOP_BLOCKED" }, { status: 422 });
      }
    }
    if (voicemail.voicemailEnabled) {
      if (routing.mode !== "APP") {
        return NextResponse.json({
          code: "VOICEMAIL_REQUIRES_APP_ROUTING",
          error: "Le répondeur est disponible avec le routage APP uniquement.",
        }, { status: 422 });
      }
      const denial = voicemailPlanDenialPayload(phoneNumber.organization.pricingPlan);
      if (denial) return NextResponse.json(denial, { status: 403 });
    }
    const updated = await prisma.phoneNumber.update({
      where: { id: phoneNumber.id },
      data: {
        incomingRoutingMode: routing.mode,
        incomingRoutingEnabled: routing.isEnabled,
        forwardToE164: routing.forwardToE164,
        ringAppSeconds: routing.ringAppSeconds,
        voicemailEnabled: voicemail.voicemailEnabled,
        voicemailDelaySeconds: voicemail.voicemailDelaySeconds,
        voicemailGreeting: voicemail.voicemailGreeting,
      },
      select: { id: true, incomingRoutingMode: true, incomingRoutingEnabled: true, forwardToE164: true, ringAppSeconds: true, voicemailEnabled: true, voicemailDelaySeconds: true, voicemailGreeting: true },
    });
    return NextResponse.json({
      phoneNumberId: updated.id,
      mode: updated.incomingRoutingMode,
      isEnabled: updated.incomingRoutingEnabled,
      forwardToE164: updated.forwardToE164,
      ringAppSeconds: updated.ringAppSeconds,
      voicemailEnabled: updated.voicemailEnabled,
      voicemailDelaySeconds: updated.voicemailDelaySeconds,
      voicemailGreeting: updated.voicemailGreeting,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INVALID_ROUTING_CONFIGURATION";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
