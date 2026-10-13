"use server";

"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/auth";
import { provisionOrganizationWithAdmin } from "@/lib/organization-provisioning";

export async function registerUser(data: any) {
  try {
    const { orgName, email, password } = data;

    if (!orgName || !email || !password) {
      return { error: "All fields are required" };
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "Email already registered" };
    }

    const passwordHash = await hashPassword(password);

    await provisionOrganizationWithAdmin({
      orgName,
      email,
      passwordHash,
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Register Error]", error);
    return { error: error?.message || "An unexpected error occurred" };
  }
}
