"use server";

import { stripe } from "@/lib/stripe";
import { flutterwave } from "@/lib/flutterwave";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function createStripeTopupSession(amount: number) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Not authenticated or no organization");
  }

  const orgId = session.user.organizationId;
  const userEmail = session.user.email || "user@example.com";
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Wallet Top-up' },
        unit_amount: amount * 100, // Stripe works in cents
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${appUrl}/dashboard/billing?status=success`,
    cancel_url: `${appUrl}/dashboard/billing?status=canceled`,
    metadata: {
      orgId,
      type: 'wallet_topup',
    }
  });

  if (!stripeSession.url) {
    throw new Error("Failed to create Stripe session URL");
  }

  return { url: stripeSession.url };
}

export async function createFlutterwaveTopupLink(amount: number) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Not authenticated or no organization");
  }

  const orgId = session.user.organizationId;
  const userEmail = session.user.email || "user@example.com";
  const userName = session.user.name || "User";
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const txRef = `topup-${orgId}-${Date.now()}`;

  const fwResponse = await flutterwave.payments.create({
    tx_ref: txRef,
    amount,
    currency: 'USD',
    redirect_url: `${appUrl}/dashboard/billing?status=success`,
    customer: {
      email: userEmail,
      name: userName
    },
    meta: {
      orgId,
      type: 'wallet_topup'
    },
    customizations: {
      title: 'Antigravity Wallet Top-up'
    }
  });

  if (!fwResponse.link) {
    throw new Error("Failed to create Flutterwave payment link");
  }

  return { url: fwResponse.link };
}
