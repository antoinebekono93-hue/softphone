import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { creditWalletAtomically, debitWalletAtomically } from "@/lib/billing";
import { canonicalizePhoneNumber, phoneNumberCountry } from "@/lib/phone-number";
import { resellerNumberPrice } from "@/lib/telnyx-number-pricing";
import { getConfiguredTelnyxClient } from "@/lib/telnyx";

type PurchaseOptions = {
  organizationId: string;
  phoneNumber: string;
  assignedUserId?: string | null;
  requireApprovedKyc?: boolean;
};

export type NumberPurchaseResult = {
  phoneNumber: string;
  orderId: string;
  status: "ACTIVE" | "PENDING";
  chargedAmount: number;
};

async function refundRejectedOrder(organizationId: string, amount: number, operationId: string) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.walletTransaction.findFirst({
      where: { callControlId: operationId, type: "NUMBER_PURCHASE_REFUND" },
      select: { id: true },
    });
    if (existing) return;
    await creditWalletAtomically(tx, organizationId, amount);
    await tx.walletTransaction.create({
      data: {
        amount,
        type: "NUMBER_PURCHASE_REFUND",
        description: "Remboursement d'une commande de numéro refusée par Telnyx",
        organizationId,
        callControlId: operationId,
      },
    });
  });
}

export async function findOwnedTelnyxNumber(telnyx: any, phoneNumber: string) {
  const response = await telnyx.phoneNumbers.list({
    filter: { phone_number: phoneNumber },
    page: { size: 20 },
  });
  return (Array.isArray(response?.data) ? response.data : []).find(
    (item: any) => canonicalizePhoneNumber(item?.phone_number) === phoneNumber && typeof item?.id === "string",
  ) ?? null;
}

/** Enforces Code Mode as the source of truth for an owned DID. The number is
 * attached to our Call Control Application and native Telnyx forwarding is
 * disabled so routing can only be decided by the signed webhook backend. */
export async function ensureTelnyxNumberCodeControlled(params: {
  telnyx: any;
  telnyxNumberId: string;
  connectionId: string;
  messagingProfileId?: string | null;
}) {
  await params.telnyx.phoneNumbers.update(params.telnyxNumberId, {
    connection_id: params.connectionId,
  });
  await params.telnyx.phoneNumbers.voice.update(params.telnyxNumberId, {
    call_forwarding: {
      call_forwarding_enabled: false,
      forwards_to: "",
    },
  });
  if (params.messagingProfileId) {
    await params.telnyx.phoneNumbers.messaging.update(params.telnyxNumberId, {
      messaging_profile_id: params.messagingProfileId,
    });
  }
}

function telnyxErrorStatus(error: unknown) {
  const status = Number((error as { status?: unknown })?.status);
  return Number.isInteger(status) ? status : null;
}

/** Completes an asynchronously fulfilled order and activates its real Telnyx
 * number locally. Safe to call repeatedly from webhooks and admin syncs. */
