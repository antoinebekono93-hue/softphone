"use client";

import { useState } from "react";
import { Plus, Bot, Phone, MessageSquare, Briefcase, Settings2, Trash2, Brain } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import KnowledgeBaseModal from "./KnowledgeBaseModal";

export default function AITeamClient({ initialEmployees, phoneNumbers, whatsappAccounts }: any) {
  const router = useRouter();
  const [employees, setEmployees] = useState(initialEmployees);
  const [isCreating, setIsCreating] = useState(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    jobTitle: "Agent de Support Client",
    systemPrompt: "Tu es un agent de support chaleureux. Règle n°1: toujours saluer le client.",
    voiceId: "alloy",
    handlesWhatsApp: false,
    handlesVoice: false,
  });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/ai-employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Erreur lors de la création");
      
      const newEmployee = await res.json();
      setEmployees([newEmployee, ...employees]);
      setIsCreating(false);
      toast.success("Employé IA recruté !");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Membres de l'équipe ({employees.length})</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsKnowledgeModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-4 py-2 rounded-xl font-medium hover:bg-[var(--bg-base)] transition-colors"
          >
            <Brain className="w-5 h-5" />
            Base de Connaissances
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-[var(--accent-primary)] text-[var(--accent-foreground)] px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Recruter un Employé IA
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="glass-panel p-6 rounded-2xl border border-[var(--border-subtle)] space-y-4">
          <h3 className="font-bold text-lg text-[var(--text-primary)]">Nouveau Recrutement</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nom de l'employé</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)]"
                placeholder="Ex: Sophie"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Rôle / Poste</label>
              <input 
                type="text" 
                value={formData.jobTitle}
                onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Instructions (Cerveau)</label>
            <textarea 
              rows={4}
              value={formData.systemPrompt}
              onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)]"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <input 
                type="checkbox" 
                checked={formData.handlesWhatsApp}
                onChange={e => setFormData({...formData, handlesWhatsApp: e.target.checked})}
                className="rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-[var(--bg-base)] border-[var(--border-subtle)]"
              />
              Gérer WhatsApp
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <input 
                type="checkbox" 
                checked={formData.handlesVoice}
                onChange={e => setFormData({...formData, handlesVoice: e.target.checked})}
                className="rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-[var(--bg-base)] border-[var(--border-subtle)]"
              />
              Gérer les Appels Vocaux
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleCreate} className="bg-[var(--accent-primary)] text-[var(--accent-foreground)] px-4 py-2 rounded-xl font-medium">Confirmer le recrutement</button>
            <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Annuler</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {employees.map((emp: any) => (
          <div key={emp.id} className="glass-panel p-6 rounded-2xl border border-[var(--border-subtle)] relative group">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">{emp.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {emp.jobTitle}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Canaux assignés :</span>
                <div className="flex gap-2 text-[var(--text-primary)]">
                  {emp.handlesWhatsApp && <MessageSquare className="w-4 h-4 text-green-500" />}
                  {emp.handlesVoice && <Phone className="w-4 h-4 text-blue-500" />}
                  {!emp.handlesWhatsApp && !emp.handlesVoice && <span className="text-xs text-[var(--text-secondary)]">Aucun</span>}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Statut :</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {emp.isActive ? 'En poste' : 'Inactif'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex justify-between">
              <button className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                <Settings2 className="w-4 h-4" />
                Configurer
              </button>
              <button className="text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {employees.length === 0 && !isCreating && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--border-subtle)] rounded-3xl">
            <Bot className="w-12 h-12 text-[var(--text-secondary)]/50 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Aucun employé IA</h3>
            <p className="text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
              Commencez à déléguer votre support client en recrutant votre premier employé IA.
            </p>
          </div>
        )}
      </div>

      {isKnowledgeModalOpen && (
        <KnowledgeBaseModal onClose={() => setIsKnowledgeModalOpen(false)} />
      )}
    </div>
  );
}
