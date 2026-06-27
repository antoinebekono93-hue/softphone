import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTenantTwilioClient } from "@/lib/twilio-tenant";

/**
 * GET /api/phone/available
 *
 * Searches for available phone numbers to purchase.
 * Query params: country (default: US), areaCode, type (local|tollfree|mobile)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "US";
    const areaCode = searchParams.get("areaCode") || undefined;
    const type = searchParams.get("type") || "local";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const tenant = await getTenantTwilioClient(session.user.organizationId);

    let numbers;
    const searchOptions: Record<string, unknown> = { limit };

    if (areaCode) {
      searchOptions.areaCode = parseInt(areaCode);
    }

    switch (type) {
      case "tollfree":
        numbers = await tenant.client
          .availablePhoneNumbers(country)
          .tollFree.list(searchOptions);
        break;
      case "mobile":
        numbers = await tenant.client
          .availablePhoneNumbers(country)
          .mobile.list(searchOptions);
        break;
      default:
        numbers = await tenant.client
          .availablePhoneNumbers(country)
          .local.list(searchOptions);
    }

    const formatted = numbers.map((n) => ({
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName,
      locality: n.locality,
      region: n.region,
      isoCountry: n.isoCountry,
      capabilities: n.capabilities,
    }));

    return NextResponse.json({ numbers: formatted });
  } catch (error) {
    console.error("[Phone Available] Error:", error);
    return NextResponse.json(
      { error: "Failed to search available numbers" },
      { status: 500 }
    );
  }
}
