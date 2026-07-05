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

export default function PipelineClient({ initialOpportunities }: { initialOpportunities: any[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    <div className="h-full flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
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
  );
}
