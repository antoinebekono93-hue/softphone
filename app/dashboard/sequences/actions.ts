"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// --- SEQUENCES ---

export async function getSequences() {
  const session = await auth();
  if (!session?.user?.organizationId) return [];

  return await prisma.sequence.findMany({
    where: { organizationId: session.user.organizationId },
    include: { 
      steps: { orderBy: { stepOrder: 'asc' } },
      _count: { select: { enrollments: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getSequence(id: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return null;

  return await prisma.sequence.findUnique({
    where: { id, organizationId: session.user.organizationId },
    include: { 
      steps: { orderBy: { stepOrder: 'asc' } },
      enrollments: { include: { contact: true } }
    }
  });
}

export async function createSequence(data: { name: string, description?: string }) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const sequence = await prisma.sequence.create({
      data: {
        ...data,
        organizationId: session.user.organizationId
      }
    });
    revalidatePath("/dashboard/sequences");
    return { success: true, sequence };
  } catch (error) {
    console.error("Create Sequence Error:", error);
    return { error: "Failed to create sequence" };
  }
}

export async function updateSequence(id: string, data: { name?: string, description?: string, isActive?: boolean }) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const sequence = await prisma.sequence.update({
      where: { id, organizationId: session.user.organizationId },
      data
    });
    revalidatePath("/dashboard/sequences");
    revalidatePath(`/dashboard/sequences/${id}`);
    return { success: true, sequence };
  } catch (error) {
    return { error: "Failed to update sequence" };
  }
}

export async function deleteSequence(id: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    await prisma.sequence.delete({
      where: { id, organizationId: session.user.organizationId }
    });
    revalidatePath("/dashboard/sequences");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete sequence" };
  }
}

// --- STEPS ---

export async function createSequenceStep(data: { sequenceId: string, delayHours: number, actionType: string, content?: string, templateId?: string }) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    // Verify sequence ownership
    const sequence = await prisma.sequence.findUnique({
      where: { id: data.sequenceId, organizationId: session.user.organizationId },
      include: { steps: true }
    });

    if (!sequence) return { error: "Sequence not found" };

    const stepOrder = sequence.steps.length + 1;

    const step = await prisma.sequenceStep.create({
      data: {
        ...data,
        stepOrder
      }
    });
    revalidatePath(`/dashboard/sequences/${data.sequenceId}`);
    return { success: true, step };
  } catch (error) {
    console.error("Create Step Error:", error);
    return { error: "Failed to create step" };
  }
}

export async function deleteSequenceStep(id: string, sequenceId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const sequence = await prisma.sequence.findUnique({
      where: { id: sequenceId, organizationId: session.user.organizationId }
    });
    if (!sequence) return { error: "Unauthorized" };

    await prisma.sequenceStep.delete({
      where: { id }
    });

    // Reorder remaining steps
    const remainingSteps = await prisma.sequenceStep.findMany({
      where: { sequenceId },
      orderBy: { stepOrder: 'asc' }
    });

    for (let i = 0; i < remainingSteps.length; i++) {
      await prisma.sequenceStep.update({
        where: { id: remainingSteps[i].id },
        data: { stepOrder: i + 1 }
      });
    }

    revalidatePath(`/dashboard/sequences/${sequenceId}`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete step" };
  }
}

// --- ENROLLMENTS ---

export async function enrollContact(sequenceId: string, contactId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const sequence = await prisma.sequence.findUnique({
      where: { id: sequenceId, organizationId: session.user.organizationId }
    });

    const contact = await prisma.contact.findUnique({
      where: { id: contactId, organizationId: session.user.organizationId }
    });

    if (!sequence || !contact) return { error: "Not found" };

    const enrollment = await prisma.sequenceEnrollment.upsert({
      where: {
        sequenceId_contactId: {
          sequenceId,
          contactId
        }
      },
      update: {
        status: 'ACTIVE',
        currentStep: 1,
        nextRunAt: new Date()
      },
      create: {
        sequenceId,
        contactId,
        status: 'ACTIVE',
        currentStep: 1,
        nextRunAt: new Date()
      }
    });

    revalidatePath(`/dashboard/contacts/${contactId}`);
    revalidatePath(`/dashboard/sequences/${sequenceId}`);
    return { success: true, enrollment };
  } catch (error) {
    return { error: "Failed to enroll contact" };
  }
}
