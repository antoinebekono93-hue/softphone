"use client";

import { useState } from "react";
import { Save, Loader2, DollarSign, Percent, TrendingUp, PhoneCall, MessageSquare, Bot } from "lucide-react";
import { toast } from "sonner";
import { updatePricingSettings } from "./actions";

export function PricingSettingsClient({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState(initialSettings || {
    phoneNumberMarkupMultiplier: 2.5,
    phoneNumberMarkupFixed: 0.0,
    smsRate: 0.05,
    callRatePerMinute: 0.02,
    aiAgentRatePerMinute: 0.15,
    whatsappRate: 0.02
  });
  
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await updatePricingSettings(settings);
      if (res.success) {
        toast.success("Tarifs mis à jour avec succès !");
      } else {
        toast.error(res.error || "Erreur lors de la sauvegarde.");
      }
    } catch (e) {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    const num = parseFloat(value);
    setSettings({ ...settings, [key]: isNaN(num) ? 0 : num });
  };

  return (
    <div className="space-y-8">
      {/* Phone Numbers Margin */}
      <div className="glass-panel p-6 rounded-2xl border border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Numéros de Téléphone (DID)</h2>
            <p className="text-sm text-[var(--text-secondary)]">Marge appliquée lors de la revente des numéros Telnyx</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)]">
          <div>
            <label className="block text-sm font-semibold mb-2">Multiplicateur de prix</label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input 
                type="number" 
                step="0.1" 
                value={settings.phoneNumberMarkupMultiplier}
                onChange={(e) => handleChange("phoneNumberMarkupMultiplier", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:border-cyan-500 outline-none"
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Ex: 2.5 signifie que vous vendez 2.5x le prix de Telnyx. Un numéro acheté 1$ sera vendu 2.50$.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Marge fixe (Bonus additionnel)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input 
                type="number" 
                step="0.1" 
                value={settings.phoneNumberMarkupFixed}
                onChange={(e) => handleChange("phoneNumberMarkupFixed", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:border-cyan-500 outline-none"
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              S'ajoute après le multiplicateur. Ex: +2$. Un numéro à 1$ avec multiplicateur 2.5x devient 2.50$ + 2$ = 4.50$.
            </p>
          </div>
        </div>
      </div>

      {/* Consumption Rates */}
      <div className="glass-panel p-6 rounded-2xl border border-[var(--border-subtle)]">
        <h2 className="text-xl font-bold mb-2">Tarification de consommation</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Définissez vos prix de vente (Prix facturé aux clients via leur portefeuille)</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="p-4 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-4 text-[var(--text-secondary)]">
              <PhoneCall className="w-4 h-4" /> <span className="font-semibold text-sm">Appels Vocaux</span>
            </div>
            <label className="block text-sm mb-2">Prix par minute ($)</label>
            <input 
              type="number" step="0.001" 
              value={settings.callRatePerMinute}
              onChange={(e) => handleChange("callRatePerMinute", e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-2">Coût Telnyx moyen : ~0.007$ (sortant)</p>
          </div>

          <div className="p-4 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-4 text-[var(--text-secondary)]">
              <MessageSquare className="w-4 h-4" /> <span className="font-semibold text-sm">SMS / MMS</span>
            </div>
            <label className="block text-sm mb-2">Prix par SMS ($)</label>
            <input 
              type="number" step="0.001" 
              value={settings.smsRate}
              onChange={(e) => handleChange("smsRate", e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-2">Coût Telnyx moyen : ~0.004$</p>
          </div>

          <div className="p-4 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-4 text-[var(--text-secondary)]">
              <Bot className="w-4 h-4" /> <span className="font-semibold text-sm">Agents IA Vocaux</span>
            </div>
            <label className="block text-sm mb-2">Prix par minute ($)</label>
            <input 
              type="number" step="0.001" 
              value={settings.aiAgentRatePerMinute}
              onChange={(e) => handleChange("aiAgentRatePerMinute", e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-2">Coût de l'infrastructure estimé : ~0.05$</p>
          </div>

          <div className="p-4 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-4 text-[#25D366]">
              <MessageSquare className="w-4 h-4" /> <span className="font-semibold text-sm">WhatsApp Business</span>
            </div>
            <label className="block text-sm mb-2">Prix par message ($)</label>
            <input 
              type="number" step="0.001" 
              value={settings.whatsappRate}
              onChange={(e) => handleChange("whatsappRate", e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-2">Coût Meta estimé : ~0.008$</p>
          </div>

        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="apple-btn btn-primary flex items-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Enregistrer les tarifs
        </button>
      </div>

    </div>
  );
}
