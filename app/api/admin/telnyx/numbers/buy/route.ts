import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/security";
import { purchaseTelnyxNumber } from "@/lib/telnyx-number-purchase";

export async function POST(req: Request) {
  const guard = await requireSuperAdminApi();
  if (guard) return guard;

  try {
    const body = await req.json().catch(() => null);
    if (typeof body?.organizationId !== "string" || !body.organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }
    const result = await purchaseTelnyxNumber({
      organizationId: body.organizationId,
      phoneNumber: body.phoneNumber,
      assignedUserId: typeof body.assignedUserId === "string" ? body.assignedUserId : null,
      requireApprovedKyc: true,
    });
    return NextResponse.json(
      { success: true, order: result },
      { status: result.status === "ACTIVE" ? 200 : 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "NUMBER_PURCHASE_FAILED";
    console.error("[Admin Telnyx Number Purchase]", error);
    const status = message === "INSUFFICIENT_FUNDS" ? 402
      : message === "KYC_NOT_APPROVED" ? 403
      : message === "NUMBER_ALREADY_MANAGED" || message === "NUMBER_NO_LONGER_AVAILABLE" ? 409
      : message.startsWith("INVALID_") ? 400
      : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
