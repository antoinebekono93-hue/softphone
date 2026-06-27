import { prisma } from "@/lib/prisma";
import { PlansClient } from "./PlansClient";

export const metadata = {
  title: "Dynamic Plans | God Mode",
};

export default async function GodModePlansPage() {
  const plans = await prisma.pricingPlan.findMany({ 
    include: { features: true },
    orderBy: { monthlyPrice: 'asc' }
  });

  return <PlansClient initialPlans={plans} />;
}
