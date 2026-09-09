import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getConfiguredTelnyxClient } from "@/lib/telnyx";
import { preAuthorizeCall, releasePstnReservation } from "@/lib/pstn-billing";
import { clampForwardDuration, evaluateForwardDestination, shouldClaimForward, wouldCreateForwardLoop } from "@/lib/pstn-forwarding-policy";

const ACTIVE_FORWARD_STATUSES = ["PREAUTHORIZED", "INITIATED", "FORWARDING", "IN_PROGRESS"];

function clientState(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

async function failForward(parent: any, childId: string | null, reason: string) {
  if (childId) {
    await prisma.callLog.updateMany({ where: { id: childId }, data: { status: "FAILED", endedAt: new Date() } });
    await releasePstnReservation({
      organizationId: parent.organizationId,
      callControlId: parent.forwardCommandId,
      callLogId: childId,
      reason,
    }).catch(() => undefined);
  }
  await releasePstnReservation({
    organizationId: parent.organizationId,
    callControlId: parent.telnyxCallControlId,
    callLogId: parent.id,
    reason,
  }).catch(() => undefined);
  await prisma.callLog.updateMany({
    where: { id: parent.id, forwardStatus: { in: ["STARTING", "SCHEDULED"] } },
    data: { forwardStatus: "FAILED", status: "FAILED", endedAt: new Date(), hangupCause: reason },
  });
  try {
    const telnyx = await getConfiguredTelnyxClient();
    await telnyx.calls.actions.hangup(parent.telnyxCallControlId, { command_id: crypto.randomUUID() });
  } catch (error) {
    console.error(`[PSTN Forward] Unable to terminate inbound leg (${reason})`, error);
  }
}

export async function executePstnForward(inboundCallLogId: string) {
  const now = new Date();
  const snapshot = await prisma.callLog.findUnique({ where: { id: inboundCallLogId } });
  if (!snapshot || !shouldClaimForward({ callStatus: snapshot.status, forwardStatus: snapshot.forwardStatus, dueAt: snapshot.forwardDueAt, now })) {
    return { started: false, reason: "NOT_DUE_OR_ALREADY_CLAIMED" };
  }
  const claimed = await prisma.callLog.updateMany({
    where: {
      id: inboundCallLogId,
      status: { in: ["INITIATED", "RINGING"] },
      forwardStatus: "SCHEDULED",
      forwardDueAt: { lte: now },
    },
    data: { status: "FORWARDING", forwardStatus: "STARTING", forwardStartedAt: now },
  });
  if (claimed.count !== 1) return { started: false, reason: "ALREADY_CLAIMED" };

  const parent = await prisma.callLog.findUnique({
    where: { id: inboundCallLogId },
    include: {
      phoneNumber: true,
      organization: { include: { pricingPlan: true } },
      forwardedCallLog: { include: { reservation: true } },
    },
  });
  if (!parent?.phoneNumber || !parent.forwardToE164 || !parent.forwardCommandId) return { started: false, reason: "INVALID_FORWARD_STATE" };
  const phoneNumber = parent.phoneNumber;
  const forwardToE164 = parent.forwardToE164;
  const forwardCommandId = parent.forwardCommandId;
  const plan = parent.organization.pricingPlan;
  if (!plan || !plan.hasCallRouting || !plan.hasTransfer || ["UNPAID", "SUSPENDED"].includes(parent.organization.planStatus)) {
    await failForward(parent, null, "FORWARDING_NOT_INCLUDED");
    return { started: false, reason: "FORWARDING_NOT_INCLUDED" };
  }
  const policy = evaluateForwardDestination({
    destination: forwardToE164,
    sourceCountry: phoneNumber.country,
    internationalEnabled: plan.internationalEnabled,
    allowedDestinations: plan.allowedDestinations,
    blockedDestinations: plan.blockedDestinations,
  });
  if (!policy.authorized) {
    await failForward(parent, null, policy.reason);
    return { started: false, reason: policy.reason };
  }
  const routes = await prisma.phoneNumber.findMany({
    where: { organizationId: parent.organizationId, status: "ACTIVE" },
    select: { number: true, forwardToE164: true, incomingRoutingEnabled: true, incomingRoutingMode: true },
  });
  if (wouldCreateForwardLoop(phoneNumber.number, forwardToE164, routes)) {
    await failForward(parent, null, "FORWARD_LOOP_BLOCKED");
    return { started: false, reason: "FORWARD_LOOP_BLOCKED" };
  }
  const attemptId = crypto.randomUUID();
  const provisionalControlId = `pending:${attemptId}`;
  const admission = await prisma.$transaction(async (tx) => {
    // Serialize admissions for one tenant. This makes the concurrency/hour/day
    // check and child-leg creation one atomic decision.
    await tx.$queryRaw`SELECT "id" FROM "Organization" WHERE "id" = ${parent.organizationId} FOR UPDATE`;
    const [active, hourly, daily, existing] = await Promise.all([
      tx.callLog.count({ where: { organizationId: parent.organizationId, direction: "FORWARD", status: { in: ACTIVE_FORWARD_STATUSES } } }),
      tx.callLog.count({ where: { organizationId: parent.organizationId, direction: "FORWARD", startedAt: { gte: new Date(now.getTime() - 3600000) } } }),
      tx.callLog.count({ where: { organizationId: parent.organizationId, direction: "FORWARD", startedAt: { gte: new Date(now.getTime() - 86400000) } } }),
      tx.callLog.findUnique({ where: { parentCallLogId: parent.id }, include: { reservation: true } }),
    ]);
    // A recovered STARTING lease may already have created its child leg. Reuse
    // it before evaluating quotas so the leg never counts against itself.
    if (existing) return { child: existing, reason: null };
    const reason = active >= plan.maxConcurrentCalls ? "MAX_CONCURRENT_CALLS"
      : hourly >= plan.maxCallsPerHour ? "MAX_CALLS_PER_HOUR"
      : daily >= plan.maxCallsPerDay ? "MAX_CALLS_PER_DAY" : null;
    if (reason) return { child: null, reason };
    const child = await tx.callLog.create({
      data: {
        telnyxCallControlId: provisionalControlId,
        direction: "FORWARD",
        callPurpose: "PSTN_FORWARD",
        fromNumber: phoneNumber.number,
        toNumber: forwardToE164,
        organizationId: parent.organizationId,
        phoneNumberId: phoneNumber.id,
        userId: phoneNumber.assignedUserId,
        parentCallLogId: parent.id,
        status: "PREAUTHORIZED",
      },
      include: { reservation: true },
    });
    return { child, reason: null };
  });
  if (!admission.child) {
    await failForward(parent, null, admission.reason || "FORWARD_ADMISSION_DENIED");
    return { started: false, reason: admission.reason || "FORWARD_ADMISSION_DENIED" };
  }
  const child = await prisma.callLog.findUnique({
    where: { id: admission.child.id },
    include: { reservation: true },
  });
  if (!child) {
    await failForward(parent, null, "FORWARD_CHILD_MISSING");
    return { started: false, reason: "FORWARD_CHILD_MISSING" };
  }
  // If the provider call ID was persisted before a worker crash, the Dial was
  // already accepted. Do not create a second billable leg during recovery.
  if (!child.telnyxCallControlId.startsWith("pending:")) {
    await prisma.callLog.update({ where: { id: parent.id }, data: { forwardStatus: "DIALING" } });
    return { started: true, outboundCallControlId: child.telnyxCallControlId, recovered: true };
  }
  const outboundAttemptId = child.telnyxCallControlId.slice("pending:".length);
  if (!child.reservation) {
    const authorization = await preAuthorizeCall({
      organizationId: parent.organizationId,
      callControlId: forwardCommandId,
      callLogId: child.id,
      rateProfile: "STANDARD",
    });
    if (!authorization.authorized) {
      await failForward(parent, child.id, authorization.reason || "PREAUTH_DENIED");
      return { started: false, reason: authorization.reason || "PREAUTH_DENIED" };
    }
  }

  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: "default" }, select: { telnyxConnectionId: true } });
    const connectionId = settings?.telnyxConnectionId?.trim() || process.env.TELNYX_SIP_CONNECTION_ID?.trim();
    if (!connectionId) throw new Error("TELNYX_CONNECTION_NOT_CONFIGURED");
    const telnyx = await getConfiguredTelnyxClient();
    await telnyx.calls.actions.answer(parent.telnyxCallControlId, { command_id: `${forwardCommandId}-answer` });
    const dial = await telnyx.calls.dial({
      connection_id: connectionId,
      from: phoneNumber.number,
      to: forwardToE164,
      link_to: parent.telnyxCallControlId,
      bridge_on_answer: true,
      prevent_double_bridge: true,
      timeout_secs: 30,
      time_limit_secs: clampForwardDuration(plan.maxCallDurationSeconds),
      command_id: forwardCommandId,
      client_state: clientState({ outboundAttemptId, rateProfile: "STANDARD", forwardParentCallLogId: parent.id }),
    });
    const outboundControlId = dial?.data?.call_control_id;
    if (typeof outboundControlId === "string" && outboundControlId) {
      await prisma.callLog.updateMany({ where: { id: child.id, telnyxCallControlId: provisionalControlId }, data: { telnyxCallControlId: outboundControlId, status: "INITIATED" } });
    }
    await prisma.callLog.update({ where: { id: parent.id }, data: { forwardStatus: "DIALING" } });
    return { started: true, outboundCallControlId: outboundControlId || null };
  } catch (error) {
    await failForward(parent, child.id, "TELNYX_FORWARD_DIAL_FAILED");
    console.error("[PSTN Forward] Dial failed", error);
    return { started: false, reason: "TELNYX_FORWARD_DIAL_FAILED" };
  }
}

export async function processDuePstnForwards(limit = 25) {
  // A worker may die after claiming but before persisting the Dial response.
  // Both provider commands use stable command IDs, so replay after this lease
  // expires is safe and Telnyx deduplicates it.
  await prisma.callLog.updateMany({
    where: {
      forwardStatus: "STARTING",
      status: "FORWARDING",
      forwardStartedAt: { lte: new Date(Date.now() - 2 * 60 * 1000) },
    },
    data: { forwardStatus: "SCHEDULED", status: "RINGING", forwardDueAt: new Date() },
  });
  const due = await prisma.callLog.findMany({
    where: { forwardStatus: "SCHEDULED", forwardDueAt: { lte: new Date() }, status: { in: ["INITIATED", "RINGING"] } },
    select: { id: true },
    orderBy: { forwardDueAt: "asc" },
    take: Math.max(1, Math.min(limit, 100)),
  });
  const results = [];
  for (const call of due) results.push(await executePstnForward(call.id));
  return { scanned: due.length, started: results.filter((item) => item.started).length };
}
