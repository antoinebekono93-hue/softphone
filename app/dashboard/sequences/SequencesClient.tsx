"use client";

import { useState } from "react";
import { Plus, Search, CalendarClock, Settings, Trash2, Loader2, Play, Pause } from "lucide-react";
import Link from "next/link";
import { createSequence, updateSequence, deleteSequence } from "./actions";

export function SequencesClient({ initialSequences }: { initialSequences: any[] }) {
  const [sequences, setSequences] = useState(initialSequences);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSequences = sequences.filter((s: any) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await createSequence({ name, description });
    if (res.success && res.sequence) {
      setSequences([{...res.sequence, steps: [], _count: { enrollments: 0 }}, ...sequences]);
      setIsModalOpen(false);
      setName("");
      setDescription("");
    }
    setIsSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await updateSequence(id, { isActive: !current });
    if (res.success) {
      setSequences(sequences.map(s => s.id === id ? { ...s, isActive: !current } : s));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette séquence et désinscrire tous les contacts ?")) return;
    const res = await deleteSequence(id);
    if (res.success) {
      setSequences(sequences.filter(s => s.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Séquences Automatisées
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Créez des campagnes "Drip" multi-canales pour engager vos prospects dans le temps.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary-gradient flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Créer une Séquence
        </button>
      </div>

      <div className="glass-panel p-4 mb-6">
         <div className="flex items-center gap-3">
           <Search className="w-5 h-5 text-[var(--text-secondary)]" />
           <input 
             type="text"
             placeholder="Rechercher une séquence..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="bg-transparent border-none outline-none w-full text-[var(--text-primary)]"
           />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSequences.length === 0 ? (
           <div className="col-span-full py-12 text-center text-[var(--text-secondary)] glass-panel">
              Aucune séquence trouvée. Créez-en une pour commencer.
           </div>
        ) : (
          filteredSequences.map((seq: any) => (
            <div key={seq.id} className="glass-panel p-6 flex flex-col hover:border-[var(--accent-cyan)] transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{seq.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{seq.description || "Aucune description"}</p>
                </div>
                <button 
                  onClick={() => toggleActive(seq.id, seq.isActive)}
                  className={`p-2 rounded-full transition-colors ${seq.isActive ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-white'}`}
                  title={seq.isActive ? "Désactiver" : "Activer"}
                >
                  {seq.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-6">
                <div className="flex items-center gap-1.5">
                   <CalendarClock className="w-4 h-4" />
                   <span>{seq.steps?.length || 0} étapes</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <span className="px-2 py-0.5 rounded-full bg-[var(--bg-surface-hover)] text-xs font-semibold">
                     {seq._count?.enrollments || 0} inscrits
                   </span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex gap-2">
                 <Link 
                   href={`/dashboard/sequences/${seq.id}`}
                   className="flex-1 py-2 text-center text-sm font-semibold bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
                 >
                   Éditer le workflow
                 </Link>
                 <button 
                   onClick={() => handleDelete(seq.id)}
                   className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--border-subtle)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Nouvelle Séquence</h2>
            </div>
            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[var(--text-secondary)]">Nom de la séquence</label>
                  <input 
                    type="text" required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]"
                    placeholder="Ex: Relance Nouveaux Inscrits"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[var(--text-secondary)]">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] min-h-[80px] resize-none"
                    placeholder="Objectif de cette séquence..."
                  />
                </div>
              </div>
              <div className="p-6 border-t border-[var(--border-subtle)] flex justify-end gap-3 bg-[var(--bg-surface)]">
                <button 
                   type="button"
                   onClick={() => setIsModalOpen(false)} 
                   className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Annuler
                </button>
                <button 
                   type="submit"
                   disabled={isSaving || !name.trim()} 
                   className="btn-primary-gradient flex items-center justify-center min-w-[100px]"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
