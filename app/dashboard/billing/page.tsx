import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BillingClient from "./BillingClient";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: {
      walletBalance: true,
      name: true,
      pricingPlan: { select: { name: true, monthlyPrice: true } }
    }
  });

  if (!org) redirect("/login");

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing & Usage</h1>
        <p className="text-[var(--text-secondary)] mt-2">Manage your subscription and wallet balance for communications.</p>
      </div>

      <BillingClient 
        initialBalance={org.walletBalance} 
        planName={org.pricingPlan?.name || "No Plan"}
        planPrice={org.pricingPlan?.monthlyPrice || 0}
      />
    </div>
  );
}
