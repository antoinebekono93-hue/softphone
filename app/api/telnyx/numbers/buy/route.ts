import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const API_BASE = 'https://api.telnyx.com/v2';

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

    const apiKey = org.telnyxApiKey || process.env.TELNYX_API_KEY;
    const useMock = process.env.TELNYX_MOCK_PURCHASES === 'true';

    let telnyxOrderId: string;
    let telnyxPhoneNumberId: string;

    if (!useMock && apiKey) {
      // ===== REAL PURCHASE via Telnyx Number Orders API =====
      const orderRes = await fetch(`${API_BASE}/number_orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_numbers: [{ phone_number: phoneNumber }],
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        const errorDetail = orderData.errors?.[0]?.detail || 'Failed to purchase number from Telnyx';
        console.error('[Telnyx Buy Error] API Response:', JSON.stringify(orderData));
        return NextResponse.json({ error: errorDetail }, { status: orderRes.status });
      }

      telnyxOrderId = orderData.data?.id || 'unknown';
      // Extract the phone number ID from the order response
      const phoneNumbers = orderData.data?.phone_numbers || [];
      telnyxPhoneNumberId = phoneNumbers[0]?.id || phoneNumber;

      console.log(`[Telnyx API] Successfully ordered number ${phoneNumber} - Order ID: ${telnyxOrderId}`);
    } else {
      // ===== MOCK PURCHASE for local development =====
      console.log(`[Telnyx API MOCK] Successfully bought number ${phoneNumber} for $${cost}`);
      telnyxOrderId = `mock-order-${Date.now()}`;
      telnyxPhoneNumberId = `mock-${phoneNumber.replace(/[^0-9]/g, '')}`;
    }

    // 3. Database Transaction (Atomic)
    await prisma.$transaction(async (tx) => {
      // 3a. Deduct cost from wallet
      await tx.organization.update({
        where: { id: org.id },
        data: {
          walletBalance: {
            decrement: cost,
          }
        }
      });

      // 3b. Log the transaction
      await tx.walletTransaction.create({
        data: {
          amount: -cost,
          type: "NUMBER_PURCHASE",
          description: `Achat du numéro ${phoneNumber}`,
          organizationId: org.id,
        }
      });

      // 3c. Save the new phone number to inventory
      await tx.phoneNumber.create({
        data: {
          number: phoneNumber,
          telnyxId: telnyxPhoneNumberId,
          status: "ACTIVE",
          organizationId: org.id,
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Numéro ${phoneNumber} acheté avec succès.`,
      orderId: telnyxOrderId,
      mock: useMock,
    });

  } catch (error: any) {
    console.error("[Telnyx Buy Error]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
