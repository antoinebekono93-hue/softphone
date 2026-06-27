"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getContacts() {
  const session = await auth();
  if (!session?.user?.organizationId) return [];

  const contacts = await prisma.contact.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: 'asc' }
  });

  return contacts;
}

export async function createContact(data: { name?: string, company?: string, email?: string, phone: string, notes?: string }) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    // Basic validation
    if (!data.phone) return { error: "Phone number is required" };

    const contact = await prisma.contact.create({
      data: {
        ...data,
        organizationId: session.user.organizationId
      }
    });

    revalidatePath("/dashboard/contacts");
    return { success: true, contact };
  } catch (error: any) {
    console.error("Create Contact Error:", error);
    if (error.code === 'P2002') {
      return { error: "A contact with this phone number already exists." };
    }
    return { error: "Failed to create contact." };
  }
}

export async function updateContact(id: string, data: { name?: string, company?: string, email?: string, phone: string, notes?: string }) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const contact = await prisma.contact.update({
      where: { 
        id, 
        organizationId: session.user.organizationId 
      },
      data
    });

    revalidatePath("/dashboard/contacts");
    return { success: true, contact };
  } catch (error: any) {
    console.error("Update Contact Error:", error);
    if (error.code === 'P2002') {
      return { error: "A contact with this phone number already exists." };
    }
    return { error: "Failed to update contact." };
  }
}

export async function deleteContact(id: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    await prisma.contact.delete({
      where: { 
        id, 
        organizationId: session.user.organizationId 
      }
    });

    revalidatePath("/dashboard/contacts");
    return { success: true };
  } catch (error) {
    console.error("Delete Contact Error:", error);
    return { error: "Failed to delete contact." };
  }
}
