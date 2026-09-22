import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { waba_id, phoneNumberId, accessToken } = await req.json();

    if (!waba_id || !phoneNumberId || !accessToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the phone number belongs to the organization
    const phone = await prisma.phoneNumber.findFirst({
      where: {
        id: phoneNumberId,
        organizationId: session.user.organizationId
      }
    });

    if (!phone) {
      return NextResponse.json({ error: "Phone number not found or not owned by organization" }, { status: 404 });
    }

    // Check if the organization already has a WhatsApp account
    const existingAccount = await prisma.whatsAppAccount.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    if (existingAccount) {
      return NextResponse.json({ error: "WhatsApp account already exists for this organization" }, { status: 400 });
    }

    // In a real scenario, we would call the Telnyx Tech Provider API here.
    // e.g. POST https://api.telnyx.com/v2/whatsapp_business_accounts
    // using our main SaaS Telnyx API key, passing the `waba_id` and the phone number, 
    // to map it to our billing profile.
    
    // Simulate successful Telnyx mapping
    
    // Create the WhatsApp account in our DB
    const account = await prisma.whatsAppAccount.create({
      data: {
        wabaId: waba_id,
        phoneNumberId: phone.id,
        phoneNumber: phone.number,
        accessToken: accessToken,
        status: "ACTIVE", // Usually PENDING until Telnyx approves, but setting to ACTIVE for MVP
        organizationId: session.user.organizationId
      }
    });

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    console.error("WhatsApp Tech Provider Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // In a real scenario, we would call Telnyx API to unregister the number
    
    await prisma.whatsAppAccount.delete({
      where: { organizationId: session.user.organizationId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("WhatsApp Disconnect Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
