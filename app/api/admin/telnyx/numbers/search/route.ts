import { NextResponse } from "next/server";
// @ts-ignore
import Telnyx from "telnyx";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    // 1. Security Check: Only allow Super Admins
    // const session = await auth();
    // if (!session?.user || !session.user.isSuperAdmin) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // 2. Extract search parameters from the URL
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get("country_code") || "US";
    const limit = searchParams.get("limit") || "10";
    const features = searchParams.get("features"); // e.g., "sms,voice"

    // 3. Initialize Telnyx Client
    if (!process.env.TELNYX_API_KEY) {
      return NextResponse.json({ error: "Missing Telnyx API Key in environment variables" }, { status: 500 });
    }
    const telnyx = new Telnyx(process.env.TELNYX_API_KEY as string);

    // 4. Construct Telnyx API Query
    let queryOptions: any = {
      "filter[country_code]": countryCode,
      "filter[limit]": parseInt(limit),
    };

    if (features) {
      queryOptions["filter[features]"] = features.split(",");
    }

    // Example additional filters you can add later:
    // "filter[national_destination_code]": "212" // Area code

    // 5. Fetch available numbers from Telnyx
    console.log(`Searching Telnyx for numbers in ${countryCode}...`);
    const response = await telnyx.availablePhoneNumbers.list(queryOptions);

    // 6. Return the raw data array to our frontend
    return NextResponse.json({ numbers: response.data }, { status: 200 });
    
  } catch (error: any) {
    console.error("Error searching Telnyx numbers:", error);
    return NextResponse.json(
      { error: "Failed to search numbers", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
