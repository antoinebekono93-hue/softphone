import { CampaignsClient } from "./CampaignsClient";
import { getCampaigns } from "./actions";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Campaigns | Antigravity",
};

export default async function CampaignsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }
  const user = session.user;
  const campaigns = await getCampaigns();
  
  const numbers = await prisma.phoneNumber.findMany({
    where: { organizationId: user.organizationId! }
  });
  
  const contacts = await prisma.contact.findMany({
    where: { organizationId: user.organizationId! }
  });

  return <CampaignsClient campaigns={campaigns} numbers={numbers} contacts={contacts} />;
}
