"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, GitMerge, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";

export function FlowListClient({ initialFlows }: { initialFlows: any[] }) {
  const [flows, setFlows] = useState(initialFlows);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateFlow = async () => {
    const name = prompt("Nom du nouveau scénario :");
    if (!name) return;

    setIsCreating(true);
    const toastId = toast.loading("Création en cours...");
    try {
      const res = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error("Failed");
      const newFlow = await res.json();
      setFlows([newFlow, ...flows]);
      toast.success("Scénario créé !", { id: toastId });
      router.push(`/dashboard/flow-builder/${newFlow.id}`);
    } catch (err) {
      toast.error("Erreur de création", { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button 
          onClick={handleCreateFlow} 
          disabled={isCreating}
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Nouveau Scénario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flows.map(flow => (
          <div key={flow.id} onClick={() => router.push(`/dashboard/flow-builder/${flow.id}`)} className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] hover:border-emerald-500/50 cursor-pointer transition-all hover:shadow-lg group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-hover)] flex items-center justify-center border border-[var(--border-subtle)] text-[var(--text-primary)] group-hover:text-emerald-500 transition-colors">
                <GitMerge className="w-6 h-6" />
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold ${flow.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                {flow.isActive ? 'ACTIF' : 'INACTIF'}
              </div>
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{flow.name}</h3>
            <p className="text-sm text-[var(--text-secondary)]">Dernière modif : {new Date(flow.updatedAt).toLocaleDateString()}</p>
          </div>
        ))}
        {flows.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--border-subtle)] rounded-3xl">
            <GitMerge className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--text-primary)] font-medium mb-1">Aucun scénario</p>
            <p className="text-[var(--text-secondary)] text-sm mb-4">Créez votre premier arbre de décision visuel.</p>
            <button onClick={handleCreateFlow} className="text-emerald-500 font-bold hover:underline">Créer un Scénario</button>
          </div>
        )}
      </div>
    </div>
  );
}
