"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Clock, MessageSquare, Phone, MessageCircle, Save, Trash2, Loader2, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createSequenceStep, deleteSequenceStep, updateSequence } from "../actions";

export function SequenceEditorClient({ initialSequence }: { initialSequence: any }) {
  const [sequence, setSequence] = useState(initialSequence);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // New Step Form
  const [delayHours, setDelayHours] = useState(24);
  const [actionType, setActionType] = useState("SMS");
  const [content, setContent] = useState("");

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await createSequenceStep({
      sequenceId: sequence.id,
      delayHours,
      actionType,
      content
    });
    if (res.success && res.step) {
      setSequence({ ...sequence, steps: [...sequence.steps, res.step] });
      setIsAddingStep(false);
      setContent("");
      setDelayHours(24);
    }
    setIsSaving(false);
  };

  const handleDeleteStep = async (id: string) => {
    if (!confirm("Supprimer cette étape ? Cela décalera les étapes suivantes.")) return;
    const res = await deleteSequenceStep(id, sequence.id);
    if (res.success) {
      // Reload is handled by server action revalidatePath, but we optimistically update
      setSequence({ ...sequence, steps: sequence.steps.filter((s: any) => s.id !== id) });
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'SMS': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'WHATSAPP': return <MessageCircle className="w-5 h-5 text-emerald-500" />;
      case 'AI_CALL': return <Phone className="w-5 h-5 text-rose-500" />;
      default: return <LinkIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/sequences" className="p-2 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {sequence.name}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {sequence.description || "Éditeur de Séquence"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Timeline / Workflow Builder */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Étapes du Workflow</h2>

          {sequence.steps.length === 0 ? (
            <div className="glass-panel p-8 text-center text-[var(--text-secondary)]">
              <p>Cette séquence est vide. Ajoutez votre première action.</p>
            </div>
          ) : (
            <div className="space-y-4 relative">
              {sequence.steps.map((step: any, index: number) => (
                <div key={step.id} className="relative flex gap-6">
                  {/* Timeline Line */}
                  {index !== sequence.steps.length - 1 && (
                    <div className="absolute left-6 top-14 bottom-[-1rem] w-px bg-[var(--border-subtle)] z-0"></div>
                  )}
                  
                  {/* Timeline Node */}
                  <div className="flex flex-col items-center gap-2 z-10 shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center shadow-lg">
                      {getActionIcon(step.actionType)}
                    </div>
                  </div>

                  {/* Step Card */}
                  <div className="glass-panel p-5 flex-1 hover:border-[var(--accent-cyan)] transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-base)] text-[var(--text-secondary)]">
                          Étape {step.stepOrder}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium bg-[var(--bg-surface-hover)] px-2 py-1 rounded-full">
                           <Clock className="w-3.5 h-3.5" />
                           <span>
                             {step.stepOrder === 1 
                               ? (step.delayHours === 0 ? "Immédiatement après inscription" : `Attendre ${step.delayHours}h après inscription`)
                               : `Attendre ${step.delayHours}h après l'étape ${step.stepOrder - 1}`
                             }
                           </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteStep(step.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h3 className="font-bold text-[var(--text-primary)] mt-3">
                      {step.actionType === 'SMS' && "Envoyer un SMS"}
                      {step.actionType === 'WHATSAPP' && "Envoyer un Message WhatsApp"}
                      {step.actionType === 'AI_CALL' && "Lancer un Appel IA"}
                    </h3>
                    
                    <div className="mt-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-base)] p-3 rounded-xl border border-[var(--border-subtle)] whitespace-pre-wrap">
                      {step.content || "(Aucun contenu)"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Step Button / Form */}
          <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
            {!isAddingStep ? (
               <button 
                 onClick={() => setIsAddingStep(true)}
                 className="w-full py-4 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)] hover:bg-[var(--bg-surface)] transition-all"
               >
                 <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-hover)] flex items-center justify-center">
                   <Plus className="w-5 h-5" />
                 </div>
                 <span className="font-semibold">Ajouter une étape</span>
               </button>
            ) : (
               <div className="glass-panel p-6 animate-in slide-in-from-top-4 duration-300">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-[var(--text-primary)]">Configurer l'étape</h3>
                   <button onClick={() => setIsAddingStep(false)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Annuler</button>
                 </div>
                 <form onSubmit={handleAddStep} className="space-y-4">
                   <div>
                     <label className="block text-sm font-semibold mb-1 text-[var(--text-secondary)]">
                       Délai d'attente (en heures)
                     </label>
                     <input 
                       type="number" min="0" required
                       value={delayHours}
                       onChange={(e) => setDelayHours(parseInt(e.target.value) || 0)}
                       className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]"
                     />
                     <p className="text-xs text-[var(--text-secondary)] mt-1">
                       {sequence.steps.length === 0 ? "Temps à attendre après l'inscription du contact." : `Temps à attendre après l'étape ${sequence.steps.length}.`}
                       (0 = immédiat)
                     </p>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-semibold mb-1 text-[var(--text-secondary)]">Type d'action</label>
                     <div className="grid grid-cols-3 gap-3">
                       {['SMS', 'WHATSAPP', 'AI_CALL'].map((type) => (
                         <button
                           key={type}
                           type="button"
                           onClick={() => setActionType(type)}
                           className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${actionType === type ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'}`}
                         >
                           {getActionIcon(type)}
                           <span className="text-xs font-semibold">
                             {type === 'SMS' ? 'SMS' : type === 'WHATSAPP' ? 'WhatsApp' : 'Appel IA'}
                           </span>
                         </button>
                       ))}
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-semibold mb-1 text-[var(--text-secondary)]">
                       {actionType === 'AI_CALL' ? 'Prompt Système IA' : 'Contenu du Message'}
                     </label>
                     <textarea 
                       required
                       value={content}
                       onChange={(e) => setContent(e.target.value)}
                       className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] min-h-[100px] resize-none"
                       placeholder={actionType === 'AI_CALL' ? "Tu es un agent commercial..." : "Bonjour {{name}}, ..."}
                     />
                   </div>

                   <button 
                      type="submit"
                      disabled={isSaving} 
                      className="btn-primary-gradient w-full flex items-center justify-center"
                   >
                     {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer l'étape"}
                   </button>
                 </form>
               </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="font-bold text-[var(--text-primary)] mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Contacts inscrits</span>
                <span className="font-bold text-[var(--text-primary)] bg-[var(--bg-surface)] px-3 py-1 rounded-lg">
                  {sequence.enrollments.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Étapes</span>
                <span className="font-bold text-[var(--text-primary)] bg-[var(--bg-surface)] px-3 py-1 rounded-lg">
                  {sequence.steps.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
