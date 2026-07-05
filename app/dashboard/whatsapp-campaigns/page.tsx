import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CampaignsClient from "./CampaignsClient";

export const metadata = {
  title: "Campagnes WhatsApp | Antigravity",
};

export default async function WhatsAppCampaignsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  // 1. Fetch contacts
  const contacts = await prisma.contact.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' }
  });

  // 2. Fetch APPROVED templates only
  const templates = await prisma.whatsAppTemplate.findMany({
    where: { 
      organizationId: orgId,
      status: 'APPROVED'
    },
    orderBy: { createdAt: 'desc' }
  });

  // 3. Fetch past campaigns
  const campaigns = await prisma.campaign.findMany({
    where: { 
      organizationId: orgId,
      templateId: { not: null } // We assume WhatsApp campaigns have a templateId
    },
    include: {
      template: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <CampaignsClient 
        contacts={contacts} 
        templates={templates} 
        initialCampaigns={campaigns} 
      />
    </div>
  );
}
