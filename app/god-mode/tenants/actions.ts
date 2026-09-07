"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/security";

export async function updateTenant(tenantId: string, data: {
  pricingPlanId?: string | null;
  walletBalance?: number;
  planStatus?: string;
  tenantSettings?: any;
}) {
  await requireSuperAdmin();
  await prisma.organization.update({
    where: { id: tenantId },
    data: {
      pricingPlanId: data.pricingPlanId,
      walletBalance: data.walletBalance,
      planStatus: data.planStatus,
      tenantSettings: data.tenantSettings || {},
    }
  });
  revalidatePath("/god-mode/tenants");
}

export async function impersonateTenant(organizationId: string) {
  await requireSuperAdmin();
  const session = await auth();

  if (session?.user?.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { organizationId }
    });
  }
  
  // Redirect to their dashboard
  redirect("/dashboard");
}
