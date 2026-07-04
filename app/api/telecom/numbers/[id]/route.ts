import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const API_BASE = 'https://api.telnyx.com/v2';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messagingProfileId } = await request.json(); // This is the Prisma CUID of the profile
    const { id: numberId } = await params; // This is the Prisma CUID of the number

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    });
    const apiKey = org?.telnyxApiKey || process.env.TELNYX_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "No Telnyx API key configured" }, { status: 500 });
    }

    // 1. Verify the number belongs to the org
    const phoneNumber = await prisma.phoneNumber.findUnique({
      where: { id: numberId }
    });

    if (!phoneNumber || phoneNumber.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Phone number not found or unauthorized" }, { status: 404 });
    }

    // 2. Fetch the target messaging profile from DB to get its Telnyx ID
    let telnyxMessagingProfileId = null;
    if (messagingProfileId) {
      const targetProfile = await prisma.messagingProfile.findUnique({
        where: { id: messagingProfileId }
      });
      
      if (!targetProfile || targetProfile.organizationId !== session.user.organizationId) {
        return NextResponse.json({ error: "Messaging profile not found" }, { status: 404 });
      }
      telnyxMessagingProfileId = targetProfile.telnyxId;
    }

    // 3. Call Telnyx to update the phone number's messaging profile
    // Note: Telnyx endpoint is /v2/phone_numbers/{telnyxId}
    const telnyxUpdatePayload: any = {};
    if (telnyxMessagingProfileId) {
      telnyxUpdatePayload.messaging_profile_id = telnyxMessagingProfileId;
    } else {
      // To unlink in Telnyx, you typically send a null or empty string, or remove the profile ID
      telnyxUpdatePayload.messaging_profile_id = ""; 
    }

    const res = await fetch(`${API_BASE}/phone_numbers/${phoneNumber.telnyxId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(telnyxUpdatePayload)
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("Telnyx Phone Number Update Error:", errData);
      return NextResponse.json({ error: errData.errors?.[0]?.detail || "Failed to link number in Telnyx" }, { status: res.status });
    }

    // 4. Update in our DB
    const updatedNumber = await prisma.phoneNumber.update({
      where: { id: numberId },
      data: { messagingProfileId: messagingProfileId || null }
    });

    return NextResponse.json({ number: updatedNumber });
  } catch (error: any) {
    console.error("[Phone Number PATCH Error]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
