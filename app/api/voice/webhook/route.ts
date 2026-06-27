import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/voice/webhook
 *
 * Twilio calls this endpoint when an incoming call arrives
 * on a phone number owned by one of our tenants.
 * Returns TwiML to route the call to the appropriate client(s).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const to = formData.get("To") as string;
    const from = formData.get("From") as string;
    const callSid = formData.get("CallSid") as string;
    const accountSid = formData.get("AccountSid") as string;

    const twiml = new twilio.twiml.VoiceResponse();

    // Find the phone number and its organization
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: {
        number: to,
        status: "ACTIVE",
      },
      include: {
        organization: {
          include: {
            users: {
              select: { id: true },
            },
          },
        },
        assignedUser: {
          select: { id: true },
        },
      },
    });

    if (!phoneNumber || !phoneNumber.organization) {
      twiml.say(
        "The number you have reached is not in service. Please check the number and try again."
      );
      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const org = phoneNumber.organization;

    // Create a call log for the incoming call
    await prisma.callLog.create({
      data: {
        callSid,
        direction: "INBOUND",
        fromNumber: from,
        toNumber: to,
        organizationId: org.id,
        userId: phoneNumber.assignedUser?.id || org.users[0]?.id,
        phoneNumberId: phoneNumber.id,
      },
    });

    // Determine who should receive the call
    const dial = twiml.dial({
      timeout: 30,
      action: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/status`,
    });

    if (phoneNumber.assignedUser) {
      // Route to the assigned user
      const identity = `org-${org.id}-user-${phoneNumber.assignedUser.id}`;
      dial.client(identity);
    } else {
      // Route to all users in the organization (ring all)
      for (const user of org.users) {
        const identity = `org-${org.id}-user-${user.id}`;
        dial.client(identity);
      }
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[Webhook] Error handling incoming call:", error);

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(
      "We are unable to take your call at this time. Please try again later."
    );

    return new NextResponse(twiml.toString(), {
      status: 500,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
