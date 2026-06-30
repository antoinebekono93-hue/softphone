"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleAiAutomation(isActive: boolean, campaignId?: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Find existing rule or create it
    let rule = await prisma.automationRule.findFirst({
      where: {
        organizationId: session.user.organizationId,
        triggerType: 'NO_ANSWER_AI'
      }
    });

    const payload = JSON.stringify({ campaignId: campaignId || "" });

    if (rule) {
      await prisma.automationRule.update({
        where: { id: rule.id },
        data: { isActive, actionPayload: payload }
      });
    } else {
      await prisma.automationRule.create({
        data: {
          name: "Relance IA vers SMS",
          triggerType: "NO_ANSWER_AI",
          actionType: "ADD_TO_CAMPAIGN",
          actionPayload: payload,
          isActive,
          organizationId: session.user.organizationId
        }
      });
    }

    revalidatePath("/dashboard/automations");
    return { success: true };
  } catch (error) {
    console.error("[toggleAiAutomation]", error);
    return { success: false, error: "Server Error" };
  }
}
