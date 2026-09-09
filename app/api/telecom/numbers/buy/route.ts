import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { purchaseTelnyxNumber } from "@/lib/telnyx-number-purchase";

const ERROR_STATUS: Record<string, number> = {
  INVALID_PHONE_NUMBER: 400,
  ORGANIZATION_NOT_FOUND: 404,
  KYC_NOT_APPROVED: 403,
  NUMBER_ALREADY_MANAGED: 409,
  NUMBER_NO_LONGER_AVAILABLE: 409,
  INSUFFICIENT_FUNDS: 402,
  PHONE_COUNTRY_UNKNOWN: 400,
  TELNYX_API_KEY_NOT_CONFIGURED: 503,
  TELNYX_VOICE_CONNECTION_NOT_CONFIGURED: 503,
  TELNYX_NUMBER_AVAILABILITY_FAILED: 502,
  TELNYX_NUMBER_PRICE_UNAVAILABLE: 502,
  TELNYX_NUMBER_ORDER_REJECTED: 502,
  TELNYX_ORDER_RESULT_UNKNOWN: 502,
  TELNYX_ORDER_ID_MISSING: 502,
  TELNYX_NUMBER_ROUTING_FAILED: 502,
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchaser = await prisma.user.findFirst({
      where: { id: session.user.id, organizationId: session.user.organizationId },
      select: { id: true },
    });
    if (!purchaser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const result = await purchaseTelnyxNumber({
      organizationId: session.user.organizationId,
      phoneNumber: body?.phoneNumber,
      assignedUserId: purchaser.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: result.status === "ACTIVE"
          ? `Numéro ${result.phoneNumber} acheté et activé.`
          : `Commande Telnyx acceptée pour ${result.phoneNumber}. Activation en cours.`,
        orderId: result.orderId,
        status: result.status,
        chargedAmount: result.chargedAmount,
      },
      { status: result.status === "ACTIVE" ? 200 : 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";
    console.error("[Telnyx Number Purchase]", error);
    return NextResponse.json({ error: message }, { status: ERROR_STATUS[message] ?? 500 });
  }
}
