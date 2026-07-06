import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RevenueDashboardClient } from "./RevenueDashboardClient";

export default async function RevenueAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const orgId = session.user.organizationId;

  // 1. Fetch KPIs
  const contacts = await prisma.contact.findMany({
    where: { organizationId: orgId }
  });

  const totalSpent = contacts.reduce((acc, c) => acc + c.totalSpent, 0);
  const totalLTV = contacts.reduce((acc, c) => acc + c.lifetimeValue, 0);

  // 2. Fetch High Risk Churn Contacts (VIPs first, then sorted by risk)
  const highRiskContacts = await prisma.contact.findMany({
    where: {
      organizationId: orgId,
      churnRiskScore: { gte: 30 }
    },
    orderBy: [
      { isVip: 'desc' },
      { churnRiskScore: 'desc' }
    ],
    take: 20
  });

  // 3. Fetch Abandoned Carts stats
  const carts = await prisma.cart.findMany({
    where: { organizationId: orgId }
  });

  const abandonedValue = carts.filter(c => c.status === "ABANDONED").reduce((acc, c) => acc + c.totalPrice, 0);
  const recoveredValue = carts.filter(c => c.status === "RECOVERED").reduce((acc, c) => acc + c.totalPrice, 0);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Prédictifs</h2>
      </div>
      <RevenueDashboardClient 
        totalSpent={totalSpent}
        totalLTV={totalLTV}
        highRiskContacts={highRiskContacts}
        abandonedValue={abandonedValue}
        recoveredValue={recoveredValue}
      />
    </div>
  );
}
