"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTenantsWallets() {
  try {
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        walletBalance: true,
      },
      orderBy: { name: "asc" }
    });
    return { data: orgs };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getGlobalTransactions() {
  try {
    const tx = await prisma.walletTransaction.findMany({
      include: {
        organization: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return { data: tx };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adjustTenantBalance(orgId: string, amount: number, description: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id: orgId },
        data: {
          walletBalance: { increment: amount }
        }
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          organizationId: orgId,
          amount: amount,
          type: amount >= 0 ? "CREDIT" : "DEBIT",
          description: description
        }
      });

      return { org, transaction };
    });

    revalidatePath("/god-mode/billing");
    return { success: true, balance: result.org.walletBalance };
  } catch (e: any) {
    return { error: e.message };
  }
}
