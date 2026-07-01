"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Get all orgs for compliance review
export async function getComplianceRecords() {
  try {
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        kycStatus: true,
        kycDocumentUrl: true,
        businessName: true,
        businessRegistrationNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" }
    });
    return { data: orgs };
  } catch (e: any) {
    return { error: e.message };
  }
}

// Approve KYC
export async function approveKYC(orgId: string) {
  try {
    await prisma.organization.update({
      where: { id: orgId },
      data: { kycStatus: "APPROVED" }
    });
    revalidatePath("/god-mode/compliance");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

// Reject KYC
export async function rejectKYC(orgId: string) {
  try {
    await prisma.organization.update({
      where: { id: orgId },
      data: { kycStatus: "REJECTED" }
    });
    revalidatePath("/god-mode/compliance");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}
