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
    const numericKeys = [
      'phoneNumberMarkupMultiplier', 'phoneNumberMarkupFixed', 'smsRate',
      'callBaseRatePerMinute', 'callMarkupPercent', 'aiAgentRatePerMinute', 'whatsappRate',
    ] as const;
    const values = Object.fromEntries(numericKeys.map(key => [key, Number(settings?.[key])])) as Record<typeof numericKeys[number], number>;
    if (numericKeys.some(key => !Number.isFinite(values[key]) || values[key] < 0)) {
      return { error: 'Tous les tarifs doivent être des nombres positifs ou nuls.' };
    }
    if (values.smsRate <= 0) return { error: 'Le prix client par SMS doit être supérieur à zéro.' };
    await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {
        phoneNumberMarkupMultiplier: values.phoneNumberMarkupMultiplier,
        phoneNumberMarkupFixed: values.phoneNumberMarkupFixed,
        smsRate: values.smsRate,
        // Legacy rate remains in sync for older screens/API consumers. The
        // billing engine reads base + markup below.
        callRatePerMinute: values.callBaseRatePerMinute * (1 + values.callMarkupPercent / 100),
        callBaseRatePerMinute: values.callBaseRatePerMinute,
        callMarkupPercent: values.callMarkupPercent,
        aiAgentRatePerMinute: values.aiAgentRatePerMinute,
        whatsappRate: values.whatsappRate
      },
      create: {
        id: "default",
        phoneNumberMarkupMultiplier: values.phoneNumberMarkupMultiplier,
        phoneNumberMarkupFixed: values.phoneNumberMarkupFixed,
        smsRate: values.smsRate,
        callRatePerMinute: values.callBaseRatePerMinute * (1 + values.callMarkupPercent / 100),
        callBaseRatePerMinute: values.callBaseRatePerMinute,
        callMarkupPercent: values.callMarkupPercent,
        aiAgentRatePerMinute: values.aiAgentRatePerMinute,
        whatsappRate: values.whatsappRate
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erreur updatePricingSettings:", error);
    return { error: "Erreur lors de la mise à jour des paramètres" };
  }
}
