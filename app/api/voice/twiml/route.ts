import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/voice/twiml
 *
 * Twilio calls this endpoint when an outbound call is initiated
 * from the Voice SDK. Returns TwiML instructions to connect the call.
 *
 * This is called by Twilio, NOT by the client directly.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const to = formData.get("To") as string;
    const from = formData.get("From") as string;
    const accountSid = formData.get("AccountSid") as string;

    const twiml = new twilio.twiml.VoiceResponse();

    if (!to) {
      twiml.say("No destination number was provided. Goodbye.");
      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Find the organization by subaccount SID
    const org = await prisma.organization.findUnique({
      where: { twilioSubaccountSid: accountSid },
      include: {
        phoneNumbers: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
    });

    // Use the organization's phone number as caller ID
    const callerId = org?.phoneNumbers[0]?.number || from;

    // Check if "To" looks like a phone number or a client identity
    const isPhoneNumber = /^\+?\d{7,15}$/.test(to.replace(/\D/g, ""));

    if (isPhoneNumber) {
      // Dial a PSTN phone number
      const dial = twiml.dial({ callerId });
      dial.number(to.startsWith("+") ? to : `+${to.replace(/\D/g, "")}`);
    } else {
      // Dial another Twilio client
      const dial = twiml.dial({ callerId });
      dial.client(to);
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[TwiML] Error generating TwiML:", error);

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("An application error occurred. Please try again later.");

    return new NextResponse(twiml.toString(), {
      status: 500,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
