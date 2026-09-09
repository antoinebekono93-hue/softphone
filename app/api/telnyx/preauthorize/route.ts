import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveCallDestination } from "@/lib/call-routing";
import { canonicalizePhoneNumber } from "@/lib/phone-number";
import { preAuthorizeCall, releasePstnReservation } from "@/lib/pstn-billing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const organizationId = session?.user?.organizationId;
  if (!userId || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  const target = typeof body.target === "string" ? body.target : "";
  const requestedCaller = typeof body.callerId === "string"
    ? canonicalizePhoneNumber(body.callerId)
    : null;

  const route = await resolveCallDestination({
    target,
    callerId: userId,
    organizationId,
  });
  if (route.type === "ERROR") {
    return NextResponse.json({ error: route.reason }, { status: 400 });
  }
  if (route.type !== "APP_TO_PSTN") {
    return NextResponse.json({ error: "INTERNAL_CALL_MUST_USE_APP_TO_APP" }, { status: 409 });
  }

  const phoneNumber = await prisma.phoneNumber.findFirst({
    where: {
      organizationId,
      assignedUserId: userId,
      status: "ACTIVE",
      ...(requestedCaller ? { number: requestedCaller } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, number: true },
  });
  if (!phoneNumber) {
    return NextResponse.json({ error: "NO_ACTIVE_CALLER_NUMBER" }, { status: 403 });
  }

  const attemptId = randomUUID();
  const provisionalControlId = `pending:${attemptId}`;
  const callLog = await prisma.callLog.create({
    data: {
      telnyxCallControlId: provisionalControlId,
      direction: "OUTBOUND",
      status: "PREAUTHORIZING",
      fromNumber: phoneNumber.number,
      toNumber: route.destination,
      organizationId,
      userId,
      phoneNumberId: phoneNumber.id,
    },
    select: { id: true },
  });

  try {
    const authorization = await preAuthorizeCall({
      organizationId,
      callControlId: provisionalControlId,
      callLogId: callLog.id,
      rateProfile: "STANDARD",
    });
    if (!authorization.authorized) {
      await prisma.callLog.update({
        where: { id: callLog.id },
        data: { status: "DENIED", endedAt: new Date() },
      });
      return NextResponse.json(
        { error: authorization.reason ?? "CALL_NOT_AUTHORIZED" },
        { status: authorization.reason === "INSUFFICIENT_FUNDS" ? 402 : 403 },
      );
    }
    await prisma.callLog.update({
      where: { id: callLog.id },
      data: { status: "PREAUTHORIZED" },
    });
    const clientState = Buffer.from(JSON.stringify({ outboundAttemptId: attemptId })).toString("base64");
    return NextResponse.json({
      attemptId,
      destination: route.destination,
      callerNumber: phoneNumber.number,
      clientState,
    });
  } catch (error) {
    await releasePstnReservation({
      organizationId,
      callControlId: provisionalControlId,
      callLogId: callLog.id,
      reason: "PREAUTHORIZATION_FAILED",
    }).catch(() => undefined);
    await prisma.callLog.update({
      where: { id: callLog.id },
      data: { status: "FAILED", endedAt: new Date() },
    }).catch(() => {});
    console.error("[PSTN Preauthorization]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "PSTN_PREAUTHORIZATION_FAILED" }, { status: 503 });
  }
}
