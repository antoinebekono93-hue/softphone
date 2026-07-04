"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveTelnyxKey } from "./actions";

export function TelnyxKeyForm({ defaultValue }: { defaultValue: string }) {
  const [key, setKey] = useState(defaultValue);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await saveTelnyxKey(key);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Clé API Telnyx sauvegardée !");
      }
    } catch (e) {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 mb-6">
      <label className="text-sm font-medium text-[var(--text-secondary)]">Clé API Telnyx</label>
      <div className="flex gap-4">
        <input 
          type="password" 
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="KEY0182..."
          className="w-full max-w-md bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 transition-colors" 
        />
        <button 
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mt-1">
        Nécessaire pour rechercher et acheter des numéros de téléphone via Telnyx.
      </p>
    </div>
  );
}
