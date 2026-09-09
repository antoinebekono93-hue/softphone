import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { debitWalletAtomically } from "@/lib/billing";
import { canonicalizePhoneNumber, phoneNumberCountry } from "@/lib/phone-number";
import { resellerNumberPrice } from "@/lib/telnyx-number-pricing";

const API_BASE = 'https://api.telnyx.com/v2';

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();
    const canonicalPhoneNumber = canonicalizePhoneNumber(phoneNumber);

    if (!canonicalPhoneNumber) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
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

    const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
    const apiKey = settings?.telnyxApiKey?.trim() || process.env.TELNYX_API_KEY?.trim();
    const voiceConnectionId = settings?.telnyxConnectionId?.trim() || process.env.TELNYX_SIP_CONNECTION_ID?.trim();
    const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "TELNYX_API_KEY_NOT_CONFIGURED" }, { status: 503 });
    }
    if (!voiceConnectionId) {
      return NextResponse.json(
        { error: "La connexion vocale Telnyx n'est pas configurée. Impossible d'acheter un numéro appelable." },
        { status: 503 },
      );
    }

    // The browser-provided display price is never trusted. Re-query the exact
    // number and calculate the charge from Telnyx cost_information + God Mode.
    const country = phoneNumberCountry(canonicalPhoneNumber);
    if (!country) {
      return NextResponse.json({ error: "Unable to determine number country" }, { status: 400 });
    }
    const searchParams = new URLSearchParams({
      "filter[country_code]": country,
      "filter[phone_number]": canonicalPhoneNumber,
      "filter[limit]": "10",
    });
    const availabilityResponse = await fetch(`${API_BASE}/available_phone_numbers?${searchParams}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!availabilityResponse.ok) {
      console.error("[Telnyx Buy] Availability check failed", availabilityResponse.status);
      return NextResponse.json({ error: "TELNYX_NUMBER_AVAILABILITY_FAILED" }, { status: 502 });
    }
    const availability = await availabilityResponse.json();
    const exactNumber = (Array.isArray(availability.data) ? availability.data : [])
      .find((item: any) => canonicalizePhoneNumber(item?.phone_number) === canonicalPhoneNumber);
    if (!exactNumber) {
      return NextResponse.json({ error: "NUMBER_NO_LONGER_AVAILABLE" }, { status: 409 });
    }
    const cost = resellerNumberPrice({
      costInformation: exactNumber.cost_information,
      multiplier: settings?.phoneNumberMarkupMultiplier ?? 2.5,
      fixedMarkup: settings?.phoneNumberMarkupFixed ?? 0,
    });
    if (cost === null) {
      return NextResponse.json({ error: "TELNYX_NUMBER_PRICE_UNAVAILABLE" }, { status: 502 });
    }

    // 2. Early balance check (fast-fail before hitting the Telnyx API).
    //    La garantie RÉELLE est le débit atomique gardé dans la transaction (§3).
    if (org.walletBalance.toNumber() < cost) {
      return NextResponse.json({ error: "Solde insuffisant dans le Wallet. Veuillez recharger votre compte." }, { status: 402 });
    }

    let telnyxOrderId: string;
    let telnyxPhoneNumberId: string;

    {
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
    });

  } catch (error: any) {
    if (error?.message === "INSUFFICIENT_FUNDS") {
      return NextResponse.json({ error: "Solde insuffisant dans le Wallet." }, { status: 402 });
    }
    console.error("[Telnyx Buy Error]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
