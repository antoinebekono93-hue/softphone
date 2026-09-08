"use server";

import { telnyx } from "@/lib/telnyx";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canonicalizePhoneNumber } from "@/lib/phone-number";

export async function searchNumbers(countryCode: string = "US") {
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
  } catch (error: any) {
    console.error("[Search Numbers Error]", error);
    return { error: "Failed to fetch numbers from Telnyx" };
  }
}

export async function buyNumber(phoneNumber: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const canonicalPhoneNumber = canonicalizePhoneNumber(phoneNumber);
    if (!canonicalPhoneNumber) {
      return { error: "Le numéro doit être au format E.164 valide." };
    }

    const user = await prisma.user.findUnique({ 
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organizationId) return { error: "No organization found" };

    // Check if they already have a number
    const existingCount = await prisma.phoneNumber.count({
      where: { organizationId: user.organizationId }
    });

    if (existingCount > 0) {
      return { error: "You already have a phone number on the trial plan" };
    }

    // Actually buy the number on Telnyx
    const order = await telnyx.numberOrders.create({
      phone_numbers: [{ phone_number: canonicalPhoneNumber }]
    });

    // Wait for the order to process (In real prod we'd use Webhooks, but here we can poll or just assume success if API accepted it)
    
    // Save to database
    await prisma.phoneNumber.create({
      data: {
        number: canonicalPhoneNumber,
        friendlyName: "Main Number",
        telnyxId: order.data.id || "pending_id", // Normally you'd get the actual phone_number id from Telnyx
        organizationId: user.organizationId,
        assignedUserId: user.id,
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Buy Number Error]", error);
    return { error: "Failed to purchase the number" };
  }
}
