import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processMetaMessage } from "@/lib/ai/meta-agent";
import { sendMetaMessage } from "@/lib/meta/send-message";

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "antigravity_secret_token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if it's an event from a page subscription (Facebook/Instagram) or whatsapp_business_account
    if (body.object === "page" || body.object === "instagram" || body.object === "whatsapp_business_account") {
      
      for (const entry of body.entry) {
        // Find which SocialAccount this entry is for
        // entry.id is the Page ID or WhatsApp Business Account ID
        const accountId = entry.id;

        // Process messaging events
        if (entry.messaging) {
          for (const event of entry.messaging) {
            // Placeholder: Here we will route the message to the corresponding AI Agent
            console.log("Received Meta message:", JSON.stringify(event, null, 2));
            
            // Example routing logic:
            if (event.message && event.message.text && event.sender && event.sender.id) {
              const senderId = event.sender.id;
              const text = event.message.text;

              const account = await prisma.socialAccount.findFirst({ where: { accountId, status: "ACTIVE" } });
              
              if (account && account.aiEmployeeId) {
                const agent = await prisma.aIEmployee.findUnique({ where: { id: account.aiEmployeeId } });
                
                if (agent && agent.isActive) {
                  // BUG #1 FIX: Check if contact is in escalation (human takeover) before calling AI
                  const existingContact = await prisma.contact.findFirst({
                    where: { organizationId: account.organizationId, phone: senderId }
                  });
                  if (existingContact && existingContact.escalationStatus === 'REQUESTED') {
                    console.log(`[Meta Webhook] Skipping AI for ${senderId} — human takeover active.`);
                    return new NextResponse("EVENT_RECEIVED", { status: 200 });
                  }

                  // Save incoming message
                  await prisma.socialMessage.create({
                    data: {
                      provider: account.provider,
                      direction: "INBOUND",
                      content: text,
                      senderId: senderId,
                      recipientId: accountId,
                      organizationId: account.organizationId,
                      aiEmployeeId: agent.id
                    }
                  });

                  // Process with AI Brain (OpenAI Assistant)
                  const aiResponse = await processMetaMessage(text, senderId, account, agent);

                  if (aiResponse) {
                    // Send response back via Meta Graph API
                    const sent = await sendMetaMessage(senderId, aiResponse, account.accessToken, account.provider);
                    
                    if (sent) {
                      // Save outbound message
                      await prisma.socialMessage.create({
                        data: {
                          provider: account.provider,
                          direction: "OUTBOUND",
                          content: aiResponse,
                          senderId: accountId,
                          recipientId: senderId,
                          organizationId: account.organizationId,
                          aiEmployeeId: agent.id
                        }
                      });
                    }
                  }
                }
              }
            }
          }
        }
        
        // Feed changes (Comments & Posts) and WhatsApp changes
        if (entry.changes) {
          for (const change of entry.changes) {
            
            // 1. Handle Facebook Comments
            if (change.field === "feed" && change.value?.item === "comment" && change.value?.verb === "add") {
              const comment = change.value;
              console.log("Received Facebook comment:", JSON.stringify(comment, null, 2));
              
              if (comment.from?.id && comment.from.id !== accountId) {
                const account = await prisma.socialAccount.findFirst({ where: { accountId, status: "ACTIVE" } });
                if (account && account.aiEmployeeId) {
                  const agent = await prisma.aIEmployee.findUnique({ where: { id: account.aiEmployeeId } });
                  if (agent && agent.isActive) {

                    // BUG #1 FIX: Check if the commenter's contact is in human takeover
                    const existingContact = await prisma.contact.findFirst({
                      where: { organizationId: account.organizationId, phone: comment.from.id }
                    });
                    if (existingContact && existingContact.escalationStatus === 'REQUESTED') {
                      console.log(`[Meta Webhook] Skipping comment AI for ${comment.from.id} — human takeover active.`);
                      continue;
                    }

                    // Save incoming comment as SocialMessage so it shows in Inbox
                    await prisma.socialMessage.create({
                      data: {
                        provider: account.provider,
                        direction: "INBOUND",
                        content: comment.message,
                        senderId: comment.from.id,
                        recipientId: accountId,
                        organizationId: account.organizationId,
                        aiEmployeeId: agent.id
                      }
                    });

                    // Process comment via AI
                    const { processMetaComment } = await import("@/lib/ai/meta-agent");
                    const aiResponse = await processMetaComment(comment.message, comment.from.id, account, agent, comment.post_id);

                    if (aiResponse) {
                      const { sendMetaCommentReply } = await import("@/lib/meta/send-comment");
                      
                      let sent = false;
                      if (agent.replyToCommentsPublicly) {
                        sent = await sendMetaCommentReply(comment.comment_id, aiResponse, account.accessToken, "PUBLIC");
                      }
                      if (agent.replyToCommentsPrivately) {
                        const privateSent = await sendMetaCommentReply(comment.comment_id, aiResponse, account.accessToken, "PRIVATE");
                        sent = sent || privateSent;
                      }
                      
                      if (sent) {
                        // Save outbound response
                        await prisma.socialMessage.create({
                          data: {
                            provider: account.provider,
                            direction: "OUTBOUND",
                            content: aiResponse,
                            senderId: accountId,
                            recipientId: comment.from.id,
                            organizationId: account.organizationId,
                            aiEmployeeId: agent.id
                          }
                        });
                      }
                    }
                  }
                }
              }
            }

            // 2. WhatsApp specific events
            if (change.value && change.value.messages) {
              console.log("Received WhatsApp message:", JSON.stringify(change.value.messages, null, 2));
              // Routing logic for WA...
            }
          }
        }
      }

      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    } else {
      return new NextResponse("Not Found", { status: 404 });
    }
  } catch (error) {
    console.error("Meta Webhook Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
