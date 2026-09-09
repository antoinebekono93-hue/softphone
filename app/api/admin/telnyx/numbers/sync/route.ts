import { NextResponse } from "next/server";
import { getConfiguredTelnyxClient } from "@/lib/telnyx";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/security";
import { auth } from "@/auth";
import { canonicalizePhoneNumber } from "@/lib/phone-number";
import { ensureTelnyxNumberCodeControlled } from "@/lib/telnyx-number-purchase";

export async function POST() {
  try {
    const guard = await requireSuperAdminApi();
    if (guard) return guard;

    // Seul un super-admin (vérifié par la garde ci-dessus) peut déclencher
    // cette opération Telnyx. Les numéros EXISTANTS conservent leur org ;
    // les NOUVEAUX sont rattachés à l'org du super-admin (ou, à défaut, à la
    // première org créée comme lot d'attente — l'attribution manuelle reste
    // la norme via /api/admin/telnyx/numbers/assign).
    const session = await auth();
    let defaultOrgId = session?.user?.organizationId ?? null;
    if (!defaultOrgId) {
      const first = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
      defaultOrgId = first?.id ?? null;
    }

    const telnyx = await getConfiguredTelnyxClient();
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: { telnyxConnectionId: true },
    });
    const connectionId = settings?.telnyxConnectionId?.trim() || process.env.TELNYX_SIP_CONNECTION_ID?.trim();
    if (!connectionId) {
      return NextResponse.json({ error: "TELNYX_VOICE_CONNECTION_NOT_CONFIGURED" }, { status: 503 });
    }
    const response = await telnyx.phoneNumbers.list({ page: { size: 250 } });
    const telnyxNumbers = response.data || [];

    // Orders created by this application are the authoritative tenant mapping
    // when Telnyx fulfills a number asynchronously.
    const pendingOrders = await prisma.numberOrder.findMany({
      where: { status: { not: "success" } },
      select: { id: true, organizationId: true, requestedUserId: true, phoneNumbers: true },
    });
    const orderedNumberOwners = new Map<string, { orderId: string; organizationId: string; requestedUserId: string | null }>();
    for (const order of pendingOrders) {
      try {
        const numbers = JSON.parse(order.phoneNumbers || "[]");
        if (!Array.isArray(numbers)) continue;
        for (const rawNumber of numbers) {
          const canonical = canonicalizePhoneNumber(rawNumber);
          if (canonical) orderedNumberOwners.set(canonical, {
            orderId: order.id,
            organizationId: order.organizationId,
            requestedUserId: order.requestedUserId,
          });
        }
      } catch {
        console.warn("[Telnyx Number Sync] Invalid stored number order payload", { orderId: order.id });
      }
    }

    if (!defaultOrgId) {
      // organizationId est REQUIS dans le schéma : impossible de synchroniser un
      // numéro hors organisation. Fail-closed plutôt qu'un INSERT en échec.
      if (telnyxNumbers.length > 0) {
        return NextResponse.json(
          { error: "Aucune organisation hôte : créez une organisation ou assignez-vous à une org avant de synchroniser." },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, count: 0 });
    }

    let syncedCount = 0;
    let skippedCount = 0;

    for (const num of telnyxNumbers) {
      const canonicalPhoneNumber = canonicalizePhoneNumber(num.phone_number);
      if (!canonicalPhoneNumber || !num.id) {
        // Provider payloads are external input.  Do not create a record that
        // can never be resolved as a safe platform telephone identity.
        skippedCount++;
        console.warn("[Telnyx Number Sync] Ignored invalid number payload", { id: num.id });
        continue;
      }

      const pendingOwner = orderedNumberOwners.get(canonicalPhoneNumber);
      const providerStatus = String(num.status || "").toLowerCase();
      const localStatus = providerStatus === "active" || providerStatus === "success" ? "ACTIVE" : "PENDING";
      if (localStatus === "ACTIVE") {
        await ensureTelnyxNumberCodeControlled({
          telnyx,
          telnyxNumberId: num.id,
          connectionId,
          messagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID?.trim(),
        });
      }
      await prisma.$transaction(async (tx) => {
        await tx.phoneNumber.upsert({
          where: { telnyxId: num.id },
          update: {
            // Preserve ownership of existing rows. A pending application order
            // supplies ownership only when the provider number is first seen.
            number: canonicalPhoneNumber,
            status: localStatus,
          },
          create: {
            number: canonicalPhoneNumber,
            telnyxId: num.id,
            organizationId: pendingOwner?.organizationId || defaultOrgId,
            assignedUserId: pendingOwner?.requestedUserId || null,
            country: num.country_code || "US",
            status: localStatus,
          },
        });
        if (pendingOwner && localStatus === "ACTIVE") {
          await tx.numberOrder.update({ where: { id: pendingOwner.orderId }, data: { status: "success" } });
        }
      });
      syncedCount++;
    }

    return NextResponse.json({ success: true, count: syncedCount, skipped: skippedCount });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Number sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync numbers", details: message },
      { status: 500 }
    );
  }
}
