"use client";

import { useState } from "react";
import { toggleAiAutomation, createAutomationRule, deleteAutomationRule } from "./actions";
import { Plus, Trash2, Zap } from "lucide-react";
import toast from "react-hot-toast";

export function AutomationsClient({ aiRule, campaigns, genericRules = [] }: { aiRule: any, campaigns: any[], genericRules?: any[] }) {
  const [isAiRuleActive, setIsAiRuleActive] = useState(aiRule?.isActive || false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(() => {
    if (aiRule && aiRule.actionPayload) {
      try {
        const p = JSON.parse(aiRule.actionPayload);
        return p.campaignId || "";
      } catch (e) {
        return "";
      }
    }
    return "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("CALL_MISSED");
  const [actionType, setActionType] = useState("SEND_SMS");
  const [message, setMessage] = useState("Bonjour {{contact.name}}, ...");

  const handleToggle = async () => {
    setIsLoading(true);
    const newState = !isAiRuleActive;
    setIsAiRuleActive(newState);
    await toggleAiAutomation(newState, selectedCampaignId);
    setIsLoading(false);
  };

  const handleCampaignChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCampaignId = e.target.value;
    setSelectedCampaignId(newCampaignId);
    if (isAiRuleActive) {
      setIsLoading(true);
      await toggleAiAutomation(true, newCampaignId);
      setIsLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading("Création de la règle...");
    
    try {
      await createAutomationRule({
        name,
        triggerType,
        actionType,
        actionPayload: { message }
      });
      toast.success("Règle créée avec succès !", { id: toastId });
      setShowModal(false);
      setName("");
    } catch (err) {
      toast.error("Erreur lors de la création.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette règle ?")) return;
    setIsLoading(true);
    const toastId = toast.loading("Suppression...");
    try {
      await deleteAutomationRule(id);
      toast.success("Règle supprimée.", { id: toastId });
    } catch (err) {
      toast.error("Erreur de suppression.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Vos Règles d'Automatisation</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle Règle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Règle Système IA (Hardcodée) */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col hover:border-emerald-500/50 transition-colors relative">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Relance IA vers SMS</h3>
            <div 
              onClick={isLoading ? undefined : handleToggle}
              className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${isAiRuleActive ? 'bg-emerald-500' : 'bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${isAiRuleActive ? 'translate-x-5' : ''}`} />
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-[var(--text-secondary)]"><Zap className="w-4 h-4"/></div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Quand</div>
                <div className="text-sm font-medium text-[var(--text-primary)]">Un appel de l'Agent IA est manqué</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-emerald-500"><Zap className="w-4 h-4"/></div>
              <div className="w-full">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1">Alors</div>
                <div className="text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-surface-hover)] p-3 rounded-lg border border-[var(--border-subtle)]">
                  <p className="mb-2">Ajouter à la campagne :</p>
                  <select 
                    value={selectedCampaignId}
                    onChange={handleCampaignChange}
                    disabled={isLoading}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm"
                  >
                    <option value="">-- Sélectionner --</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Règles Dynamiques */}
        {genericRules.map(rule => (
          <div key={rule.id} className="glass-panel rounded-2xl p-6 flex flex-col hover:border-blue-500/50 transition-colors relative border border-gray-200">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{rule.name}</h3>
              <button onClick={() => handleDeleteRule(rule.id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[var(--text-secondary)]"><Zap className="w-4 h-4"/></div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Quand</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{rule.triggerType}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-blue-500"><Zap className="w-4 h-4"/></div>
                <div className="w-full">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">Alors ({rule.actionType})</div>
                  <div className="text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-surface-hover)] p-3 rounded-lg border border-[var(--border-subtle)] overflow-hidden text-ellipsis">
                    {(() => {
                      try {
                        const payload = JSON.parse(rule.actionPayload);
                        return payload.message ? `"${payload.message}"` : 'Action configurée';
                      } catch(e) { return 'Configuration invalide'; }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">Créer une Automatisation</h2>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom de la règle</label>
                <input required value={name} onChange={e=>setName(e.target.value)} type="text" className="w-full border rounded-md p-2" placeholder="ex: SMS de bienvenue" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quand cet événement se produit :</label>
                <select value={triggerType} onChange={e=>setTriggerType(e.target.value)} className="w-full border rounded-md p-2 bg-gray-50">
                  <option value="CALL_MISSED">Un appel est manqué</option>
                  <option value="TICKET_CREATED">Un ticket est créé</option>
                  <option value="TICKET_RESOLVED">Un ticket est résolu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Faire ceci :</label>
                <select value={actionType} onChange={e=>setActionType(e.target.value)} className="w-full border rounded-md p-2 bg-gray-50">
                  <option value="SEND_SMS">Envoyer un SMS automatique</option>
                  <option value="SEND_WHATSAPP">Envoyer un message WhatsApp</option>
                  <option value="CREATE_OPPORTUNITY">Créer une Opportunité CRM</option>
                </select>
              </div>
              
              {(actionType === 'SEND_SMS' || actionType === 'SEND_WHATSAPP') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Message (Variables: {"{{contact.name}}"})</label>
                  <textarea required value={message} onChange={e=>setMessage(e.target.value)} className="w-full border rounded-md p-2 h-24" />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Annuler</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
