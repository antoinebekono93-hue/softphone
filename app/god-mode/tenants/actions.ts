"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function updateTenant(tenantId: string, data: {
  pricingPlanId?: string | null;
  walletBalance?: number;
  planStatus?: string;
}) {
  await prisma.organization.update({
    where: { id: tenantId },
    data: {
      pricingPlanId: data.pricingPlanId,
      walletBalance: data.walletBalance,
      planStatus: data.planStatus,
    }
  });
  revalidatePath("/god-mode/tenants");
}

export async function impersonateTenant(organizationId: string) {
  const session = await auth();
  // For safety in production, check session?.user?.isSuperAdmin
  // if (!session?.user?.isSuperAdmin) throw new Error("Unauthorized");
  
  if (session?.user?.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { organizationId }
    });
  }
  
  // Redirect to their dashboard
  redirect("/dashboard");
}
