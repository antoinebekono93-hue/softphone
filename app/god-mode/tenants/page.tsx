import { prisma } from "@/lib/prisma";
import { TenantsClient } from "./TenantsClient";

export const metadata = {
  title: "Tenants | God Mode",
};

export default async function TenantsPage() {
  const tenants = await prisma.organization.findMany({
    include: {
      _count: {
        select: { users: true, phoneNumbers: true },
      },
      pricingPlan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const plans = await prisma.pricingPlan.findMany({
    where: { isActive: true },
  });

  return <TenantsClient initialTenants={tenants} plans={plans} />;
}
