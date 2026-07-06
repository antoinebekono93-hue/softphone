import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // This is a cron job endpoint. It can be triggered by Vercel Cron.
  try {
    // 1. Fetch active enrollments that are due to run
    const enrollments = await prisma.whatsAppFlowEnrollment.findMany({
      where: {
        status: "ACTIVE",
        contact: {
          optedOut: false // Phase 2: Ne pas exécuter pour les opt-outs
        },
        OR: [
          { nextRunAt: null },
          { nextRunAt: { lte: new Date() } }
        ]
      },
      include: {
        flow: true,
        contact: true,
        organization: {
          include: {
            whatsappAccount: true
          }
        }
      }
    });

    if (enrollments.length === 0) {
      return NextResponse.json({ success: true, message: "No enrollments to process" });
    }

    const telnyxApiKey = process.env.TELNYX_API_KEY;

    for (const enrollment of enrollments) {
      const nodes = typeof enrollment.flow.nodes === 'string' ? JSON.parse(enrollment.flow.nodes) : enrollment.flow.nodes;
      const edges = typeof enrollment.flow.edges === 'string' ? JSON.parse(enrollment.flow.edges) : enrollment.flow.edges;
      
      // If currentNodeId is null, start at the trigger
      let currentNode = null;
      if (!enrollment.currentNodeId) {
        currentNode = (nodes as any[]).find(n => n.type === 'trigger');
      } else {
        currentNode = (nodes as any[]).find(n => n.id === enrollment.currentNodeId);
      }

      if (!currentNode) {
        // Complete if no node found
        await prisma.whatsAppFlowEnrollment.update({
          where: { id: enrollment.id },
          data: { status: "COMPLETED" }
        });
        continue;
      }

      // Evaluate the current node
      let nextNodeId = null;
      let nextRunAt = null;

      if (currentNode.type === 'trigger') {
        // Just pass through
        const outgoingEdge = (edges as any[]).find(e => e.source === currentNode.id);
        nextNodeId = outgoingEdge ? outgoingEdge.target : null;
      } 
      else if (currentNode.type === 'message') {
        // Send a message
        const waAccount = enrollment.organization.whatsappAccount;
        if (waAccount && waAccount.phoneNumberId && telnyxApiKey) {
           const payload = currentNode.data.messageType === 'template' ? {
              to: enrollment.contact.phone,
              messaging_product: "whatsapp",
              recipient_type: "individual",
              type: "template",
              template: {
                name: currentNode.data.templateName,
                language: { policy: "deterministic", code: "fr" },
                components: []
              }
           } : {
              to: enrollment.contact.phone,
              messaging_product: "whatsapp",
              recipient_type: "individual",
              type: "text",
              text: { body: currentNode.data.text || "Hello" }
           };

           try {
             const telnyxRes = await fetch(`https://api.telnyx.com/v2/whatsapp_messages/${waAccount.phoneNumberId}/messages`, {
               method: "POST",
               headers: {
                 "Authorization": `Bearer ${telnyxApiKey}`,
                 "Content-Type": "application/json",
               },
               body: JSON.stringify(payload)
             });

             if (telnyxRes.ok) {
                // Log SMS
                await prisma.smsMessage.create({
                  data: {
                    telnyxMessageId: `flow_${Date.now()}`,
                    direction: "OUTBOUND",
                    body: `[Flow] ${currentNode.data.messageType === 'template' ? currentNode.data.templateName : currentNode.data.text}`,
                    status: "SENT",
                    type: "WHATSAPP",
                    fromNumber: waAccount.phoneNumber,
                    toNumber: enrollment.contact.phone,
                    organizationId: enrollment.organizationId,
                    contactId: enrollment.contactId
                  }
                });
             }
           } catch (e) {
             console.error("Failed to send message in flow", e);
           }
        }
        
        // Find next node
        const outgoingEdge = (edges as any[]).find(e => e.source === currentNode.id);
        nextNodeId = outgoingEdge ? outgoingEdge.target : null;
      }
      else if (currentNode.type === 'delay') {
        // Check if we just arrived here or if the delay has finished
        // We know the delay has finished because nextRunAt is <= now
        const outgoingEdge = (edges as any[]).find(e => e.source === currentNode.id);
        nextNodeId = outgoingEdge ? outgoingEdge.target : null;
      }
      else if (currentNode.type === 'condition') {
        const variables = enrollment.variables as any;
        const conditionType = currentNode.data.conditionType || 'has_replied';
        
        let isTrue = false;
        if (conditionType === 'has_replied') {
           isTrue = variables?.hasReplied === true;
        } else if (conditionType === 'contains_yes') {
           isTrue = variables?.lastMessage?.toLowerCase().includes('oui');
        } else if (conditionType === 'contains_no') {
           isTrue = variables?.lastMessage?.toLowerCase().includes('non');
        }

        const edgeHandle = isTrue ? 'true' : 'false';
        const outgoingEdge = (edges as any[]).find(e => e.source === currentNode.id && e.sourceHandle === edgeHandle);
        nextNodeId = outgoingEdge ? outgoingEdge.target : null;
      }

      // If the next node is a Delay, calculate its nextRunAt right now!
      if (nextNodeId) {
        const nextNode = (nodes as any[]).find(n => n.id === nextNodeId);
        if (nextNode && nextNode.type === 'delay') {
           const duration = parseInt(nextNode.data.duration || "1", 10);
           const unit = nextNode.data.unit || "minutes";
           const runAt = new Date();
           if (unit === 'minutes') runAt.setMinutes(runAt.getMinutes() + duration);
           if (unit === 'hours') runAt.setHours(runAt.getHours() + duration);
           if (unit === 'days') runAt.setDate(runAt.getDate() + duration);
           nextRunAt = runAt;
        }
      }

      // Update enrollment
      await prisma.whatsAppFlowEnrollment.update({
        where: { id: enrollment.id },
        data: {
          currentNodeId: nextNodeId,
          status: nextNodeId ? "ACTIVE" : "COMPLETED",
          nextRunAt: nextRunAt,
        }
      });
    }

    return NextResponse.json({ success: true, processed: enrollments.length });
  } catch (error: any) {
    console.error("Cron Error", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
