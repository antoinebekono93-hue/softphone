"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/security";

export async function updatePricingSettings(settings: any) {
  try {
    await requireSuperAdmin();
  } catch {
    return { error: "Non autorisé" };
  }

  try {
    await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {
        phoneNumberMarkupMultiplier: settings.phoneNumberMarkupMultiplier,
        phoneNumberMarkupFixed: settings.phoneNumberMarkupFixed,
        smsRate: settings.smsRate,
        // Legacy rate remains in sync for older screens/API consumers. The
        // billing engine reads base + markup below.
        callRatePerMinute: Number(settings.callBaseRatePerMinute) * (1 + Number(settings.callMarkupPercent) / 100),
        callBaseRatePerMinute: settings.callBaseRatePerMinute,
        callMarkupPercent: settings.callMarkupPercent,
        aiAgentRatePerMinute: settings.aiAgentRatePerMinute,
        whatsappRate: settings.whatsappRate
      },
      create: {
        id: "default",
        phoneNumberMarkupMultiplier: settings.phoneNumberMarkupMultiplier,
        phoneNumberMarkupFixed: settings.phoneNumberMarkupFixed,
        smsRate: settings.smsRate,
        callRatePerMinute: Number(settings.callBaseRatePerMinute) * (1 + Number(settings.callMarkupPercent) / 100),
        callBaseRatePerMinute: settings.callBaseRatePerMinute,
        callMarkupPercent: settings.callMarkupPercent,
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
