"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/security";

const PLAN_STATUSES = ["ACTIVE", "TRIALING", "PAST_DUE", "UNPAID", "CANCELED"];

export async function assignPlanToUser(
  userId: string,
  pricingPlanId: string | null,
  planStatus: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireSuperAdmin();

    if (!PLAN_STATUSES.includes(planStatus)) {
      return { ok: false, error: "Statut de forfait invalide." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, organizationId: true },
    });
    if (!user) return { ok: false, error: "Utilisateur introuvable." };
    if (!user.organizationId) {
      return {
        ok: false,
        error: "Cet utilisateur n'a pas d'organisation : le forfait est rattaché à l'organisation.",
      };
    }

    if (pricingPlanId) {
      const plan = await prisma.pricingPlan.findUnique({ where: { id: pricingPlanId } });
      if (!plan) return { ok: false, error: "Forfait introuvable." };
    }

    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { pricingPlanId, planStatus },
    });

    revalidatePath("/god-mode/users");
    revalidatePath("/god-mode/tenants");
    revalidatePath("/dashboard/billing");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Erreur lors de l'attribution du forfait." };
  }
}
