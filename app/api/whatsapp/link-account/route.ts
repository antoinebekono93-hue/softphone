import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken } = await req.json();
    if (!accessToken) {
      return NextResponse.json({ error: "Missing accessToken" }, { status: 400 });
    }

    // Call Telnyx API to link the WhatsApp Business Account using the Meta Access Token
    const telnyxApiKey = process.env.TELNYX_API_KEY;
    if (!telnyxApiKey) {
      console.error("TELNYX_API_KEY is not configured.");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    console.log(`[WhatsApp Link] Sending access token to Telnyx for org ${session.user.organizationId}...`);

    const telnyxResponse = await fetch("https://api.telnyx.com/v2/whatsapp_embedded_signups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${telnyxApiKey}`
      },
      body: JSON.stringify({ access_token: accessToken })
    });

    if (!telnyxResponse.ok) {
      const errorData = await telnyxResponse.json().catch(() => null);
      console.error("[WhatsApp Link] Telnyx API Error:", errorData);
      return NextResponse.json({ error: "Failed to link WhatsApp account with Telnyx" }, { status: telnyxResponse.status });
    }

    const telnyxData = await telnyxResponse.json();
    console.log("[WhatsApp Link] Success from Telnyx:", telnyxData);

    // Enregistrer les identifiants retournés par Telnyx dans notre base de données
    await prisma.whatsAppAccount.upsert({
      where: { organizationId: session.user.organizationId },
      update: {
        wabaId: telnyxData.data.whatsapp_business_account_id,
        phoneNumberId: telnyxData.data.phone_number_id || "",
        phoneNumber: telnyxData.data.phone_number || "",
        accessToken: accessToken
      },
      create: {
        organizationId: session.user.organizationId,
        wabaId: telnyxData.data.whatsapp_business_account_id,
        phoneNumberId: telnyxData.data.phone_number_id || "",
        phoneNumber: telnyxData.data.phone_number || "",
        accessToken: accessToken
      }
    });

    return NextResponse.json({ success: true, data: telnyxData.data });

  } catch (error: any) {
    console.error("[WhatsApp Link Route Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
