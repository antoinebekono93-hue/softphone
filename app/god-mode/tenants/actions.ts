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

  // Le solde ne doit JAMAIS être écrasé en dur : on calcule le delta et on
  // l'applique via un incrément + une WalletTransaction, pour que le grand
  // livre reste cohérent avec le solde (aucune dérive non auditée).
  const shouldAdjustBalance =
    typeof data.walletBalance === "number" && Number.isFinite(data.walletBalance);
  const current = shouldAdjustBalance
    ? await prisma.organization.findUnique({
        where: { id: tenantId },
        select: { walletBalance: true },
      })
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: tenantId },
      data: {
        pricingPlanId: data.pricingPlanId,
        planStatus: data.planStatus,
        tenantSettings: data.tenantSettings || {},
      },
    });

    if (!shouldAdjustBalance) return;

    const delta = data.walletBalance! - (current?.walletBalance.toNumber() ?? 0);
    if (delta === 0) return;

    await tx.organization.update({
      where: { id: tenantId },
      data: { walletBalance: { increment: delta } },
    });
    await tx.walletTransaction.create({
      data: {
        organizationId: tenantId,
        amount: delta,
        type: delta >= 0 ? "CREDIT" : "DEBIT",
        description: "Ajustement manuel du solde (God Mode)",
      },
    });
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
