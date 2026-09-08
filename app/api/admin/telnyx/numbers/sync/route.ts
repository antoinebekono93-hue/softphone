import { NextResponse } from "next/server";
import { telnyx } from "@/lib/telnyx";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/security";
import { auth } from "@/auth";
import { canonicalizePhoneNumber } from "@/lib/phone-number";

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

    const response = await telnyx.phoneNumbers.list();
    const telnyxNumbers = response.data || [];

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

      await prisma.phoneNumber.upsert({
        where: { telnyxId: num.id },
        update: {
          // Preserve organization and assigned user on existing rows.  A sync
          // refreshes provider metadata only; it never transfers ownership.
          number: canonicalPhoneNumber,
        },
        create: {
          number: canonicalPhoneNumber,
          telnyxId: num.id,
          organizationId: defaultOrgId,
          country: num.country_code || "US",
          status: "ACTIVE",
        },
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
