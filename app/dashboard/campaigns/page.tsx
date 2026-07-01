import { CampaignsClient } from "./CampaignsClient";
import { getCampaigns } from "./actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Campaigns | Antigravity",
};

export default async function CampaignsPage() {
  const user = await requireUser();
  const campaigns = await getCampaigns();
  
  const numbers = await prisma.phoneNumber.findMany({
    where: { organizationId: user.organizationId! }
  });
  
  const contacts = await prisma.contact.findMany({
    where: { organizationId: user.organizationId! }
  });

  return <CampaignsClient campaigns={campaigns} numbers={numbers} contacts={contacts} />;
}
