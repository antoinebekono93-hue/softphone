import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { phoneNumber, cost } = await request.json();

    if (!phoneNumber || cost === undefined) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // 1. Get current organization
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    // 2. Check wallet balance
    if (org.walletBalance < cost) {
      return NextResponse.json({ error: "Solde insuffisant dans le Wallet. Veuillez recharger votre compte." }, { status: 402 });
    }

    // 3. Fake Telnyx Purchase (Mocking the API call for local dev as requested)
    // In production, we would do:
    // const response = await fetch('https://api.telnyx.com/v2/number_orders', { ... });
    console.log(`[Telnyx API MOCK] Successfully bought number ${phoneNumber} for $${cost}`);
    const fakeTelnyxId = `+1${Math.floor(Math.random() * 1000000000000)}`; // e.g. +1... used as ID for simplicity

    // 4. Database Transaction (Atomic)
    await prisma.$transaction(async (tx) => {
      // 4a. Deduct cost from wallet
      await tx.organization.update({
        where: { id: org.id },
        data: {
          walletBalance: {
            decrement: cost,
          }
        }
      });

      // 4b. Log the transaction
      await tx.walletTransaction.create({
        data: {
          amount: -cost, // Negative for purchases
          type: "NUMBER_PURCHASE",
          description: `Achat du numéro ${phoneNumber}`,
          organizationId: org.id,
        }
      });

      // 4c. Save the new phone number to inventory
      await tx.phoneNumber.create({
        data: {
          number: phoneNumber,
          telnyxId: fakeTelnyxId,
          status: "ACTIVE",
          organizationId: org.id,
        }
      });
    });

    return NextResponse.json({ success: true, message: `Numéro ${phoneNumber} acheté avec succès.` });

  } catch (error) {
    console.error("[Telnyx Buy Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
