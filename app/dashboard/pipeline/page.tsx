import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PipelineClient from "./PipelineClient";

export const metadata = {
  title: "Pipeline de Ventes | CRM WhatsApp",
};

export default async function PipelinePage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const orgId = session.user.organizationId;

  // Fetch opportunities and related contacts
  const opps = await prisma.opportunity.findMany({
    where: { organizationId: orgId },
    include: {
      contact: true,
      assignedUser: true
    },
    orderBy: { createdAt: "desc" }
  });
  const opportunities = JSON.parse(JSON.stringify(opps));

  // Fetch contacts for the "New Opportunity" modal
  const dbContacts = await prisma.contact.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" }
  });
  const contacts = JSON.parse(JSON.stringify(dbContacts));

  return (
    <div className="p-8 max-w-full mx-auto w-full h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Pipeline de Ventes</h1>
          <p className="text-[var(--text-secondary)] mt-2">Suivez vos opportunités CRM WhatsApp et déplacez-les entre les étapes.</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <PipelineClient initialOpportunities={opportunities} contacts={contacts} />
      </div>
    </div>
  );
}
