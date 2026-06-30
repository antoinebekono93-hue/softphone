"use client";

import { useState } from "react";
import { toggleAiAutomation } from "./actions";

export function AutomationsClient({ aiRule, campaigns }: { aiRule: any, campaigns: any[] }) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-panel rounded-2xl p-6 flex flex-col hover:border-emerald-500/50 transition-colors relative">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Relance IA vers SMS</h3>
          {/* Toggle Switch */}
          <div 
            onClick={isLoading ? undefined : handleToggle}
            className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${isAiRuleActive ? 'bg-emerald-500' : 'bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${isAiRuleActive ? 'translate-x-5' : ''}`} />
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-[var(--text-secondary)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Quand</div>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                Un appel de l'Agent IA est manqué (Contact injoignable)
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-emerald-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
            <div className="w-full">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1">Alors</div>
              <div className="text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-surface-hover)] p-3 rounded-lg border border-[var(--border-subtle)]">
                <p className="mb-2">Ajouter le contact à la campagne :</p>
                <select 
                  value={selectedCampaignId}
                  onChange={handleCampaignChange}
                  disabled={isLoading}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm"
                >
                  <option value="">-- Sélectionner une campagne --</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex justify-between items-center text-sm">
          <span className="text-[var(--text-secondary)]">
            {isAiRuleActive ? "Actif et en écoute" : "Désactivé"}
          </span>
        </div>
      </div>
    </div>
  );
}
