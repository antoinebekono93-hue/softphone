import { NextResponse } from "next/server";
// @ts-ignore
import Telnyx from "telnyx";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    // 1. Security Check: Only allow Super Admins
    // const session = await auth();
    // if (!session?.user || !session.user.isSuperAdmin) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // 2. Extract phone number to purchase from the request body
    const body = await req.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // 3. Initialize Telnyx Client
    if (!process.env.TELNYX_API_KEY) {
      return NextResponse.json({ error: "Missing Telnyx API Key" }, { status: 500 });
    }
    const telnyx = new Telnyx(process.env.TELNYX_API_KEY as string);
    const sipConnectionId = process.env.TELNYX_SIP_CONNECTION_ID;

    // 4. Place the order via Telnyx Number Orders API
    console.log(`Placing order for number: ${phoneNumber}...`);
    
    // We order the specific number
    const orderResponse = await telnyx.numberOrders.create({
      phone_numbers: [{ phone_number: phoneNumber }],
      connection_id: sipConnectionId, // Automatically link the number to our SIP connection!
      messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID // Optional: link for SMS
    });

    // 5. In a real application, we would save this to Prisma Database:
    /*
    await prisma.phoneNumber.create({
      data: {
        number: phoneNumber,
        status: "ACTIVE",
        organizationId: "SOME_ORG_ID",
      }
    });
    */

    return NextResponse.json({ success: true, order: orderResponse.data }, { status: 200 });
    
  } catch (error: any) {
    console.error("Error buying Telnyx number:", error);
    
    // Extract Telnyx API error message if available
    let errorMessage = "Failed to purchase number";
    if (error.raw && error.raw.errors && error.raw.errors.length > 0) {
      errorMessage = error.raw.errors[0].detail;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
