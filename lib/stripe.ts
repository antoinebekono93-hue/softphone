import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("WARNING: STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
  // @ts-ignore
  apiVersion: "2024-06-20",
  typescript: true,
});

/**
 * Stripe price IDs mapped to plan names.
 */
export const STRIPE_PRICES = {
  STARTER: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY!,
  },
  PRO: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
  },
  ENTERPRISE: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY!,
  },
} as const;

/**
 * Maps a Stripe price ID back to its plan type.
 */
export function getPlanFromPriceId(
  priceId: string
): "STARTER" | "PRO" | "ENTERPRISE" | null {
  for (const [plan, prices] of Object.entries(STRIPE_PRICES)) {
    if (prices.monthly === priceId || prices.yearly === priceId) {
      return plan as "STARTER" | "PRO" | "ENTERPRISE";
    }
  }
  return null;
}
