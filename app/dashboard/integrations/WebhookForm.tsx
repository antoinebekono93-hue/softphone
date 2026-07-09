"use client";

import { useState } from "react";
import { saveWebhookSettings } from "./actions";
import toast from "react-hot-toast";

export default function WebhookForm({ initialUrl, initialSecret }: { initialUrl: string | null, initialSecret: string | null }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await saveWebhookSettings(formData);
      toast.success("Paramètres Webhook enregistrés !");
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement");
    }
    setLoading(false);
  }

  return (
    <div className="glass-panel rounded-2xl p-6 mt-8">
      <h2 className="text-xl font-bold mb-2">Webhooks Sortants (Générique)</h2>
      <p className="text-[var(--text-secondary)] text-sm mb-6">
        Connectez Antigravity à Zapier, Make, Pipedream ou votre propre serveur. Nous enverrons un payload JSON à cette URL pour chaque événement clé (ticket.escalated, message.received, call.completed).
      </p>

      <form action={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">URL du Webhook</label>
          <input 
            type="url" 
            name="webhookUrl" 
            defaultValue={initialUrl || ""} 
            placeholder="https://hooks.zapier.com/hooks/catch/..."
            className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Secret (Optionnel)</label>
          <input 
            type="password" 
            name="webhookSecret" 
            defaultValue={initialSecret || ""} 
            placeholder="Votre clé secrète pour sécuriser l'appel"
            className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] outline-none"
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">Sera envoyé dans le header `X-Webhook-Secret`.</p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="bg-[var(--accent-primary)] text-[var(--accent-foreground)] px-6 py-2 rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer le Webhook"}
        </button>
      </form>
    </div>
  );
}
