"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getAgents() {
  const session = await auth();
  if (!session?.user?.organizationId) return [];

  return await prisma.voiceAIAgent.findMany({
    where: { organizationId: session.user.organizationId },
    include: { phoneNumber: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getAvailableNumbers() {
  const session = await auth();
  if (!session?.user?.organizationId) return [];

  return await prisma.phoneNumber.findMany({
    where: { 
      organizationId: session.user.organizationId,
      // Optional: Only return numbers not already assigned to an AI agent, or return all so they can re-assign
    }
  });
}

export async function saveAgent(data: any) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const { id, name, prompt, voice, language, phoneNumberId } = data;

    if (id) {
      // Update
      await prisma.voiceAIAgent.update({
        where: { id, organizationId: session.user.organizationId },
        data: {
          name,
          prompt,
          voice,
          language,
          phoneNumberId: phoneNumberId || null
        }
      });
    } else {
      // Create
      await prisma.voiceAIAgent.create({
        data: {
          name,
          prompt,
          voice,
          language,
          phoneNumberId: phoneNumberId || null,
          organizationId: session.user.organizationId
        }
      });
    }

    revalidatePath("/dashboard/ai-agents");
    return { success: true };
  } catch (error: any) {
    console.error("[Save AI Agent Error]", error);
    return { error: "Failed to save AI Agent" };
  }
}

export async function deleteAgent(id: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    await prisma.voiceAIAgent.delete({
      where: { id, organizationId: session.user.organizationId }
    });
    revalidatePath("/dashboard/ai-agents");
    return { success: true };
  } catch (error: any) {
    return { error: "Failed to delete AI Agent" };
  }
}
