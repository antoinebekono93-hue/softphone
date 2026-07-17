import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Workflow, Zap, MoreVertical, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function AutomationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { organization: true },
  });

  if (!user?.organization) redirect("/dashboard");

  const workflows = await prisma.automationWorkflow.findMany({
    where: { organizationId: user.organization.id },
    orderBy: { createdAt: "desc" },
  });

  async function createWorkflow() {
    "use server";
    const { userId } = await auth();
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
      include: { organization: true },
    });
    
    if (user?.organization) {
      const nw = await prisma.automationWorkflow.create({
        data: {
          name: "Nouveau Workflow",
          organizationId: user.organization.id,
          triggerType: "MANUAL",
          nodes: JSON.stringify([{
            id: "trigger-1",
            type: "triggerNode",
            position: { x: 250, y: 100 },
            data: { label: "Déclencheur (Webhook / Manuel)" }
          }])
        }
      });
      redirect(`/dashboard/automations/${nw.id}`);
    }
  }

  async function deleteWorkflow(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await prisma.automationWorkflow.delete({ where: { id } });
    revalidatePath("/dashboard/automations");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-2">Workflows Visuels</h1>
          <p className="text-gray-500">Créez des automatisations type Zapier/n8n connectées à vos données.</p>
        </div>
        
        <form action={createWorkflow}>
          <button type="submit" className="btn-primary-gradient px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-cyan-500/20 transition-all">
            <Plus className="w-4 h-4" /> Nouveau Workflow
          </button>
        </form>
      </div>

      {workflows.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-dashed border-[var(--border-subtle)]">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <Workflow className="w-8 h-8 text-cyan-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Aucun workflow</h3>
          <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">Connectez votre plateforme à n8n, Zapier ou créez des logiques internes avec le constructeur visuel.</p>
          <form action={createWorkflow}>
            <button type="submit" className="bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] px-6 py-3 rounded-xl text-sm font-medium hover:bg-[var(--bg-surface-solid)] transition-colors">
              Créer mon premier flux
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map(wf => (
            <div key={wf.id} className="glass-panel rounded-2xl p-6 hover:shadow-xl transition-all border border-[var(--border-subtle)] group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${wf.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex gap-2">
                  <form action={deleteWorkflow}>
                    <input type="hidden" name="id" value={wf.id} />
                    <button className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
              
              <Link href={`/dashboard/automations/${wf.id}`} className="block">
                <h3 className="text-lg font-bold mb-1 hover:text-cyan-500 transition-colors">{wf.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">{wf.isActive ? 'Actif' : 'Inactif'} • {JSON.parse(wf.nodes as string).length} nœuds</p>
                
                <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>Modifié le {wf.updatedAt.toLocaleDateString()}</span>
                  <span className="bg-[var(--bg-surface-hover)] px-2 py-1 rounded">Éditer &rarr;</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
