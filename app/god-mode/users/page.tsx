import { prisma } from "@/lib/prisma";
import { UsersClient } from "./UsersClient";

export const metadata = {
  title: "Global Users | God Mode",
};

export default async function GlobalUsersPage() {
  const users = await prisma.user.findMany({
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

  const plans = await prisma.pricingPlan.findMany({
    where: { isActive: true },
    orderBy: { monthlyPrice: "asc" },
  });

  return <UsersClient initialUsers={users} plans={plans} />;
}
