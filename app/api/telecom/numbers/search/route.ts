import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSystemSettings } from "@/lib/settings";
import { resellerNumberPrice } from "@/lib/telnyx-number-pricing";

const API_BASE = 'https://api.telnyx.com/v2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Required
  const country = searchParams.get("country") || "US";

  // Standard filters
  const phoneNumberType = searchParams.get("type"); // local, toll_free, national, mobile
  const features = searchParams.getAll("features"); // sms, voice, mms, fax, emergency
  const nationalDestinationCode = searchParams.get("area_code"); // NPA / area code
  const locality = searchParams.get("locality"); // city / rate center
  const administrativeArea = searchParams.get("state"); // US/CA state/province

  // Advanced filters
  const startsWith = searchParams.get("starts_with");
  const endsWith = searchParams.get("ends_with");
  const contains = searchParams.get("contains");
  const quickship = searchParams.get("quickship");
  const bestEffort = searchParams.get("best_effort");
  const reservable = searchParams.get("reservable");
  const limit = searchParams.get("limit") || "20";

  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSystemSettings();
  const apiKey = settings?.telnyxApiKey?.trim() || process.env.TELNYX_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({ error: "TELNYX_API_KEY_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    // Build query params
    const params = new URLSearchParams();
    params.set('filter[country_code]', country);
    params.set('filter[limit]', limit);

    if (phoneNumberType) params.set('filter[phone_number_type]', phoneNumberType);
    if (nationalDestinationCode) params.set('filter[national_destination_code]', nationalDestinationCode);
    if (locality) params.set('filter[locality]', locality);
    if (administrativeArea) params.set('filter[administrative_area]', administrativeArea);
    if (startsWith) params.set('filter[starts_with]', startsWith);
    if (endsWith) params.set('filter[ends_with]', endsWith);
    if (contains) params.set('filter[contains]', contains);
    if (quickship) params.set('filter[quickship]', quickship);
    if (bestEffort) params.set('filter[best_effort]', bestEffort);
    if (reservable) params.set('filter[reservable]', reservable);
    if (features.length > 0) {
      params.set('filter[features]', features.join(','));
    }

    const response = await fetch(`${API_BASE}/available_phone_numbers?${params.toString()}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });

    if (response.ok) {
      const data = await response.json();
      const multiplier = settings?.phoneNumberMarkupMultiplier ?? 2.5;
      const fixedMarkup = settings?.phoneNumberMarkupFixed ?? 0;

      const numbers = (Array.isArray(data.data) ? data.data : []).flatMap((n: any) => {
        const markedUpCost = resellerNumberPrice({
          costInformation: n.cost_information,
          multiplier,
          fixedMarkup,
        });
        // Never invent a price. An item without provider cost cannot be sold.
        if (markedUpCost === null) return [];
        return [{
          phone_number: n.phone_number,
          country_code: n.country_code,
          phone_number_type: n.phone_number_type,
          features: n.features,
          locality: n.locality,
          administrative_area: n.administrative_area,
          national_destination_code: n.national_destination_code,
          reservable: n.reservable,
          quickship: n.quickship,
          cost: markedUpCost, // The new margin-adjusted cost
          cost_information: n.cost_information || null, // Keep original for reference
        }];
      });
      return NextResponse.json({ numbers, meta: data.meta });
    }

    const upstream = await response.text().catch(() => "");
    console.error("[Telnyx Search Error]", response.status, upstream.slice(0, 500));
    return NextResponse.json(
      { error: "TELNYX_NUMBER_SEARCH_FAILED" },
      { status: response.status >= 400 && response.status < 500 ? response.status : 502 },
    );

  } catch (error) {
    console.error("[Telnyx Search Error]", error);
    return NextResponse.json({ error: "Failed to search numbers" }, { status: 500 });
  }
}
