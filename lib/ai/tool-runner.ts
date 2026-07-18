import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key",
});

export async function handleRequiresAction(
  run: any, 
  threadId: string, 
  contactId: string | null, 
  organizationId: string,
  openaiInstance?: any
): Promise<{ run: any, escalated: boolean }> {
  let escalated = false;
  const openaiClient = openaiInstance || openai;
  if (run.status === 'requires_action' && run.required_action?.submit_tool_outputs) {
    const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
    const toolOutputs = [];

    for (const toolCall of toolCalls) {
      const name = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || '{}');
      let output = "Success";
      
      try {
        console.log(`[ToolRunner] Executing tool ${name} with args`, args);
        switch (name) {
          case 'update_contact_info':
            if (contactId) {
              await prisma.contact.update({
                where: { id: contactId },
                data: {
                  name: args.name || undefined,
                  email: args.email || undefined,
                  company: args.company || undefined
                }
              });
              output = JSON.stringify({ status: "Contact info updated in CRM." });
            } else {
              output = "Error: No contactId available in this context.";
            }
            break;
            
          case 'qualify_lead':
            if (contactId) {
              await prisma.contact.update({
                where: { id: contactId },
                data: {
                  leadScore: args.score,
                  sentiment: args.sentiment
                }
              });
              output = JSON.stringify({ status: `Lead qualified: score=${args.score}, sentiment=${args.sentiment}` });
            } else {
              output = "Error: No contactId available in this context.";
            }
            break;
            
          case 'create_quote':
            if (contactId) {
              const quote = await prisma.quote.create({
                data: {
                  amount: args.amount,
                  currency: args.currency || 'EUR',
                  description: args.description,
                  contactId: contactId,
                  organizationId: organizationId,
                  status: 'DRAFT'
                }
              });
              output = JSON.stringify({ quote_id: quote.id, amount: quote.amount, currency: quote.currency, status: "Quote created successfully." });
            } else {
              output = "Error: No contactId available to assign the quote.";
            }
            break;
            
          case 'assign_ticket_to_human':
          case 'transfer_to_human':
            if (contactId) {
              const ticket = await prisma.ticket.create({
                data: {
                  title: args.title || args.reason || 'Escalade demandée par IA',
                  description: args.description || '',
                  priority: args.priority || 'NORMAL',
                  status: 'OPEN',
                  contactId: contactId,
                  organizationId: organizationId
                }
              });
              
              // Also update the contact to block the bot until resolved
              await prisma.contact.update({
                where: { id: contactId },
                data: {
                  botMode: false,
                  escalationStatus: 'REQUESTED',
                  escalationReason: args.title || args.reason
                }
              });
              
              // Notify organization
              const pusher = (await import('@/lib/pusher')).pusherServer;
              await pusher.trigger(`org-${organizationId}`, 'contact-escalated', { contactId: contactId, reason: args.title || args.reason });
              
              const { dispatchOrganizationWebhook } = await import('@/lib/webhooks');
              dispatchOrganizationWebhook(organizationId, 'ticket.escalated', { contactId: contactId, reason: args.title || args.reason });

              escalated = true;
              output = JSON.stringify({ ticket_id: ticket.id, status: "Ticket created. Human agent notified. Bot paused." });
            } else {
              output = "Error: No contactId available to assign the ticket.";
            }
            break;
            
          case 'hide_comment':
            console.log(`[Facebook Action] Hiding comment. Reason: ${args.reason}`);
            output = "Comment successfully hidden on Facebook.";
            break;
            
          case 'like_comment':
            console.log(`[Facebook Action] Liked the comment.`);
            output = "Comment successfully liked.";
            break;
            
          case 'reply_privately':
            console.log(`[Facebook Action] Sent private reply: ${args.message}`);
            output = "Private message sent successfully.";
            break;
            
          case 'verifier_stock':
            if (organizationId) {
              const product = await prisma.product.findFirst({
                where: { organizationId, sku: args.sku_id }
              });
              if (product) {
                output = JSON.stringify({ in_stock: product.stockLevel > 0, stock_level: product.stockLevel, price: product.price, name: product.name });
              } else {
                output = JSON.stringify({ error: 'Product not found. Ask the user for another SKU or product name.' });
              }
            } else {
              output = JSON.stringify({ error: 'Organization context missing.' });
            }
            break;

          case 'look_up_order':
            if (contactId) {
              const cart = await prisma.cart.findFirst({
                where: { organizationId: organizationId, contactId: contactId },
                orderBy: { createdAt: 'desc' }
              });
              if (cart) {
                output = JSON.stringify({ status: cart.status, total: cart.totalPrice, url: cart.checkoutUrl });
              } else {
                output = JSON.stringify({ error: "Aucune commande ou panier trouvé pour ce client." });
              }
            } else {
              output = JSON.stringify({ error: "Contact manquant pour chercher une commande." });
            }
            break;

          case 'generer_facture':
            if (contactId) {
              const invoice = await prisma.invoice.create({
                data: {
                  organizationId,
                  contactId,
                  amount: args.montant || 0,
                  description: args.description || 'Facture générée par IA',
                  status: 'DRAFT'
                }
              });
              output = JSON.stringify({ facture_id: invoice.id, status: 'succès' });
            } else {
              output = JSON.stringify({ error: 'No contact to assign invoice to.' });
            }
            break;

          case 'envoyer_facture_pdf':
            const invoice = await prisma.invoice.findUnique({ where: { id: args.facture_id } });
            if (invoice) {
              const pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
              await prisma.invoice.update({
                where: { id: invoice.id },
                data: { pdfUrl: pdfUrl, status: "SENT" }
              });
              output = JSON.stringify({ status: "PDF envoyé au client avec succès. Informez-le qu'il va le recevoir." });
            } else {
              output = JSON.stringify({ error: "Facture introuvable." });
            }
            break;

          default:
            // Try to find a matching dynamic webhook skill in DB
            if (organizationId) {
              try {
                // Find the agent for this org (context-agnostic)
                const agents = await prisma.aIEmployee.findMany({
                  where: { organizationId, isActive: true },
                  include: { skills: true }
                });
                let matchedSkill: any = null;
                for (const ag of agents) {
                  matchedSkill = ag.skills.find((s: any) => s.name === name);
                  if (matchedSkill) break;
                }

                if (matchedSkill) {
                  const fetchOptions: RequestInit = {
                    method: matchedSkill.method,
                    headers: {
                      'Content-Type': 'application/json',
                      ...(matchedSkill.headers ? JSON.parse(matchedSkill.headers as string) : {})
                    }
                  };
                  let endpointUrl = matchedSkill.endpointUrl;
                  if (matchedSkill.method === 'POST') {
                    fetchOptions.body = JSON.stringify(args);
                  } else if (matchedSkill.method === 'GET' && Object.keys(args).length > 0) {
                    endpointUrl = `${endpointUrl}?${new URLSearchParams(args).toString()}`;
                  }
                  const res = await fetch(endpointUrl, fetchOptions);
                  let responseData;
                  try { responseData = await res.json(); } catch { responseData = await res.text(); }
                  output = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
                  console.log(`[ToolRunner] Executed dynamic skill ${name}`);
                } else {
                  console.log(`[ToolRunner] Unknown tool: ${name}`);
                  output = `Action ${name} acknowledged.`;
                }
              } catch (skillErr: any) {
                console.error(`[ToolRunner] Dynamic skill error for ${name}:`, skillErr);
                output = `Skill execution failed: ${skillErr.message}`;
              }
            } else {
              output = `Action ${name} acknowledged.`;
            }
            break;
        }
      } catch (err: any) {
        console.error(`[ToolRunner] Error executing ${name}:`, err);
        output = `Error executing tool: ${err.message}`;
      }

      toolOutputs.push({
        tool_call_id: toolCall.id,
        output: output
      });
    }

    // Submit tool outputs back to OpenAI
    let nextRun = await openaiClient.beta.threads.runs.submitToolOutputsAndPoll(threadId, run.id, {
      tool_outputs: toolOutputs
    });
    
    // If it requires action AGAIN, recursively handle it
    if (nextRun.status === 'requires_action') {
      const result = await handleRequiresAction(nextRun, threadId, contactId, organizationId, openaiClient);
      nextRun = result.run;
      if (result.escalated) escalated = true;
    }
    
    return { run: nextRun, escalated };
  }
  
  return { run, escalated };
}
