import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AutomationsClient } from "./AutomationsClient";

export const metadata = {
  title: "Automations | Antigravity",
};

export default async function AutomationsPage() {
  const session = await auth();
  
  let aiRule = null;
  let campaigns: any[] = [];

  if (session?.user?.organizationId) {
    aiRule = await prisma.automationRule.findFirst({
      where: {
        organizationId: session.user.organizationId,
        triggerType: 'NO_ANSWER_AI'
      }
    });

    campaigns = await prisma.campaign.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true }
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Automations</h1>
          <p className="text-[var(--text-secondary)]">Créez des ponts et des flux de travail pour automatiser votre communication.</p>
        </div>
        <button className="btn-primary-gradient px-5 py-2">
          Créer une Règle
        </button>
      </div>

      <AutomationsClient aiRule={aiRule} campaigns={campaigns} />

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Autres Automatisations (À venir)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
          {/* Dummy visual for upcoming features */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Création Lead CRM sur Appel</h3>
              <div className="w-11 h-6 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] flex items-center px-1 cursor-not-allowed">
                <div className="w-4 h-4 rounded-full bg-[var(--text-secondary)] shadow-sm" />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Créer automatiquement un contact si un nouveau numéro vous appelle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
