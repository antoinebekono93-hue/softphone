"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Plus, DollarSign, User, Phone, CheckCircle, XCircle, FileText, Send, Trash2, MessageSquare, PhoneCall } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
  
  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", expectedRevenue: 0, contactId: "" });
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [detailedOpp, setDetailedOpp] = useState<any>(null);
  const [newNote, setNewNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch detailed opportunity when selected
  useEffect(() => {
    if (selectedOppId) {
      fetchOppDetails(selectedOppId);
    }
  }, [selectedOppId]);

  const fetchOppDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/opportunities/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailedOpp(data.opportunity);
      }
    } catch (e) {
      console.error(e);
    }
  };

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
      setIsNewModalOpen(false);
      setFormData({ name: "", expectedRevenue: 0, contactId: "" });
      router.refresh();
      toast.success("Opportunité créée");
    } catch (error) {
      toast.error("Erreur lors de la création.");
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
      // Revert on error
      setOpportunities(opportunities);
      toast.error("Erreur lors du déplacement.");
    }
  };

  const handleUpdateDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedOpp) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/opportunities/${detailedOpp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: detailedOpp.name, 
          expectedRevenue: Number(detailedOpp.expectedRevenue) 
        })
      });
      
      if (res.ok) {
        toast.success("Mise à jour réussie");
        // Update local list
        setOpportunities(opportunities.map(o => o.id === detailedOpp.id ? detailedOpp : o));
      }
    } catch (e) {
      toast.error("Erreur de mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !detailedOpp) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/opportunities/${detailedOpp.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote })
      });
      if (res.ok) {
        const data = await res.json();
        setDetailedOpp({
          ...detailedOpp,
          internalNotes: [data.note, ...(detailedOpp.internalNotes || [])]
        });
        setNewNote("");
      }
    } catch (e) {
      toast.error("Impossible d'ajouter la note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!detailedOpp || !confirm("Voulez-vous vraiment supprimer cette opportunité ?")) return;
    
    try {
      const res = await fetch(`/api/opportunities/${detailedOpp.id}`, { method: "DELETE" });
      if (res.ok) {
        setOpportunities(opportunities.filter(o => o.id !== detailedOpp.id));
        setIsDetailModalOpen(false);
        toast.success("Opportunité supprimée");
      }
    } catch (e) {
      toast.error("Erreur de suppression");
    }
  };

  const getStageOpportunities = (stageId: string) => {
    return opportunities.filter(o => o.stage === stageId) || [];
  };

  if (!isMounted) return null;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-end mb-2 px-2">
        <button onClick={() => setIsNewModalOpen(true)} className="btn-primary-gradient px-4 py-2 flex items-center gap-2 rounded-xl text-sm font-bold shadow-sm">
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
                              onClick={() => {
                                setSelectedOppId(opp.id);
                                setIsDetailModalOpen(true);
                              }}
                              className={`mb-3 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm hover:border-emerald-500 cursor-pointer transition-all ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] border-emerald-500/50' : ''}`}
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

      {/* New Opportunity Modal */}
      {isNewModalOpen && (
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
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name || c.phone}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-[var(--bg-surface-hover)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary-gradient py-3 px-4 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50">
                  {isSubmitting ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Opportunity Detail Modal / Slide-over */}
      {isDetailModalOpen && detailedOpp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-base)] w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
              <h2 className="text-xl font-bold">Détails de l'opportunité</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[var(--bg-surface-hover)]">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* Infos & Edition */}
              <div className="glass-panel p-6 rounded-2xl">
                <form onSubmit={handleUpdateDetail} className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Titre</label>
                      <input 
                        type="text" value={detailedOpp.name} 
                        onChange={(e) => setDetailedOpp({...detailedOpp, name: e.target.value})}
                        className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Revenu (XAF)</label>
                      <input 
                        type="number" value={detailedOpp.expectedRevenue} 
                        onChange={(e) => setDetailedOpp({...detailedOpp, expectedRevenue: e.target.value})}
                        className="w-32 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded p-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={handleDelete} className="px-3 py-1 text-xs text-rose-500 hover:bg-rose-500/10 rounded transition-colors flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Supprimer
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary-gradient px-4 py-1.5 rounded text-xs font-bold disabled:opacity-50">
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>

              {/* Contact associé */}
              {detailedOpp.contact && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><User className="w-4 h-4"/> Contact Associé</h3>
                  <div className="bg-[var(--bg-surface-hover)] rounded-xl p-4 border border-[var(--border-subtle)]">
                    <p className="font-bold mb-1">{detailedOpp.contact.name || "Inconnu"}</p>
                    <p className="text-sm text-gray-400 mb-4">{detailedOpp.contact.phone}</p>
                    
                    {/* Historique rapide du contact (appels récents) */}
                    {detailedOpp.contact.callLogs?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                        <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><PhoneCall className="w-3 h-3"/> Derniers appels</p>
                        <div className="space-y-2">
                          {detailedOpp.contact.callLogs.slice(0, 3).map((log: any) => (
                            <div key={log.id} className="text-xs bg-[var(--bg-surface-solid)] p-2 rounded flex justify-between">
                              <span className={log.status === 'NO_ANSWER' ? 'text-rose-500' : 'text-emerald-500'}>{log.status}</span>
                              <span className="text-gray-500">{new Date(log.createdAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Internes (Générées par l'IA ou manuelles) */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> Notes Internes (Source & Historique)</h3>
                
                {/* Add new note */}
                <form onSubmit={handleAddNote} className="mb-4 relative">
                  <input 
                    type="text" 
                    placeholder="Ajouter une note manuelle..." 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg py-3 pl-4 pr-12 text-sm focus:border-emerald-500 outline-none"
                  />
                  <button type="submit" disabled={isSubmitting || !newNote.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-500 text-white rounded-md disabled:opacity-50 hover:bg-emerald-600 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* List of notes */}
                <div className="space-y-3">
                  {detailedOpp.internalNotes?.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Aucune note pour le moment.</p>
                  ) : (
                    detailedOpp.internalNotes?.map((note: any) => (
                      <div key={note.id} className="bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl p-4">
                        <p className="text-sm text-[var(--text-primary)] mb-2 whitespace-pre-wrap">{note.content}</p>
                        <span className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
