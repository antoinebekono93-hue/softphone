import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTenantTwilioClient } from "@/lib/twilio-tenant";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/utils";

/**
 * POST /api/phone/provision
 *
 * Purchases a phone number and assigns it to the organization.
 * Body: { phoneNumber: string, country?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phoneNumber, friendlyName } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Check plan limits
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: {
        phoneNumbers: { where: { status: "ACTIVE" } },
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const limits = getPlanLimits(org.plan);

    if (org.phoneNumbers.length >= limits.maxPhoneNumbers) {
      return NextResponse.json(
        {
          error: `Your ${org.plan} plan allows a maximum of ${limits.maxPhoneNumbers} phone number(s). Please upgrade your plan.`,
        },
        { status: 403 }
      );
    }

    // Purchase the number via tenant's Twilio subaccount
    const tenant = await getTenantTwilioClient(session.user.organizationId);

    const purchased = await tenant.client.incomingPhoneNumbers.create({
      phoneNumber,
      voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/webhook`,
      voiceMethod: "POST",
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/status`,
      statusCallbackMethod: "POST",
    });

    // Save to database
    const dbNumber = await prisma.phoneNumber.create({
      data: {
        number: purchased.phoneNumber,
        friendlyName: friendlyName || purchased.friendlyName,
        twilioSid: purchased.sid,
        country: purchased.isoCountry,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(dbNumber, { status: 201 });
  } catch (error) {
    console.error("[Phone Provision] Error:", error);
    return NextResponse.json(
      { error: "Failed to provision phone number" },
      { status: 500 }
    );
  }
}
