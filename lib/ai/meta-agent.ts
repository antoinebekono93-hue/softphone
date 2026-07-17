import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";
import { syncAgentSkillsWithOpenAI } from "@/lib/openai-skills";
import { handleRequiresAction } from "@/lib/ai/tool-runner";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function processMetaMessage(
  messageContent: string,
  senderId: string,
  socialAccount: any,
  agent: any
) {
  try {
    // 1. Find or create the Contact
    let contact = await prisma.contact.findFirst({
      where: {
        organizationId: agent.organizationId,
        // using notes to store PSID for MVP or just rely on a new field.
        // In this implementation we search by senderId as a proxy for phone/ID
        phone: senderId 
      }
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          phone: senderId, // Storing PSID or IG-ID here temporarily
          name: "Client Social",
          organizationId: agent.organizationId,
          botMode: true
        }
      });
    }

    // 2. Manage OpenAI Thread
    let threadId = contact.openaiThreadId;
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      await prisma.contact.update({
        where: { id: contact.id },
        data: { openaiThreadId: threadId }
      });
    }

    // 3. Setup Assistant
    let assistantId = agent.openaiAssistantId;
    if (!assistantId) {
      // Create a bare assistant first
      const assistant = await openai.beta.assistants.create({
        name: agent.name,
        instructions: agent.systemPrompt,
        model: "gpt-4o-mini",
      });
      assistantId = assistant.id;

      await prisma.aIEmployee.update({
        where: { id: agent.id },
        data: { openaiAssistantId: assistantId }
      });

      // BUG #2 FIX: Immediately sync all tools (CRM, social, custom skills, knowledge)
      await syncAgentSkillsWithOpenAI(agent.id);
    }

    // 4. Add message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: messageContent,
    });

    // 5. Run Assistant
    let run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });

    // Handle tool calls if any
    if (run.status === 'requires_action') {
      const actionResult = await handleRequiresAction(run, threadId, contact.id, agent.organizationId, openai);
      run = actionResult.run;
      // You can handle actionResult.escalated here if needed
    }

    // 6. Fetch response
    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(run.thread_id);
      // The newest message is first in the list
      const latestMessage = messages.data[0];
      
      if (latestMessage.role === 'assistant' && latestMessage.content[0].type === 'text') {
        return latestMessage.content[0].text.value;
      }
    } else {
      console.error("OpenAI Run failed:", run.status);
      return "Désolé, je rencontre des difficultés techniques. Je reviens vers vous dans un instant.";
    }

  } catch (error) {
    console.error("Error processing Meta message:", error);
    return null;
  }
}

export async function processMetaComment(
  commentText: string,
  senderId: string,
  socialAccount: any,
  agent: any,
  postId: string
) {
  try {
    // 1. Setup Assistant if not exists
    let assistantId = agent.openaiAssistantId;
    if (!assistantId) {
      const assistant = await openai.beta.assistants.create({
        name: agent.name,
        instructions: agent.systemPrompt,
        model: "gpt-4o-mini",
      });
      assistantId = assistant.id;

      await prisma.aIEmployee.update({
        where: { id: agent.id },
        data: { openaiAssistantId: assistantId }
      });

      // BUG #2 FIX: Immediately sync all tools
      await syncAgentSkillsWithOpenAI(agent.id);
    }

    // 2. Create a temporary thread for this comment interaction
    // We don't necessarily want to mix all comments into one massive thread per user,
    // but for simplicity, we create a new thread for this specific comment.
    const thread = await openai.beta.threads.create();

    // 3. Add context and user message
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `CONTEXTE: Tu réponds à un commentaire public d'un utilisateur sous une publication Facebook (Post ID: ${postId}).\n\nCOMMENTAIRE DE L'UTILISATEUR:\n"${commentText}"\n\nINSTRUCTIONS: Réponds de manière engageante, polie, et en respectant ton persona. Si le client pose une question complexe, suggère-lui de nous contacter en privé. Ta réponse sera publiée directement sous son commentaire.`,
    });

    // 4. Run Assistant
    let run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistantId,
    });

    // Handle tool calls if any (No specific contactId for temporary comment threads unless we create it)
    if (run.status === 'requires_action') {
      const actionResult = await handleRequiresAction(run, thread.id, null, agent.organizationId, openai);
      run = actionResult.run;
    }

    // 5. Fetch response
    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(run.thread_id);
      const latestMessage = messages.data[0];
      
      if (latestMessage.role === 'assistant' && latestMessage.content[0].type === 'text') {
        return latestMessage.content[0].text.value;
      }
    } else {
      console.error("OpenAI Run failed:", run.status);
    }
    return null;

  } catch (error) {
    console.error("Error processing Meta comment:", error);
    return null;
  }
}
