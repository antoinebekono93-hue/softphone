import { prisma } from "@/lib/prisma";
import { TenantsClient } from "./TenantsClient";

export const metadata = {
  title: "Tenants | God Mode",
};

export default async function TenantsPage() {
  const tenantsRaw = await prisma.organization.findMany({
    include: {
      _count: {
        select: { users: true, phoneNumbers: true },
      },
      pricingPlan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const tenants = tenantsRaw.map((t) => ({
    ...t,
    walletBalance: t.walletBalance.toNumber(),
    pricingPlan: t.pricingPlan
      ? { ...t.pricingPlan, monthlyPrice: t.pricingPlan.monthlyPrice.toNumber() }
      : null,
  }));

  const plansRaw = await prisma.pricingPlan.findMany({
    where: { isActive: true },
  });

  const plans = plansRaw.map((p) => ({
    ...p,
    monthlyPrice: p.monthlyPrice.toNumber(),
  }));

  return <TenantsClient initialTenants={tenants} plans={plans} />;
}
