"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function saveWebhookSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const webhookUrl = formData.get("webhookUrl") as string;
  const webhookSecret = formData.get("webhookSecret") as string;

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      webhookUrl: webhookUrl || null,
      webhookSecret: webhookSecret || null,
    }
  });

  revalidatePath("/dashboard/integrations");
  return { success: true };
}
