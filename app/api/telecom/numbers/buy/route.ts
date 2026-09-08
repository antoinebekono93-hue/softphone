import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { debitWalletAtomically } from "@/lib/billing";
import { canonicalizePhoneNumber } from "@/lib/phone-number";

const API_BASE = 'https://api.telnyx.com/v2';

export async function POST(request: Request) {
  try {
    const { phoneNumber, cost } = await request.json();
    const canonicalPhoneNumber = canonicalizePhoneNumber(phoneNumber);

    if (!canonicalPhoneNumber || typeof cost !== "number" || !Number.isFinite(cost) || cost < 0) {
      return NextResponse.json({ error: "Invalid phone number or cost" }, { status: 400 });
    }

    // 1. Get current organization
    const session = await auth();
    if (!session?.user?.id || !session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // JWT claims can be stale after a user moves tenant.  Verify the actual
    // membership before assigning a newly bought number to that user.
    const purchaser = await prisma.user.findFirst({
      where: { id: session.user.id, organizationId: session.user.organizationId },
      select: { id: true },
    });
    if (!purchaser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    });
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    // 2. Early balance check (fast-fail before hitting the Telnyx API).
    //    La garantie RÉELLE est le débit atomique gardé dans la transaction (§3).
    if (org.walletBalance.toNumber() < cost) {
      return NextResponse.json({ error: "Solde insuffisant dans le Wallet. Veuillez recharger votre compte." }, { status: 402 });
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
    const apiKey = settings?.telnyxApiKey || process.env.TELNYX_API_KEY;
    const useMock = process.env.TELNYX_MOCK_PURCHASES === 'true';
    // Keep newly bought numbers on the same connection as the WebRTC client.
    // Choosing the first credential/profile in the Telnyx account is not a
    // routing strategy: it can belong to an unrelated connection.
    const voiceConnectionId = process.env.TELNYX_SIP_CONNECTION_ID || settings?.telnyxConnectionId;
    const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID;

    let telnyxOrderId: string;
    let telnyxPhoneNumberId: string;

    if (!useMock && apiKey) {
      if (!voiceConnectionId) {
        return NextResponse.json(
          { error: "La connexion vocale Telnyx n'est pas configurée. Impossible d'acheter un numéro appelable." },
          { status: 503 },
        );
      }
      // ===== REAL PURCHASE via Telnyx Number Orders API =====
      const orderRes = await fetch(`${API_BASE}/number_orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_numbers: [{ phone_number: canonicalPhoneNumber }],
          connection_id: voiceConnectionId,
          ...(messagingProfileId ? { messaging_profile_id: messagingProfileId } : {}),
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

      console.log(`[Telnyx API] Successfully ordered number ${canonicalPhoneNumber} - Order ID: ${telnyxOrderId}`);

      // Verify the routing after the order. The order can be fulfilled
      // asynchronously, so this PATCH is a deterministic safeguard.
      try {
        const updateRes = await fetch(`${API_BASE}/phone_numbers/${telnyxPhoneNumberId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            connection_id: voiceConnectionId,
            ...(messagingProfileId ? { messaging_profile_id: messagingProfileId } : {}),
          }),
        });
        if (!updateRes.ok) {
          console.error("[Telnyx Provisioning Error] Failed to attach number:", await updateRes.text());
          return NextResponse.json(
            { error: "Le numéro a été commandé mais son routage vocal Telnyx n'a pas été confirmé. Contactez le support avant de l'utiliser." },
            { status: 502 },
          );
        }
        console.log(`[Telnyx Provisioning] Number ${canonicalPhoneNumber} attached to voice connection ${voiceConnectionId}`);
      } catch (provErr) {
        console.error("[Telnyx Provisioning Exception]", provErr);
        return NextResponse.json(
          { error: "Le numéro a été commandé mais le routage vocal Telnyx n'a pas pu être confirmé. Contactez le support avant de l'utiliser." },
          { status: 502 },
        );
      }

    } else {
      // ===== MOCK PURCHASE for local development =====
      console.log(`[Telnyx API MOCK] Successfully bought number ${canonicalPhoneNumber} for $${cost}`);
      telnyxOrderId = `mock-order-${Date.now()}`;
      telnyxPhoneNumberId = `mock-${canonicalPhoneNumber.replace(/[^0-9]/g, '')}`;
    }

    // 3. Database Transaction (Atomic)
    await prisma.$transaction(async (tx) => {
      // 3a. Deduct cost from wallet — ATOMIQUE avec garde de solde (jamais négatif)
      const debited = await debitWalletAtomically(tx, org.id, cost);
      if (!debited) {
        // Solde insuffisant : aucun débit, aucune transaction, aucun numéro créé.
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // 3b. Log the transaction
      await tx.walletTransaction.create({
        data: {
          amount: -cost,
          type: "NUMBER_PURCHASE",
          description: `Achat du numéro ${canonicalPhoneNumber}`,
          organizationId: org.id,
        }
      });

      // 3c. Save the new phone number to inventory
      await tx.phoneNumber.create({
        data: {
          number: canonicalPhoneNumber,
          telnyxId: telnyxPhoneNumberId,
          status: "ACTIVE",
          organizationId: org.id,
          assignedUserId: purchaser.id,
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Numéro ${canonicalPhoneNumber} acheté avec succès.`,
      orderId: telnyxOrderId,
      mock: useMock,
    });

  } catch (error: any) {
    if (error?.message === "INSUFFICIENT_FUNDS") {
      return NextResponse.json({ error: "Solde insuffisant dans le Wallet." }, { status: 402 });
    }
    console.error("[Telnyx Buy Error]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