export async function activateFulfilledTelnyxOrder(telnyxOrderId: string): Promise<boolean> {
  const [order, settings] = await Promise.all([
    prisma.numberOrder.findUnique({ where: { telnyxOrderId } }),
    prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: { telnyxApiKey: true, telnyxConnectionId: true },
    }),
  ]);
  if (!order) return false;
  const connectionId = settings?.telnyxConnectionId?.trim() || process.env.TELNYX_SIP_CONNECTION_ID?.trim();
  if (!connectionId) throw new Error("TELNYX_CONFIGURATION_INCOMPLETE");
  const telnyx = await getConfiguredTelnyxClient();

  let rawNumbers: unknown;
  try {
    rawNumbers = JSON.parse(order.phoneNumbers || "[]");
  } catch {
    throw new Error("INVALID_NUMBER_ORDER_PAYLOAD");
  }
  if (!Array.isArray(rawNumbers) || rawNumbers.length === 0) return false;

  let activated = 0;
  for (const rawNumber of rawNumbers) {
    const phoneNumber = canonicalizePhoneNumber(rawNumber);
    if (!phoneNumber) continue;
    const owned = await findOwnedTelnyxNumber(telnyx, phoneNumber);
    if (!owned) continue;
    await ensureTelnyxNumberCodeControlled({
      telnyx,
      telnyxNumberId: owned.id,
      connectionId,
      messagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID?.trim(),
    }).catch((error) => {
      console.error("[Telnyx Number Activation] Routing update failed", error);
      throw new Error("TELNYX_NUMBER_ROUTING_FAILED");
    });

    await prisma.phoneNumber.upsert({
      where: { telnyxId: owned.id },
      update: {
        number: phoneNumber,
        status: "ACTIVE",
        organizationId: order.organizationId,
        ...(order.requestedUserId ? { assignedUserId: order.requestedUserId } : {}),
      },
      create: {
        number: phoneNumber,
        telnyxId: owned.id,
        country: owned.country_iso_alpha2 || phoneNumberCountry(phoneNumber),
        status: "ACTIVE",
        organizationId: order.organizationId,
        assignedUserId: order.requestedUserId,
      },
    });
    activated++;
  }

  if (activated === rawNumbers.length) {
    await prisma.numberOrder.update({ where: { telnyxOrderId }, data: { status: "success" } });
    return true;
  }
  return false;
}

/**
 * Production number purchase workflow.
 *
 * Funds are reserved atomically before contacting Telnyx. A deterministic
 * provider rejection is refunded; an ambiguous network/2xx response is kept
 * on hold for reconciliation so a provider-owned number is never left unpaid.
 */
