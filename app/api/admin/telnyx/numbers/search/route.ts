import { NextResponse } from "next/server";
import { getConfiguredTelnyxClient } from "@/lib/telnyx";
import { requireSuperAdminApi } from "@/lib/security";
import { prisma } from "@/lib/prisma";
import { resellerNumberPrice } from "@/lib/telnyx-number-pricing";

export async function GET(req: Request) {
  try {
    // 1. Security Check: Only allow Super Admins
    const guard = await requireSuperAdminApi();
    if (guard) return guard;

    // 2. Extract search parameters from the URL
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get("country_code") || "US";
    const requestedLimit = Number(searchParams.get("limit") || "10");
    const limit = Number.isInteger(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 50)) : 10;
    const features = searchParams.get("features"); // e.g., "sms,voice"

    // 4. Call Telnyx Number Search API Query
    let queryOptions: any = {
      "filter[country_code]": countryCode,
      "filter[limit]": limit,
    };

    if (features) {
      queryOptions["filter[features]"] = features.split(",");
    }

    // Example additional filters you can add later:
    // "filter[national_destination_code]": "212" // Area code

    // 5. Fetch available numbers from Telnyx
    console.log(`Searching Telnyx for numbers in ${countryCode}...`);
    const [telnyx, settings] = await Promise.all([
      getConfiguredTelnyxClient(),
      prisma.systemSettings.findUnique({ where: { id: "default" } }),
    ]);
    const response = await telnyx.availablePhoneNumbers.list(queryOptions);

    const numbers = (response.data || []).flatMap((number: any) => {
      const retailPrice = resellerNumberPrice({
        costInformation: number.cost_information,
        multiplier: settings?.phoneNumberMarkupMultiplier ?? 2.5,
        fixedMarkup: settings?.phoneNumberMarkupFixed ?? 0,
      });
      return retailPrice === null ? [] : [{ ...number, retail_price: retailPrice }];
    });

    return NextResponse.json({ numbers }, { status: 200 });
    
  } catch (error: any) {
    console.error("Error searching Telnyx numbers:", error);
    return NextResponse.json(
      { error: "Failed to search numbers", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
