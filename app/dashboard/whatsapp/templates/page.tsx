import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TemplatesClient from "./TemplatesClient";

export const metadata = {
  title: "WhatsApp Templates | Antigravity",
};

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const templates = await prisma.whatsAppTemplate.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' }
  });

  const whatsappAccount = await prisma.whatsAppAccount.findUnique({
    where: { organizationId: orgId }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <TemplatesClient 
        initialTemplates={templates} 
        hasAccount={!!whatsappAccount?.phoneNumberId} 
      />
    </div>
  );
}
