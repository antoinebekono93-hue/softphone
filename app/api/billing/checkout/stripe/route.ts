import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Initialize Stripe. We use a dummy key if not present in env to allow build to pass
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2023-10-16" as any,
});

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // In a real app, you would get the authenticated user and their organization ID.
    // For this demo, we'll just pick the first organization as the mock user.
    const org = await prisma.organization.findFirst();

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Recharge Wallet (Antigravity)",
              description: "Crédit prépayé pour les appels, SMS et IA",
            },
            unit_amount: amount * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/dashboard/billing?success=true`,
      cancel_url: `${origin}/dashboard/billing?canceled=true`,
      client_reference_id: org.id, // Important to identify which org to credit in the webhook
      customer_email: "billing@" + org.slug + ".com", // We use a dummy email based on slug
      metadata: {
        organizationId: org.id,
        type: "TOP_UP_STRIPE",
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Stripe Checkout Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
