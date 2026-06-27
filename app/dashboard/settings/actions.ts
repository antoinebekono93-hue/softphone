"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateTelnyxSettings(formData: FormData) {
  const session = await auth();
  
  let orgId = session?.user?.organizationId;

  // Fallback for local demo mode if not logged in (to match the rest of the app)
  if (!orgId) {
    const defaultOrg = await prisma.organization.findFirst();
    if (defaultOrg) {
      orgId = defaultOrg.id;
    }
  }

  if (!orgId) {
    return { success: false, error: "Unauthorized" };
  }

  const apiKey = formData.get("telnyxApiKey") as string;
  const connectionId = formData.get("telnyxConnectionId") as string;

  try {
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        telnyxApiKey: apiKey || null,
        telnyxConnectionId: connectionId || null,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update Telnyx settings:", error);
    return { success: false, error: "Database error" };
  }
}
