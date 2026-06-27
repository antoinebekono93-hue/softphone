import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") || "US";

  // We need the org's Telnyx API Key if available
  const org = await prisma.organization.findFirst();
  const apiKey = org?.telnyxApiKey || process.env.TELNYX_API_KEY;

  try {
    if (apiKey) {
      const response = await fetch(`https://api.telnyx.com/v2/available_phone_numbers?filter[country_code]=${country}&filter[limit]=8`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        const numbers = data.data.map((n: any) => ({
          phone_number: n.phone_number,
          country_code: n.country_code,
          features: n.features,
          cost: 2.00 // In reality, fetch from pricing API, using 2.00 as standard
        }));
        return NextResponse.json({ numbers });
      }
    }

    // Fallback Mock Data for local dev if API fails or is not provided
    console.warn("[Telnyx API] Using mock data for phone numbers search (No valid API Key or Request Failed)");
    const mockNumbers = Array.from({ length: 8 }).map((_, i) => {
      const prefix = country === "FR" ? "+331" : country === "GB" ? "+4420" : "+1";
      const randomPart = Math.floor(Math.random() * 100000000).toString().padStart(8, "0");
      return {
        phone_number: `${prefix}${randomPart}`,
        country_code: country,
        features: ["sms", "voice"],
        cost: 2.00
      };
    });
    
    return NextResponse.json({ numbers: mockNumbers });

  } catch (error) {
    console.error("[Telnyx Search Error]", error);
    return NextResponse.json({ error: "Failed to search numbers" }, { status: 500 });
  }
}
