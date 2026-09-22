import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import PipelineClient from "./PipelineClient";

export const metadata = {
  title: "Pipeline de Ventes | CRM WhatsApp",
};

export default async function PipelinePage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const orgId = session.user.organizationId;

  let opportunities: any[] = [];
  let contacts: any[] = [];
  let loadError: string | null = null;

  try {
    // Fetch opportunities and related contacts
    const opps = await prisma.opportunity.findMany({
      where: { organizationId: orgId },
      include: {
        contact: true,
        assignedUser: true
      },
      orderBy: { createdAt: "desc" }
    });
    opportunities = JSON.parse(JSON.stringify(opps));

    // Fetch contacts for the "New Opportunity" modal
    const dbContacts = await prisma.contact.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" }
    });
    contacts = JSON.parse(JSON.stringify(dbContacts));
  } catch (error) {
    console.error("[PIPELINE_LOAD]", error);
    loadError = "Impossible de charger le pipeline pour le moment.";
  }

  if (loadError) {
    return (
      <div className="p-8 max-w-full mx-auto w-full">
        <PageHeader title="Pipeline de Ventes" description="Suivez vos opportunités CRM WhatsApp et déplacez-les entre les étapes." />
        <Card className="p-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Impossible de charger le pipeline</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{loadError} Veuillez réessayer dans quelques instants.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-full mx-auto w-full h-full min-h-0 flex flex-col">
      <PageHeader title="Pipeline de Ventes" description="Suivez vos opportunités CRM WhatsApp et déplacez-les entre les étapes." />

      <div className="flex-1 min-h-0 overflow-hidden">
        <PipelineClient initialOpportunities={opportunities} contacts={contacts} />
      </div>
    </div>
  );
}
