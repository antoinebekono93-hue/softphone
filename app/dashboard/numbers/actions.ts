"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { telnyx } from "@/lib/telnyx";
import { canonicalizePhoneNumber } from "@/lib/phone-number";
import { purchaseTelnyxNumber } from "@/lib/telnyx-number-purchase";
import { getCurrentAccountContext } from "@/lib/account-context";
import { revalidatePath } from "next/cache";

/**
 * INVARIANT A — the plan is never part of the ownership query.
 *
 * A number belongs to the organization, not to the plan. Buying N1 and N2 with
 * no plan, then subscribing, then upgrading or downgrading must always return
 * the same rows. `PricingPlan` only gates capabilities elsewhere.
 *
 * Errors are NOT swallowed: returning `[]` on failure made a healthy database
 * look like "all my numbers disappeared", which is exactly the bug family this
 * audit removes. The page renders an explicit error instead.
 */
export async function getNumbers(organizationId: string) {
  const numbers = await prisma.phoneNumber.findMany({
    where: { organizationId },
    include: {
      aiEmployee: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true, email: true } },
      // Only display fields are selected: a Prisma `Decimal` (PricingPlan prices)
      // cannot cross the Server Component boundary, and including the whole
      // pricing plan made this query throw as soon as a plan was attached —
      // which is why numbers used to vanish exactly when a plan was chosen.
      organization: { select: { pricingPlan: { select: { hasRecording: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return numbers;
}

export async function getUsers() {
  const session = await auth();
  if (!session?.user?.id) return [];
  const account = await getCurrentAccountContext(session.user.id);
  if (!account?.organizationId) return [];

  return prisma.user.findMany({
    where: { organizationId: account.organizationId },
    select: { id: true, name: true, email: true },
  });
}

export async function updateNumber(id: string, friendlyName: string, assignedUserId: string | null) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const account = await getCurrentAccountContext(session.user.id);
    if (!account?.organizationId) return { error: "Unauthorized" };

    const [number, assignee] = await Promise.all([
      prisma.phoneNumber.findFirst({
        where: { id, organizationId: account.organizationId },
        select: { id: true, assignedUserId: true },
      }),
      assignedUserId
        ? prisma.user.findFirst({
            where: { id: assignedUserId, organizationId: account.organizationId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    // Tenant isolation: another organization's number is simply not found.
    if (!number) return { error: "Phone number not found" };

    // There is no tenant-admin authority model in the schema that is safe to
    // trust here.  Until one exists, a regular member can only edit the number
    // assigned to them; global God Mode remains explicitly authorized.
    if (!account.isSuperAdmin && number.assignedUserId !== account.userId) {
      return { error: "You are not allowed to manage this phone number" };
    }

    if (assignedUserId && !assignee) {
      // Never allow a cross-tenant user ID to become an owner of a number.
      return { error: "Assigned user must belong to your organization" };
    }

    // Partial update only: a label edit and an ownership edit, nothing else.
    // `organizationId`, `status`, `number` and `telnyxId` are untouched.
    await prisma.phoneNumber.update({
      where: { id: number.id },
      data: {
        friendlyName: typeof friendlyName === "string" ? friendlyName.trim().slice(0, 120) || null : null,
        assignedUserId: assignedUserId ?? null,
      },
    });

    revalidatePath("/dashboard/numbers");
    return { success: true };
  } catch (error) {
    console.error("Update Number Error:", error);
    return { error: "Failed to update number" };
  }
}

export async function searchNumbers(countryCode: string = "US") {
  // A "use server" export is an HTTP endpoint: an unauthenticated search would
  // leak the provider inventory to anonymous callers.
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const response = await telnyx.availablePhoneNumbers.list({
      filter: {
        country_code: countryCode,
        limit: 5,
        features: ["sms", "voice"]
      }
    });

    return { numbers: response.data };
  } catch (error) {
    console.error("[Search Numbers Error]", error);
    return { error: "Failed to fetch numbers from Telnyx" };
  }
}

/**
 * Single purchase path (INVARIANT C).
 *
 * Delegates to `purchaseTelnyxNumber`, which debits the wallet, records the
 * Telnyx order, provisions the number and assigns it to the buyer. Writing the
 * `PhoneNumber` row here directly used to fabricate a `telnyxId`
 * (`pending_<timestamp>`), which permanently broke every later reconciliation
 * keyed on `telnyxId` and left the number impossible to attribute.
 */
export async function buyNumber(phoneNumber: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const account = await getCurrentAccountContext(session.user.id);
    if (!account?.organizationId) return { error: "No organization found" };

    const canonicalPhoneNumber = canonicalizePhoneNumber(phoneNumber);
    if (!canonicalPhoneNumber) {
      return { error: "Le numéro doit être au format E.164 valide." };
    }

    const result = await purchaseTelnyxNumber({
      organizationId: account.organizationId,
      phoneNumber: canonicalPhoneNumber,
      assignedUserId: account.userId,
    });

    revalidatePath("/dashboard/numbers");
    return { success: true, status: result.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    console.error("[Buy Number Error]", error);
    return { error: message === "UNKNOWN" ? "Failed to purchase the number" : message };
  }
}
