"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw, Save } from "lucide-react";

export default function AdminSettingsClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [rates, setRates] = useState({
    smsRate: 0,
    callRatePerMinute: 0,
    aiAgentRatePerMinute: 0,
    whatsappRate: 0,
    phoneNumberRate: 0,
    eSimRate: 0,
    telnyxApiKey: "",
    telnyxConnectionId: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setRates({
          smsRate: data.smsRate,
          callRatePerMinute: data.callRatePerMinute,
          aiAgentRatePerMinute: data.aiAgentRatePerMinute,
          whatsappRate: data.whatsappRate,
          phoneNumberRate: data.phoneNumberRate,
          eSimRate: data.eSimRate,
          telnyxApiKey: data.telnyxApiKey || "",
          telnyxConnectionId: data.telnyxConnectionId || ""
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rates)
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      toast.success("Tarifs mis à jour avec succès !");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRates(prev => ({ 
      ...prev, 
      [name]: name.startsWith("telnyx") ? value : (parseFloat(value) || 0) 
    }));
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><RefreshCw className="w-6 h-6 animate-spin text-cyan-500" /></div>;
  }

  return (
    <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Tarification Globale (Dynamique)</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-opacity disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sauvegarder les taux
        </button>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        Définissez le prix en dollars ($) qui sera déduit du portefeuille (Wallet) du client à chaque action.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-[var(--border-subtle)]">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Coût par SMS envoyé</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">$</span>
            <input type="number" step="0.01" name="smsRate" value={rates.smsRate} onChange={handleChange} className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg py-2 pl-7 pr-3 text-[var(--text-primary)] focus:border-cyan-500 outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Coût par msg WhatsApp</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">$</span>
            <input type="number" step="0.01" name="whatsappRate" value={rates.whatsappRate} onChange={handleChange} className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg py-2 pl-7 pr-3 text-[var(--text-primary)] focus:border-cyan-500 outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Coût Appel (par minute)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">$</span>
            <input type="number" step="0.01" name="callRatePerMinute" value={rates.callRatePerMinute} onChange={handleChange} className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg py-2 pl-7 pr-3 text-[var(--text-primary)] focus:border-cyan-500 outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Coût Appel IA (par minute)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">$</span>
            <input type="number" step="0.01" name="aiAgentRatePerMinute" value={rates.aiAgentRatePerMinute} onChange={handleChange} className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg py-2 pl-7 pr-3 text-[var(--text-primary)] focus:border-cyan-500 outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Coût Numéro (par mois)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">$</span>
            <input type="number" step="0.01" name="phoneNumberRate" value={rates.phoneNumberRate} onChange={handleChange} className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg py-2 pl-7 pr-3 text-[var(--text-primary)] focus:border-cyan-500 outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Coût e-SIM (par mois)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">$</span>
            <input type="number" step="0.01" name="eSimRate" value={rates.eSimRate} onChange={handleChange} className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg py-2 pl-7 pr-3 text-[var(--text-primary)] focus:border-cyan-500 outline-none" />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-[var(--border-subtle)] space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Téléphonie (Telnyx WebRTC)</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Configurez la clé d'API globale et l'ID de connexion SIP pour la plateforme.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">API Key (V2)</label>
            <input type="password" name="telnyxApiKey" value={rates.telnyxApiKey} onChange={handleChange} placeholder="KEY..." className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg py-2 px-3 text-[var(--text-primary)] focus:border-cyan-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">SIP Connection ID</label>
            <input type="text" name="telnyxConnectionId" value={rates.telnyxConnectionId} onChange={handleChange} placeholder="123456789..." className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg py-2 px-3 text-[var(--text-primary)] focus:border-cyan-500 outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
