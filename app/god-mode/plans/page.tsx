import { prisma } from "@/lib/prisma";
import { PlansClient } from "./PlansClient";

export const metadata = {
  title: "Dynamic Plans | God Mode",
};

export default async function GodModePlansPage() {
  const plansRaw = await prisma.pricingPlan.findMany({ 
    include: { features: true },
    orderBy: { monthlyPrice: 'asc' }
  });

  const plans = plansRaw.map((p) => ({
    ...p,
    monthlyPrice: p.monthlyPrice.toNumber(),
  }));

  return <PlansClient initialPlans={plans} />;
}
