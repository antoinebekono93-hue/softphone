"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function saveTelnyxKey(key: string) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { error: "Non autorisé" };
  }

  try {
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { telnyxApiKey: key }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to save Telnyx API key:", error);
    return { error: "Impossible de sauvegarder la clé" };
  }
}
