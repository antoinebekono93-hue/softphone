"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getOrganizationNumbers() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");
  const user = session.user;

  const numbers = await prisma.phoneNumber.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" }
  });

  // Mocking the status based on ID for demonstration
  // In a real app, this would be a boolean on the PhoneNumber model or a relation to WhatsAppAccount
  return numbers.map((n) => ({
    id: n.id,
    number: n.number,
    name: n.name,
    whatsappEnabled: n.number.endsWith('1'), // Mock: numbers ending in 1 have WhatsApp
    rcsEnabled: n.number.endsWith('2'),      // Mock: numbers ending in 2 have RCS
  }));
}
