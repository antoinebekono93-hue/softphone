import { prisma } from "@/lib/prisma";
import { UsersClient } from "./UsersClient";

export const metadata = {
  title: "Global Users | God Mode",
};

export default async function GlobalUsersPage() {
  const usersRaw = await prisma.user.findMany({
    include: {
      organization: {
        select: {
          name: true,
          slug: true,
          pricingPlanId: true,
          planStatus: true,
          pricingPlan: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const users = usersRaw.map((u) => ({
    ...u,
    organization: u.organization
      ? {
          ...u.organization,
          pricingPlan: u.organization.pricingPlan
            ? {
                ...u.organization.pricingPlan,
                monthlyPrice: u.organization.pricingPlan.monthlyPrice.toNumber(),
              }
            : null,
        }
      : u.organization,
  }));

  const plansRaw = await prisma.pricingPlan.findMany({
    where: { isActive: true },
    orderBy: { monthlyPrice: "asc" },
  });

  const plans = plansRaw.map((p) => ({
    ...p,
    monthlyPrice: p.monthlyPrice.toNumber(),
  }));

  return <UsersClient initialUsers={users} plans={plans} />;
}
