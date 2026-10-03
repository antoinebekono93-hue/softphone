"use server";

import { telnyx } from "@/lib/telnyx";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canonicalizePhoneNumber } from "@/lib/phone-number";
import { purchaseTelnyxNumber } from "@/lib/telnyx-number-purchase";
import { getCurrentAccountContext } from "@/lib/account-context";

export async function searchNumbers(countryCode: string = "US") {
  // A "use server" export is an HTTP endpoint: never expose the provider
  // inventory to an anonymous caller.
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // Fetch available numbers from Telnyx
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

    // Business rule: onboarding allows a single number. This BLOCKS a new
    // purchase, it never deletes or unassigns an existing number (INVARIANT A).
    const existingCount = await prisma.phoneNumber.count({
      where: { organizationId: account.organizationId },
    });
    if (existingCount > 0) {
      return { error: "You already have a phone number on the trial plan" };
    }

    // Single purchase path. Writing the row here directly stored the Telnyx
    // ORDER id in the unique `telnyxId` column, so the number could never be
    // reconciled again and its ownership could never be repaired.
    const result = await purchaseTelnyxNumber({
      organizationId: account.organizationId,
      phoneNumber: canonicalPhoneNumber,
      assignedUserId: account.userId,
    });

    return { success: true, status: result.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    console.error("[Buy Number Error]", error);
    return { error: message === "UNKNOWN" ? "Failed to purchase the number" : message };
  }
}