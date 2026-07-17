import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CampaignsClient from "./CampaignsClient";

export const metadata = {
  title: "Campagnes Sociales | Antigravity",
};

export default async function SocialCampaignsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  // 1. Fetch contact groups
  const groups = await prisma.contactGroup.findMany({
    where: { organizationId: orgId },
    include: {
      _count: {
        select: { contacts: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // 2. Fetch APPROVED WhatsApp templates
  const templates = await prisma.whatsAppTemplate.findMany({
    where: { 
      organizationId: orgId,
      status: 'APPROVED'
    },
    orderBy: { createdAt: 'desc' }
  });

  // 3. Fetch connected Facebook Pages
  const facebookAccounts = await prisma.socialAccount.findMany({
    where: {
      organizationId: orgId,
      provider: 'FACEBOOK',
      status: 'ACTIVE'
    }
  });

  // 4. Fetch past social campaigns (WhatsApp + Messenger)
  const campaigns = await prisma.campaign.findMany({
    where: { 
      organizationId: orgId,
      channel: { in: ['WHATSAPP', 'MESSENGER'] }
    },
    include: {
      template: true,
      socialAccount: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <CampaignsClient 
        groups={groups} 
        templates={templates} 
        facebookAccounts={facebookAccounts}
        initialCampaigns={campaigns} 
      />
    </div>
  );
}
