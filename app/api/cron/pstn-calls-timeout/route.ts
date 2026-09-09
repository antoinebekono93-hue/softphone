import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/security";
import { getConfiguredTelnyxClient } from "@/lib/telnyx";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!requireCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const activeCalls = await prisma.callLog.findMany({
      where: { status: "IN_PROGRESS", answeredAt: { not: null }, endedAt: null },
      select: {
        telnyxCallControlId: true,
        answeredAt: true,
        organization: { select: { pricingPlan: { select: { maxCallDurationSeconds: true } } } },
      },
      orderBy: { answeredAt: "asc" },
      take: 250,
    });
    const overdue = activeCalls.filter((call) => {
      const maximum = call.organization.pricingPlan?.maxCallDurationSeconds ?? 3600;
      return Boolean(call.answeredAt && Date.now() - call.answeredAt.getTime() >= maximum * 1000);
    });
    if (overdue.length === 0) return NextResponse.json({ success: true, inspected: activeCalls.length, terminated: 0 });

    const telnyx = await getConfiguredTelnyxClient();
    const failures: string[] = [];
    let terminated = 0;
    for (const callLog of overdue) {
      try {
        await telnyx.calls.actions.hangup(callLog.telnyxCallControlId, { command_id: randomUUID() });
        terminated++;
      } catch (error) {
        failures.push(callLog.telnyxCallControlId);
        console.error("[PSTN Timeout] Unable to hang up overdue call", callLog.telnyxCallControlId, error);
      }
    }
    return NextResponse.json(
      { success: failures.length === 0, inspected: activeCalls.length, terminated, failures },
      { status: failures.length === 0 ? 200 : 207 },
    );
  } catch (error) {
    console.error("[PSTN Timeout]", error);
    return NextResponse.json({ error: "PSTN_TIMEOUT_FAILED" }, { status: 500 });
  }
}
