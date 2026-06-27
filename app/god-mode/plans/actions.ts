"use server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

export async function createOrUpdatePlan(data: {
  id?: string;
  name: string;
  monthlyPrice: number;
  includedMinutes: number;
  includedSms: number;
  features: string[];
}) {
  const { id, name, monthlyPrice, includedMinutes, includedSms, features } = data;

  let plan;
  if (id) {
    // Update existing
    plan = await prisma.pricingPlan.update({
      where: { id },
      data: {
        name,
        monthlyPrice,
        includedMinutes,
        includedSms,
      },
    });
    // Update features (delete all and recreate for simplicity)
    await prisma.planFeature.deleteMany({ where: { pricingPlanId: id } });
    await prisma.planFeature.createMany({
      data: features.map(f => ({ name: f, pricingPlanId: id })),
    });
  } else {
    // Create new
    plan = await prisma.pricingPlan.create({
      data: {
        name,
        monthlyPrice,
        includedMinutes,
        includedSms,
        features: {
          create: features.map(f => ({ name: f })),
        }
      },
    });
  }

  revalidatePath("/god-mode/plans");
  return { success: true, plan };
}

export async function syncPlanToStripe(planId: string) {
  const plan = await prisma.pricingPlan.findUnique({
    where: { id: planId }
  });

  if (!plan) throw new Error("Plan not found");

  let productId: string;
  let stripePriceId = plan.stripePriceId;

  if (!stripePriceId) {
    // Create product
    const product = await stripe.products.create({
      name: `Antigravity ${plan.name}`,
      description: `Includes ${plan.includedMinutes} min and ${plan.includedSms} SMS`,
    });
    productId = product.id;

    // Create price
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(plan.monthlyPrice * 100), // in cents
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    stripePriceId = price.id;

    // Save to DB
    await prisma.pricingPlan.update({
      where: { id: planId },
      data: { stripePriceId },
    });
  } else {
    // Note: Stripe doesn't allow changing the price amount on an existing price ID.
    // We would create a new price and update the DB in a full implementation.
    // For this prototype, we just skip.
  }

  revalidatePath("/god-mode/plans");
  return { success: true, stripePriceId };
}

export async function syncPlanToFlutterwave(planId: string) {
  const { flutterwave } = await import("@/lib/flutterwave");
  const plan = await prisma.pricingPlan.findUnique({
    where: { id: planId }
  });

  if (!plan) throw new Error("Plan not found");

  let flutterwavePlanId = plan.flutterwavePlanId;

  if (!flutterwavePlanId) {
    // Create plan on Flutterwave
    const fwPlan = await flutterwave.paymentPlans.create({
      amount: plan.monthlyPrice,
      name: `Antigravity ${plan.name}`,
      interval: 'monthly',
      currency: 'USD',
    });
    
    flutterwavePlanId = fwPlan.id.toString();

    // Save to DB
    await prisma.pricingPlan.update({
      where: { id: planId },
      data: { flutterwavePlanId },
    });
  }

  revalidatePath("/god-mode/plans");
  return { success: true, flutterwavePlanId };
}
