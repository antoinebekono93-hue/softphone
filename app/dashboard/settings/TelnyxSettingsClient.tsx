"use client";

import { useState } from "react";
import { updateTelnyxSettings } from "./actions";

interface TelnyxSettingsClientProps {
  initialApiKey: string;
  initialConnectionId: string;
}

export function TelnyxSettingsClient({ initialApiKey, initialConnectionId }: TelnyxSettingsClientProps) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function onSubmit(formData: FormData) {
    setIsPending(true);
    setMessage(null);
    
    const res = await updateTelnyxSettings(formData);
    
    setIsPending(false);
    if (res.success) {
      setMessage({ type: 'success', text: 'Paramètres Telnyx sauvegardés avec succès !' });
    } else {
      setMessage({ type: 'error', text: res.error || 'Erreur lors de la sauvegarde.' });
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        Téléphonie (Telnyx WebRTC)
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Configurez vos clés d'API Telnyx pour activer les appels WebRTC dans le navigateur (Softphone).
      </p>

      <form action={onSubmit} className="space-y-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="telnyxApiKey" className="text-sm font-medium text-[var(--text-secondary)]">API Key (V2)</label>
          <input 
            type="password"
            id="telnyxApiKey"
            name="telnyxApiKey"
            defaultValue={initialApiKey}
            placeholder="KEY..."
            className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 transition-colors font-mono text-sm"
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Nécessaire pour générer les tokens WebRTC éphémères.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="telnyxConnectionId" className="text-sm font-medium text-[var(--text-secondary)]">SIP Connection ID</label>
          <input 
            type="text"
            id="telnyxConnectionId"
            name="telnyxConnectionId"
            defaultValue={initialConnectionId}
            placeholder="1234567890..."
            className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 transition-colors font-mono text-sm"
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            L'ID de votre connexion SIP Credentials configurée avec le support WebRTC sur Telnyx.
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
            {message.text}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button 
            type="submit" 
            disabled={isPending}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </div>
  );
}
