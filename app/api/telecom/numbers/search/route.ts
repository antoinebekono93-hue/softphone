import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSystemSettings } from "@/lib/settings";

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

  let apiKey = process.env.TELNYX_API_KEY;
  try {
    const org = await prisma.organization.findUnique({ where: { id: session.user.organizationId } });
    if (org?.telnyxApiKey) {
      apiKey = org.telnyxApiKey;
    }
  } catch (dbError) {
    console.warn("Could not fetch org API key from DB, falling back to ENV.", dbError);
  }

  if (!apiKey) {
    return NextResponse.json({ error: "No Telnyx API key configured" }, { status: 500 });
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
      const settings = await getSystemSettings();
      const multiplier = settings?.phoneNumberMarkupMultiplier || 2.5;
      const fixedMarkup = settings?.phoneNumberMarkupFixed || 0.0;

      const numbers = data.data.map((n: any) => {
        let baseCost = 2.00;
        if (n.cost_information?.upfront_cost) {
            baseCost = parseFloat(n.cost_information.upfront_cost);
        } else if (n.cost_information?.monthly_cost) {
            baseCost = parseFloat(n.cost_information.monthly_cost);
        }
        
        // Calculate the marked up cost for the reseller
        const markedUpCost = (baseCost * multiplier) + fixedMarkup;

        return {
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
        }
      });
      return NextResponse.json({ numbers, meta: data.meta });
    }

    // Fallback mock data
    console.warn("[Telnyx API] Using mock data for phone numbers search");
    const mockNumbers = Array.from({ length: parseInt(limit) > 20 ? 20 : parseInt(limit) }).map((_, i) => {
      const prefix = country === "FR" ? "+331" : country === "GB" ? "+4420" : country === "DE" ? "+4930" : "+1";
      const randomPart = Math.floor(Math.random() * 100000000).toString().padStart(8, "0");
      return {
        phone_number: `${prefix}${randomPart}`,
        country_code: country,
        phone_number_type: phoneNumberType || "local",
        features: features.length > 0 ? features : ["sms", "voice"],
        locality: locality || null,
        administrative_area: administrativeArea || null,
        national_destination_code: nationalDestinationCode || null,
        reservable: false,
        quickship: false,
        cost: 2.00,
        cost_information: null,
      };
    });

    return NextResponse.json({ numbers: mockNumbers });

  } catch (error) {
    console.error("[Telnyx Search Error]", error);
    return NextResponse.json({ error: "Failed to search numbers" }, { status: 500 });
  }
}
