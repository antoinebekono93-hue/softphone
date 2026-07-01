"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getCampaigns() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("No organization found");
  const user = session.user;

  return await prisma.campaign.findMany({
    where: { organizationId: user.organizationId },
    include: {
      phoneNumber: true,
      _count: {
        select: { recipients: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createCampaign(data: { name: string, body: string, phoneNumberId: string, contactIds: string[] }) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("No organization found");
  const user = session.user;

  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      body: data.body,
      status: "SENDING", // Automatically start it for this MVP
      organizationId: user.organizationId,
      phoneNumberId: data.phoneNumberId,
      recipients: {
        create: data.contactIds.map(id => ({
          contactId: id,
          status: "PENDING"
        }))
      }
    }
  });

  revalidatePath("/dashboard/campaigns");
  return campaign;
}

export async function getCampaignDetails(id: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("No organization found");
  const user = session.user;

  return await prisma.campaign.findUnique({
    where: { id, organizationId: user.organizationId },
    include: {
      phoneNumber: true,
      recipients: {
        include: {
          contact: true
        }
      }
    }
  });
}
