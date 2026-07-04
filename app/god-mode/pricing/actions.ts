"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function updatePricingSettings(settings: any) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return { error: "Non autorisé" };
  }

  try {
    await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {
        phoneNumberMarkupMultiplier: settings.phoneNumberMarkupMultiplier,
        phoneNumberMarkupFixed: settings.phoneNumberMarkupFixed,
        smsRate: settings.smsRate,
        callRatePerMinute: settings.callRatePerMinute,
        aiAgentRatePerMinute: settings.aiAgentRatePerMinute,
        whatsappRate: settings.whatsappRate
      },
      create: {
        id: "default",
        phoneNumberMarkupMultiplier: settings.phoneNumberMarkupMultiplier,
        phoneNumberMarkupFixed: settings.phoneNumberMarkupFixed,
        smsRate: settings.smsRate,
        callRatePerMinute: settings.callRatePerMinute,
        aiAgentRatePerMinute: settings.aiAgentRatePerMinute,
        whatsappRate: settings.whatsappRate
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erreur updatePricingSettings:", error);
    return { error: "Erreur lors de la mise à jour des paramètres" };
  }
}
