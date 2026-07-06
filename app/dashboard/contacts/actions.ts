"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getContacts(groupId?: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return [];

  const whereClause: any = { organizationId: session.user.organizationId };
  if (groupId) {
    whereClause.groups = { some: { id: groupId } };
  }

  const contacts = await prisma.contact.findMany({
    where: whereClause,
    include: { groups: true },
    orderBy: { name: 'asc' }
  });

  return contacts;
}

export async function getContactGroups() {
  const session = await auth();
  if (!session?.user?.organizationId) return [];
  
  return await prisma.contactGroup.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: 'asc' }
  });
}

export async function createContactGroup(data: { name: string, description?: string }) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const group = await prisma.contactGroup.create({
      data: {
        ...data,
        organizationId: session.user.organizationId
      }
    });
    revalidatePath("/dashboard/contacts");
    return { success: true, group };
  } catch (error) {
    console.error("Create Group Error:", error);
    return { error: "Failed to create group." };
  }
}

export async function deleteContactGroup(id: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    await prisma.contactGroup.delete({
      where: { id, organizationId: session.user.organizationId }
    });
    revalidatePath("/dashboard/contacts");
    return { success: true };
  } catch (error) {
    console.error("Delete Group Error:", error);
    return { error: "Failed to delete group." };
  }
}

export async function createContact(data: { name?: string, company?: string, email?: string, phone: string, notes?: string, totalSpent?: number, purchaseCount?: number, isVip?: boolean }, groupId?: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    if (!data.phone) return { error: "Phone number is required" };

    const createData: any = {
      ...data,
      organizationId: session.user.organizationId
    };
    
    if (groupId) {
      createData.groups = { connect: [{ id: groupId }] };
    }

    // Phase 3: Auto-assignation VIP
    if (data.isVip || (data.totalSpent && data.totalSpent >= 1000)) {
      // Find or create VIP group
      let vipGroup = await prisma.contactGroup.findFirst({
        where: { name: "VIP", organizationId: session.user.organizationId }
      });
      if (!vipGroup) {
        vipGroup = await prisma.contactGroup.create({
          data: { name: "VIP", organizationId: session.user.organizationId }
        });
      }
      if (!createData.groups) {
        createData.groups = { connect: [] };
      }
      createData.groups.connect.push({ id: vipGroup.id });
    }

    const contact = await prisma.contact.create({
      data: createData,
      include: { groups: true }
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

export async function updateContact(id: string, data: { name?: string, company?: string, email?: string, phone: string, notes?: string, totalSpent?: number, purchaseCount?: number, isVip?: boolean }, groupId?: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const updateData: any = { ...data };
    if (groupId) {
      updateData.groups = { connect: [{ id: groupId }] };
    }

    // Phase 3: Auto-assignation VIP
    if (data.isVip || (data.totalSpent && data.totalSpent >= 1000)) {
      let vipGroup = await prisma.contactGroup.findFirst({
        where: { name: "VIP", organizationId: session.user.organizationId }
      });
      if (!vipGroup) {
        vipGroup = await prisma.contactGroup.create({
          data: { name: "VIP", organizationId: session.user.organizationId }
        });
      }
      if (!updateData.groups) {
        updateData.groups = { connect: [] };
      }
      updateData.groups.connect.push({ id: vipGroup.id });
    }

    const contact = await prisma.contact.update({
      where: { 
        id, 
        organizationId: session.user.organizationId 
      },
      data: updateData,
      include: { groups: true }
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

export async function importContacts(contactsData: any[], groupId?: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    let importedCount = 0;
    
    for (const contact of contactsData) {
      if (!contact.phone) continue;
      
      const updateData: any = {
        name: contact.name || undefined,
        company: contact.company || undefined,
        email: contact.email || undefined,
        notes: contact.notes || undefined,
      };
      
      if (groupId) {
        updateData.groups = { connect: [{ id: groupId }] };
      }

      const createData: any = {
        organizationId: session.user.organizationId,
        phone: String(contact.phone),
        name: contact.name || null,
        company: contact.company || null,
        email: contact.email || null,
        notes: contact.notes || null,
      };

      if (groupId) {
        createData.groups = { connect: [{ id: groupId }] };
      }

      await prisma.contact.upsert({
        where: {
          organizationId_phone: {
            organizationId: session.user.organizationId,
            phone: String(contact.phone)
          }
        },
        update: updateData,
        create: createData
      });
      
      importedCount++;
    }

    revalidatePath("/dashboard/contacts");
    return { success: true, importedCount };
  } catch (error) {
    console.error("Import Contacts Error:", error);
    return { error: "An error occurred during import." };
  }
}
