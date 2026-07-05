import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import FlowBuilderClient from "./FlowBuilderClient";

export const metadata = {
  title: "Flow Builder | Antigravity",
};

export default async function WhatsAppFlowsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const flows = await prisma.whatsAppFlow.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[var(--bg-base)] p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Séquences WhatsApp</h1>
        <p className="text-[var(--text-secondary)] mt-2">Créez des parcours automatisés interactifs.</p>
      </div>
      <FlowBuilderClient initialFlows={flows} />
    </div>
  );
}
