import { prisma } from "./prisma";

type WebhookEventType = 
  | "ticket.escalated" 
  | "call.completed" 
  | "contact.created" 
  | "message.received"
  | "payment.succeeded";

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: any;
}

/**
 * Dispatches a generic webhook event to the organization's configured webhookUrl.
 * It's executed asynchronously to not block the main request thread.
 */
export async function dispatchOrganizationWebhook(organizationId: string, event: WebhookEventType, data: any) {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { webhookUrl: true, webhookSecret: true }
    });

    if (!org || !org.webhookUrl) {
      return; // Webhook not configured
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Antigravity-Webhook-Dispatcher/1.0",
    };

    if (org.webhookSecret) {
        headers["X-Webhook-Secret"] = org.webhookSecret;
    }

    // Fire and forget
    fetch(org.webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }).catch(err => {
      console.error(`[Webhook] Failed to dispatch ${event} to ${org.webhookUrl}:`, err);
    });
    
    console.log(`[Webhook] Dispatched ${event} to ${org.webhookUrl}`);

  } catch (error) {
    console.error(`[Webhook] Error dispatching event ${event}:`, error);
  }
}
