import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantTwilioClient } from "@/lib/twilio-tenant";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/phone/release
 *
 * Releases (deletes) a phone number from the organization.
 * Body: { phoneNumberId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phoneNumberId } = await request.json();

    if (!phoneNumberId) {
      return NextResponse.json(
        { error: "Phone number ID is required" },
        { status: 400 }
      );
    }

    // Verify the number belongs to this organization
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: {
        id: phoneNumberId,
        organizationId: session.user.organizationId,
        status: "ACTIVE",
      },
    });

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number not found" },
        { status: 404 }
      );
    }

    // Release from Twilio
    const tenant = await getTenantTwilioClient(session.user.organizationId);
    await tenant.client
      .incomingPhoneNumbers(phoneNumber.twilioSid)
      .remove();

    // Update database
    await prisma.phoneNumber.update({
      where: { id: phoneNumberId },
      data: { status: "RELEASED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Phone Release] Error:", error);
    return NextResponse.json(
      { error: "Failed to release phone number" },
      { status: 500 }
    );
  }
}
