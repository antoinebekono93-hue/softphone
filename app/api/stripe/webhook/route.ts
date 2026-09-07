import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { stripe, getPlanFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { creditWalletAtomically } from "@/lib/billing";
import type Stripe from "stripe";

const STRIPE_PROVIDER = "STRIPE";

function isUniqueConstraintError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events.
 *
 * Idempotence ATOMIQUE :
 *  - La signature Stripe est vérifiée (constructEvent).
 *  - L'`event.id` est revendiqué dans la MÊME transaction que les effets :
 *    `INSERT INTO WebhookEvent (provider, eventId) VALUES ('STRIPE', ...)`.
 *    Deux livraisons concurrentes du même event : le premier INSERT gagne,
 *    le second échoue sur la contrainte unique (P2002) → toute sa transaction
 *    est annulée (aucun crédit), on répond `received: true, duplicate: true`.
 *  - Si les effets échouent, la transaction (claim inclus) est ROLLBACK →
 *    le retry Stripe re-traitera l'event correctement.
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

    let duplicate = false;

    try {
      await prisma.$transaction(async (tx) => {
        // Claim atomique de l'événement (contrainte unique provider+eventId).
        await tx.webhookEvent.create({
          data: {
            provider: STRIPE_PROVIDER,
            eventId: event.id,
            type: event.type,
            organizationId: getEventOrganizationId(event),
          },
        });

        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutCompleted(session, tx);
            break;
          }

          case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            await handleInvoicePaid(invoice, tx);
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            await handlePaymentFailed(invoice, tx);
            break;
          }

          case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionUpdated(subscription, tx);
            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionDeleted(subscription, tx);
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        // Déjà traité (event.id stocké). Aucun second crédit, réponse idempotente.
        duplicate = true;
      } else {
        throw err;
      }
    }

    return NextResponse.json({ received: true, duplicate });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

function getEventOrganizationId(event: Stripe.Event): string | null {
  const object = event.data?.object as
    | { metadata?: Record<string, string> }
    | undefined;
  return object?.metadata?.organizationId ?? null;
}

/**
 * After a successful checkout, activate the plan and provision Twilio, or top up wallet.
 * Exécuté DANS la transaction d'idempotence (un seul crédit par event.id).
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  tx: Prisma.TransactionClient
) {
  const organizationId = session.metadata?.organizationId;
  const plan = session.metadata?.plan as "STARTER" | "PRO" | "ENTERPRISE";
  const type = session.metadata?.type;

  if (!organizationId) {
    console.error("[Stripe] Missing organizationId in checkout session");
    return;
  }

  const org = await tx.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) return;

  if (type === "WALLET_TOPUP") {
    const amountStr = session.metadata?.amount;
    const amount = parseFloat(amountStr || "0");

    if (amount > 0) {
      await creditWalletAtomically(tx, organizationId, amount);
      await tx.walletTransaction.create({
        data: {
          organizationId,
          amount,
          type: "CREDIT",
          description: `Recharge Wallet via Stripe (Session: ${session.id})`,
        },
      });
      console.log(
        `[Stripe] Organization ${organizationId} wallet topped up by ${amount} (Session: ${session.id})`
      );
    }
    return;
  }

  if (plan) {
    await tx.organization.update({
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
async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  tx: Prisma.TransactionClient
) {
  const invAny = invoice as any;
  const subscriptionId =
    typeof invAny.subscription === "string"
      ? invAny.subscription
      : invAny.subscription?.id;

  if (!subscriptionId) return;

  await tx.organization.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { planStatus: "ACTIVE" },
  });
}

/**
 * Mark the plan as past_due when payment fails.
 */
async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  tx: Prisma.TransactionClient
) {
  const invAny = invoice as any;
  const subscriptionId =
    typeof invAny.subscription === "string"
      ? invAny.subscription
      : invAny.subscription?.id;

  if (!subscriptionId) return;

  await tx.organization.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { planStatus: "PAST_DUE" },
  });
}

/**
 * Handle plan changes (upgrades/downgrades).
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  tx: Prisma.TransactionClient
) {
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const newPlan = getPlanFromPriceId(priceId);
  if (!newPlan) return;

  await tx.organization.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      planStatus: subscription.status === "active" ? "ACTIVE" : "PAST_DUE",
    },
  });
}

/**
 * Cancel the subscription — mark plan as canceled.
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  tx: Prisma.TransactionClient
) {
  await tx.organization.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { planStatus: "CANCELED" },
  });
}