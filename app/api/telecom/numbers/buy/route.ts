import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const API_BASE = 'https://api.telnyx.com/v2';

export async function POST(request: Request) {
  try {
    const { phoneNumber, cost } = await request.json();

    if (!phoneNumber || cost === undefined) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // 1. Get current organization
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    });
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    // 2. Check wallet balance
    if (org.walletBalance < cost) {
      return NextResponse.json({ error: "Solde insuffisant dans le Wallet. Veuillez recharger votre compte." }, { status: 402 });
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
    const apiKey = settings?.telnyxApiKey || process.env.TELNYX_API_KEY;
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

      // ===== AUTOMATIC PROVISIONING =====
      try {
        // 1. Get first Telephony Credential (SIP Connection)
        const sipRes = await fetch(`${API_BASE}/telephony_credentials`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const sipData = await sipRes.json();
        const connectionId = sipData.data?.[0]?.connection_id || sipData.data?.[0]?.id;

        // 2. Get first Messaging Profile
        const msgRes = await fetch(`${API_BASE}/messaging_profiles`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const msgData = await msgRes.json();
        const messagingProfileId = msgData.data?.[0]?.id;

        // 3. Attach number to SIP connection and Messaging Profile
        if (connectionId || messagingProfileId) {
          const updateBody: any = {};
          if (connectionId) updateBody.connection_id = connectionId;
          if (messagingProfileId) updateBody.messaging_profile_id = messagingProfileId;

          const updateRes = await fetch(`${API_BASE}/phone_numbers/${telnyxPhoneNumberId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateBody),
          });
          
          if (!updateRes.ok) {
             console.error("[Telnyx Provisioning Error] Failed to attach number:", await updateRes.text());
          } else {
             console.log(`[Telnyx Provisioning] Successfully attached number ${phoneNumber} to SIP (${connectionId}) and MSG (${messagingProfileId})`);
          }
        }
      } catch (provErr) {
        console.error("[Telnyx Provisioning Exception]", provErr);
        // We don't fail the purchase if provisioning fails, it can be done manually
      }

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