export async function purchaseTelnyxNumber(options: PurchaseOptions): Promise<NumberPurchaseResult> {
  const phoneNumber = canonicalizePhoneNumber(options.phoneNumber);
  if (!phoneNumber) throw new Error("INVALID_PHONE_NUMBER");

  const [organization, settings, duplicate] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: options.organizationId },
      select: { id: true, kycStatus: true },
    }),
    prisma.systemSettings.findUnique({ where: { id: "default" } }),
    prisma.phoneNumber.findUnique({ where: { number: phoneNumber }, select: { id: true } }),
  ]);
  if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");
  if (options.requireApprovedKyc && organization.kycStatus !== "APPROVED") throw new Error("KYC_NOT_APPROVED");
  if (duplicate) throw new Error("NUMBER_ALREADY_MANAGED");

  const connectionId = settings?.telnyxConnectionId?.trim() || process.env.TELNYX_SIP_CONNECTION_ID?.trim();
  const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID?.trim();
  if (!connectionId) throw new Error("TELNYX_VOICE_CONNECTION_NOT_CONFIGURED");
  let telnyx: any;
  try {
    telnyx = await getConfiguredTelnyxClient();
  } catch {
    throw new Error("TELNYX_API_KEY_NOT_CONFIGURED");
  }

  const country = phoneNumberCountry(phoneNumber);
  if (!country) throw new Error("PHONE_COUNTRY_UNKNOWN");
  let availability: any;
  try {
    availability = await telnyx.availablePhoneNumbers.list({
      filter: { country_code: country, phone_number: { starts_with: phoneNumber }, limit: 10 },
    });
  } catch (error) {
    console.error("[Telnyx Number Purchase] Availability SDK request failed", error);
    throw new Error("TELNYX_NUMBER_AVAILABILITY_FAILED");
  }
  const exactNumber = (Array.isArray(availability?.data) ? availability.data : []).find(
    (item: any) => canonicalizePhoneNumber(item?.phone_number) === phoneNumber,
  );
  if (!exactNumber) throw new Error("NUMBER_NO_LONGER_AVAILABLE");

  const chargedAmount = resellerNumberPrice({
    costInformation: exactNumber.cost_information,
    multiplier: settings?.phoneNumberMarkupMultiplier ?? 2.5,
    fixedMarkup: settings?.phoneNumberMarkupFixed ?? 0,
  });
  if (chargedAmount === null) throw new Error("TELNYX_NUMBER_PRICE_UNAVAILABLE");

  const operationId = `number-purchase:${randomUUID()}`;
  await prisma.$transaction(async (tx) => {
    const debited = await debitWalletAtomically(tx, organization.id, chargedAmount);
    if (!debited) throw new Error("INSUFFICIENT_FUNDS");
    await tx.walletTransaction.create({
      data: {
        amount: -chargedAmount,
        type: "NUMBER_PURCHASE_HOLD",
        description: `Réservation pour l'achat du numéro ${phoneNumber}`,
        organizationId: organization.id,
        callControlId: operationId,
      },
    });
  });

  let orderPayload: any;
  try {
    orderPayload = await telnyx.numberOrders.create({
      phone_numbers: [{ phone_number: phoneNumber }],
      connection_id: connectionId,
      ...(messagingProfileId ? { messaging_profile_id: messagingProfileId } : {}),
    });
  } catch (error) {
    const status = telnyxErrorStatus(error);
    if (status !== null && status >= 400 && status < 500) {
      await refundRejectedOrder(organization.id, chargedAmount, operationId);
      throw new Error("TELNYX_NUMBER_ORDER_REJECTED");
    }
    console.error("[Telnyx Number Purchase] Ambiguous network result; funds remain reserved", { operationId, error });
    throw new Error("TELNYX_ORDER_RESULT_UNKNOWN");
  }

  const orderId = orderPayload?.data?.id;
  if (typeof orderId !== "string" || !orderId.trim()) {
    console.error("[Telnyx Number Purchase] Successful response without order id; funds remain reserved", { operationId });
    throw new Error("TELNYX_ORDER_ID_MISSING");
  }
  const rawOrderStatus = String(orderPayload?.data?.status || "pending").toLowerCase();
  const trackedOrderStatus = ["success", "completed", "complete"].includes(rawOrderStatus)
    ? "provider_success"
    : rawOrderStatus;

  await prisma.$transaction(async (tx) => {
    await tx.numberOrder.upsert({
      where: { telnyxOrderId: orderId },
      update: {
        status: trackedOrderStatus,
        phoneNumbers: JSON.stringify([phoneNumber]),
        requestedUserId: options.assignedUserId ?? null,
      },
      create: {
        telnyxOrderId: orderId,
        type: "PURCHASE",
        status: trackedOrderStatus,
        phoneNumbers: JSON.stringify([phoneNumber]),
        organizationId: organization.id,
        requestedUserId: options.assignedUserId ?? null,
      },
    });
    await tx.walletTransaction.updateMany({
      where: { callControlId: operationId, type: "NUMBER_PURCHASE_HOLD" },
      data: {
        type: "NUMBER_PURCHASE",
        description: `Achat du numéro ${phoneNumber} — commande Telnyx ${orderId}`,
      },
    });
  });

  // Number orders may complete asynchronously. Only an ID returned by the
  // owned-numbers endpoint is persisted; fabricated fallbacks are forbidden.
  const ownedNumber = await findOwnedTelnyxNumber(telnyx, phoneNumber);
  if (!ownedNumber) {
    return { phoneNumber, orderId, status: "PENDING", chargedAmount };
  }

  await ensureTelnyxNumberCodeControlled({
    telnyx,
    telnyxNumberId: ownedNumber.id,
    connectionId,
    messagingProfileId,
  }).catch((error) => {
    console.error("[Telnyx Number Purchase] Routing SDK update failed", error);
    throw new Error("TELNYX_NUMBER_ROUTING_FAILED");
  });

  await prisma.$transaction(async (tx) => {
    await tx.phoneNumber.upsert({
      where: { telnyxId: ownedNumber.id },
      update: {
        number: phoneNumber,
        status: "ACTIVE",
        organizationId: organization.id,
        ...(options.assignedUserId ? { assignedUserId: options.assignedUserId } : {}),
      },
      create: {
        number: phoneNumber,
        telnyxId: ownedNumber.id,
        country: ownedNumber.country_iso_alpha2 || country,
        status: "ACTIVE",
        organizationId: organization.id,
        assignedUserId: options.assignedUserId ?? null,
      },
    });
    await tx.numberOrder.update({ where: { telnyxOrderId: orderId }, data: { status: "success" } });
  });

  return { phoneNumber, orderId, status: "ACTIVE", chargedAmount };
}
