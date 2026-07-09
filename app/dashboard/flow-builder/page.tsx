import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FlowListClient } from "./FlowListClient";

export const metadata = {
  title: 'Éditeur de Scénarios | Antigravity',
};

export default async function FlowBuilderPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');
  const orgId = session.user.organizationId;

  const flows = await prisma.whatsAppFlow.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Scénarios Visuels (Flow Builder)</h1>
        <p className="text-[var(--text-secondary)] mt-2">Dessinez des arbres de décision automatisés et branchez vos agents IA là où vous en avez besoin.</p>
      </div>

      <FlowListClient initialFlows={flows} />
    </div>
  );
}
