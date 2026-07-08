import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlanFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/utils";
import type Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events to keep our database in sync
 * with subscription status changes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * After a successful checkout, activate the plan and provision Twilio, or top up wallet.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  const plan = session.metadata?.plan as "STARTER" | "PRO" | "ENTERPRISE";
  const type = session.metadata?.type;

  if (!organizationId) {
    console.error("[Stripe] Missing organizationId in checkout session");
    return;
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) return;

  if (type === 'WALLET_TOPUP') {
    const amountStr = session.metadata?.amount;
    const amount = parseFloat(amountStr || '0');
    
    if (amount > 0) {
      const { creditWallet } = await import('@/lib/billing');
      await creditWallet(organizationId, amount, `Recharge Wallet via Stripe (Session: ${session.id})`);
      console.log(`[Stripe] Organization ${organizationId} wallet topped up by ${amount}€`);
    }
    return;
  }

  if (plan) {
    // Update the organization for plan subscription
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        planStatus: "ACTIVE",
        stripeSubscriptionId: session.subscription as string,
      },
    });

    console.log(
      `[Stripe] Organization ${organizationId} activated with plan ${plan}`
    );
  }
}

/**
 * Keep the plan active when invoices are paid.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const invAny = invoice as any;
  const subscriptionId =
    typeof invAny.subscription === "string"
      ? invAny.subscription
      : invAny.subscription?.id;

  if (!subscriptionId) return;

  await prisma.organization.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { planStatus: "ACTIVE" },
  });
}

/**
 * Mark the plan as past_due when payment fails.
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const invAny = invoice as any;
  const subscriptionId =
    typeof invAny.subscription === "string"
      ? invAny.subscription
      : invAny.subscription?.id;

  if (!subscriptionId) return;

  await prisma.organization.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { planStatus: "PAST_DUE" },
  });
}

/**
 * Handle plan changes (upgrades/downgrades).
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const newPlan = getPlanFromPriceId(priceId);
  if (!newPlan) return;

  await prisma.organization.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      planStatus: subscription.status === "active" ? "ACTIVE" : "PAST_DUE",
    },
  });
}

/**
 * Cancel the subscription — mark plan as canceled.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.organization.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { planStatus: "CANCELED" },
  });
}
