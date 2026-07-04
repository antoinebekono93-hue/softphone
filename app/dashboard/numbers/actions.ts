"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { telnyx } from "@/lib/telnyx";
import { revalidatePath } from "next/cache";

export async function getNumbers() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return [];

    const numbers = await prisma.phoneNumber.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        voiceAIAgent: true,
        assignedUser: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return numbers;
  } catch (error) {
    console.error("Failed to get numbers:", error);
    return [];
  }
}

export async function getUsers() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return [];

    const users = await prisma.user.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true, email: true }
    });

    return users;
  } catch (error) {
    console.error("Failed to get users:", error);
    return [];
  }
}

export async function updateNumber(id: string, friendlyName: string, assignedUserId: string | null) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    await prisma.phoneNumber.update({
      where: { 
        id, 
        organizationId: session.user.organizationId 
      },
      data: {
        friendlyName,
        assignedUserId
      }
    });

    revalidatePath("/dashboard/numbers");
    return { success: true };
  } catch (error) {
    console.error("Update Number Error:", error);
    return { error: "Failed to update number" };
  }
}

export async function searchNumbers(countryCode: string = "US") {
  try {
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

    const user = await prisma.user.findUnique({ 
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organizationId) return { error: "No organization found" };

    const order = await telnyx.numberOrders.create({
      phone_numbers: [{ phone_number: phoneNumber }]
    });

    await prisma.phoneNumber.create({
      data: {
        number: phoneNumber,
        friendlyName: "New Number",
        telnyxId: order.data.id || `pending_${Date.now()}`,
        organizationId: user.organizationId,
      }
    });

    revalidatePath("/dashboard/numbers");
    return { success: true };
  } catch (error: any) {
    console.error("[Buy Number Error]", error);
    return { error: "Failed to purchase the number" };
  }
}
