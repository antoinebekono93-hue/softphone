"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Plus, DollarSign, User, Phone, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const STAGES = [
  { id: "NEW", title: "Nouveau", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { id: "QUALIFIED", title: "Qualifié", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { id: "PROPOSAL", title: "Proposition", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { id: "NEGOTIATION", title: "Négociation", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  { id: "WON", title: "Gagné", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { id: "LOST", title: "Perdu", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
];

export default function PipelineClient({ initialOpportunities, contacts }: { initialOpportunities: any[], contacts: any[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", expectedRevenue: 0, contactId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed to create opportunity");
      
      const { opportunity } = await res.json();
      setOpportunities([opportunity, ...opportunities]);
      setIsModalOpen(false);
      setFormData({ name: "", expectedRevenue: 0, contactId: "" });
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistic UI update
    const movedOpp = opportunities.find(o => o.id === draggableId);
    if (!movedOpp) return;

    const updatedOpp = { ...movedOpp, stage: destination.droppableId };
    const newOpportunities = opportunities.map(o => o.id === draggableId ? updatedOpp : o);
    setOpportunities(newOpportunities);

    try {
      const res = await fetch(`/api/opportunities/${draggableId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: destination.droppableId })
      });

      if (!res.ok) throw new Error("Failed to update stage");
    } catch (error) {
      console.error(error);
      // Revert on error
      setOpportunities(opportunities);
      alert("Erreur lors du déplacement de l'opportunité.");
    }
  };

  const getStageOpportunities = (stageId: string) => {
    return opportunities.filter(o => o.stage === stageId) || [];
  };

  if (!isMounted) return null;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-end mb-2 px-2">
        <button onClick={() => setIsModalOpen(true)} className="btn-primary-gradient px-4 py-2 flex items-center gap-2 rounded-xl text-sm font-bold shadow-sm">
          <Plus className="w-4 h-4" />
          Nouvelle Opportunité
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        <DragDropContext onDragEnd={onDragEnd}>
          {STAGES.map(stage => {
            const stageOpps = getStageOpportunities(stage.id);
            const totalValue = stageOpps.reduce((acc, opp) => acc + (opp.expectedRevenue || 0), 0);

            return (
              <div key={stage.id} className="min-w-[320px] w-[320px] flex flex-col glass-panel rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                <div className={`p-4 border-b border-[var(--border-subtle)] flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${stage.color}`}>
                      {stage.title}
                    </span>
                    <span className="text-xs font-bold text-[var(--text-secondary)]">{stageOpps.length}</span>
                  </div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(totalValue)}
                  </div>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 overflow-y-auto custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-[var(--bg-surface-hover)]' : ''}`}
                    >
                      {stageOpps.map((opp, index) => (
                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-3 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm hover:border-[var(--text-secondary)] transition-all ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] border-emerald-500/50' : ''}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-[var(--text-primary)]">{opp.name}</h3>
                                <GripVertical className="w-4 h-4 text-[var(--text-secondary)] opacity-50" />
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-3">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-semibold text-emerald-500">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(opp.expectedRevenue)}
                                </span>
                              </div>

                              {opp.contact && (
                                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1">
                                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                    <User className="w-3 h-3" />
                                    <span className="truncate">{opp.contact.name || "Inconnu"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                    <Phone className="w-3 h-3" />
                                    <span>{opp.contact.phone}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </DragDropContext>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Nouvelle Opportunité</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Titre de l'opportunité</label>
                <input 
                  type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-emerald-500 outline-none"
                  placeholder="Ex: Achat de 50 licences"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Revenu attendu (XAF)</label>
                <input 
                  type="number" required value={formData.expectedRevenue} onChange={e => setFormData({...formData, expectedRevenue: parseFloat(e.target.value) || 0})}
                  className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-emerald-500 outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Contact associé (Optionnel)</label>
                <select 
                  value={formData.contactId} onChange={e => setFormData({...formData, contactId: e.target.value})}
                  className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-emerald-500 outline-none"
                >
                  <option value="">-- Aucun --</option>
                  {contacts.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name || c.phone}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary-gradient px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                  {isSubmitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
