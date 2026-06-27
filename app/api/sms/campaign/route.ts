import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const SMS_COST_PER_MESSAGE = 0.007; // 0.7 cents per SMS

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

    const { message, contactIds } = await req.json();

    if (!message || !contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { walletBalance: true }
    });

    if (!org) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    // Calculate cost
    // Very basic assumption: 1 message per contact. 
    // A real implementation would calculate segments based on string length (>160 chars = multiple segments)
    const segments = Math.ceil(message.length / 160) || 1;
    const totalCost = contactIds.length * segments * SMS_COST_PER_MESSAGE;

    if (org.walletBalance < totalCost) {
      return NextResponse.json({ error: `Insufficient funds. Cost: $${totalCost.toFixed(2)}, Balance: $${org.walletBalance.toFixed(2)}` }, { status: 402 });
    }

    // Fetch the contacts to get their phone numbers
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        organizationId: user.organizationId
      }
    });

    // Perform all creations in a transaction
    await prisma.$transaction(async (tx) => {
      // Deduct funds
      await tx.organization.update({
        where: { id: user.organizationId! },
        data: {
          walletBalance: { decrement: totalCost }
        }
      });

      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          amount: -totalCost,
          type: "SMS_CAMPAIGN",
          description: `SMS Campaign to ${contacts.length} contacts (${segments} segment(s) each)`,
          organizationId: user.organizationId!
        }
      });

      // Create SMS Messages
      const smsData = contacts.map(c => ({
        telnyxMessageId: `mock_camp_${Math.random().toString(36).substring(7)}`,
        direction: "OUTBOUND",
        body: message,
        status: "DELIVERED", // Mocking immediate delivery for UX
        type: segments > 1 ? "MMS" : "SMS", // Simplify
        cost: segments * SMS_COST_PER_MESSAGE,
        country: "FR", // Mock
        fromNumber: "+33600000000", // Mock org number
        toNumber: c.phone,
        organizationId: user.organizationId!,
        contactId: c.id
      }));

      await tx.smsMessage.createMany({
        data: smsData
      });
    });

    return NextResponse.json({ success: true, totalCost, messagesSent: contacts.length });
  } catch (error: any) {
    console.error("[SMS_CAMPAIGN] Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
