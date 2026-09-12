"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { telnyx } from "@/lib/telnyx";
import { canonicalizePhoneNumber } from "@/lib/phone-number";
import { revalidatePath } from "next/cache";

export async function getNumbers() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return [];

    const numbers = await prisma.phoneNumber.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        aiEmployee: true,
        assignedUser: true,
        organization: { include: { pricingPlan: true } },
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
  if (!session?.user?.id || !session.user.organizationId) return { error: "Unauthorized" };

  try {
    const [number, actor] = await Promise.all([
      prisma.phoneNumber.findFirst({
        where: { id, organizationId: session.user.organizationId },
        select: { id: true, assignedUserId: true },
      }),
      prisma.user.findFirst({
        where: { id: session.user.id, organizationId: session.user.organizationId },
        select: { id: true },
      }),
    ]);

    if (!number || !actor) return { error: "Phone number not found" };

    // There is no tenant-admin authority model in the schema that is safe to
    // trust here.  Until one exists, a regular member can only edit the number
    // assigned to them; global God Mode remains explicitly authorized.
    if (!session.user.isSuperAdmin && number.assignedUserId !== actor.id) {
      return { error: "You are not allowed to manage this phone number" };
    }

    if (assignedUserId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: assignedUserId,
          organizationId: session.user.organizationId,
        },
        select: { id: true },
      });
      if (!assignee) {
        // Never allow a cross-tenant user ID to become an owner of a number.
        return { error: "Assigned user must belong to your organization" };
      }
    }

    await prisma.phoneNumber.update({
      where: { id: number.id },
      data: {
        friendlyName: typeof friendlyName === "string" ? friendlyName.trim().slice(0, 120) || null : null,
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

    const canonicalPhoneNumber = canonicalizePhoneNumber(phoneNumber);
    if (!canonicalPhoneNumber) {
      return { error: "Le numéro doit être au format E.164 valide." };
    }

    const user = await prisma.user.findUnique({ 
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organizationId) return { error: "No organization found" };

    const connectionId = process.env.TELNYX_SIP_CONNECTION_ID;
    if (!connectionId) {
      return { error: "La connexion vocale Telnyx n'est pas configurée." };
    }

    const order = await telnyx.numberOrders.create({
      phone_numbers: [{ phone_number: canonicalPhoneNumber }],
      connection_id: connectionId,
      ...(process.env.TELNYX_MESSAGING_PROFILE_ID
        ? { messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID }
        : {}),
    });

    await prisma.phoneNumber.create({
      data: {
        number: canonicalPhoneNumber,
        friendlyName: "New Number",
        telnyxId: order.data?.phone_numbers?.[0]?.id || `pending_${Date.now()}`,
        organizationId: user.organizationId,
        assignedUserId: user.id,
      }
    });

    revalidatePath("/dashboard/numbers");
    return { success: true };
  } catch (error: any) {
    console.error("[Buy Number Error]", error);
    return { error: "Failed to purchase the number" };
  }
}
