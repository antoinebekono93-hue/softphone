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
    const { id, name, prompt, greeting, voice, language, phoneNumberId } = data;

    // Telnyx Payload
    const telnyxPayload = {
      name,
      system_prompt: prompt,
      greeting_message: greeting || "",
      model: "openai/gpt-4o", // Default model for Voice Assistant
      voice,
      language
    };

    let telnyxId = "";

    if (id) {
      // It's an update. We need the existing telnyxId
      const existing = await prisma.voiceAIAgent.findUnique({ where: { id } });
      if (!existing) return { error: "Agent not found" };

      telnyxId = existing.telnyxId || "";

      if (telnyxId) {
        // Update on Telnyx
        await fetch(`https://api.telnyx.com/v2/ai/assistants/${telnyxId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(telnyxPayload)
        });
      }
    }

    if (!telnyxId) {
      // Create on Telnyx
      const res = await fetch(`https://api.telnyx.com/v2/ai/assistants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(telnyxPayload)
      });
      
      const resJson = await res.json();
      if (resJson.data && resJson.data.id) {
        telnyxId = resJson.data.id;
      }
    }

    // Now save to DB
    if (id) {
      await prisma.voiceAIAgent.update({
        where: { id, organizationId: session.user.organizationId },
        data: {
          name,
          prompt,
          greeting,
          voice,
          language,
          telnyxId,
          phoneNumberId: phoneNumberId || null
        }
      });
    } else {
      await prisma.voiceAIAgent.create({
        data: {
          name,
          prompt,
          greeting,
          voice,
          language,
          telnyxId,
          phoneNumberId: phoneNumberId || null,
          organizationId: session.user.organizationId
        }
      });
    }

    // Link Phone Number to Assistant in Telnyx
    if (phoneNumberId && telnyxId) {
      const phoneNumber = await prisma.phoneNumber.findUnique({
        where: { id: phoneNumberId }
      });
      
      if (phoneNumber?.telnyxId) {
        // According to Telnyx docs, an AI Assistant acts as a connection.
        // We update the phone number's connection_id to the assistant's ID
        await fetch(`https://api.telnyx.com/v2/phone_numbers/${phoneNumber.telnyxId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ connection_id: telnyxId })
        });
      }
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
    const existing = await prisma.voiceAIAgent.findUnique({
      where: { id, organizationId: session.user.organizationId }
    });

    if (existing?.telnyxId) {
      // Delete on Telnyx
      await fetch(`https://api.telnyx.com/v2/ai/assistants/${existing.telnyxId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`
        }
      });
    }

    await prisma.voiceAIAgent.delete({
      where: { id, organizationId: session.user.organizationId }
    });
    
    revalidatePath("/dashboard/ai-agents");
    return { success: true };
  } catch (error: any) {
    return { error: "Failed to delete AI Agent" };
  }
}
