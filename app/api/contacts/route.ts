import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { name, company, email, phone, notes } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    // 1. Ensure phone starts with + (simplified E.164 format enforcement)
    let formattedPhone = phone.trim().replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // 2. Create the Contact
    const contact = await prisma.contact.create({
      data: {
        name,
        company,
        email,
        phone: formattedPhone,
        notes,
        organizationId: user.organizationId
      }
    });

    // 3. Auto-Linking: Find all existing CallLogs & SmsMessages with this phone number
    // Update them to have this new contactId.
    await prisma.callLog.updateMany({
      where: {
        organizationId: user.organizationId,
        OR: [
          { fromNumber: formattedPhone },
          { toNumber: formattedPhone }
        ],
        contactId: null // Only link if not already linked
      },
      data: {
        contactId: contact.id
      }
    });

    await prisma.smsMessage.updateMany({
      where: {
        organizationId: user.organizationId,
        OR: [
          { fromNumber: formattedPhone },
          { toNumber: formattedPhone }
        ],
        contactId: null
      },
      data: {
        contactId: contact.id
      }
    });

    return NextResponse.json({ contact });
  } catch (error: any) {
    console.error("[CONTACTS_POST] Error:", error);
    // Handle unique constraint failure
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A contact with this phone number already exists in your organization." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
