import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { parsePhoneNumberWithError, ParseError } from 'libphonenumber-js';

export async function GET(req: Request) {
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

    const contacts = await prisma.contact.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: 'asc' },
      include: { groups: true }
    });

    return NextResponse.json(contacts);
  } catch (error: any) {
    console.error("[/api/contacts GET] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    // 1. Validation stricte E.164 (Phase 2)
    let formattedPhone = "";
    try {
      const phoneNumber = parsePhoneNumberWithError(phone);
      if (!phoneNumber.isValid()) {
        return NextResponse.json({ error: "Le format du numéro de téléphone est invalide." }, { status: 400 });
      }
      formattedPhone = phoneNumber.format('E.164');
    } catch (error) {
      if (error instanceof ParseError) {
        return NextResponse.json({ error: `Validation du téléphone échouée: ${error.message}` }, { status: 400 });
      } else {
        return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
      }
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
