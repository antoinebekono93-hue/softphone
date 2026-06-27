"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

    // Create URL-friendly slug
    const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create Org and User
    const newOrg = await prisma.organization.create({
      data: {
        name: orgName,
        slug,
        planStatus: "TRIALING",
        users: {
          create: {
            email,
            passwordHash,
            role: "ADMIN",
          }
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Register Error]", error);
    return { error: "An unexpected error occurred" };
  }
}
