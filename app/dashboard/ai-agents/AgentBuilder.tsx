"use client";

import { useState } from "react";
import { saveAgent } from "./actions";
import { X, Save, Bot, Loader2 } from "lucide-react";

export function AgentBuilder({ 
  agent, 
  numbers, 
  onClose 
}: { 
  agent?: any; 
  numbers: any[]; 
  onClose: () => void; 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      id: agent?.id,
      name: formData.get("name") as string,
      prompt: formData.get("prompt") as string,
      voice: formData.get("voice") as string,
      language: formData.get("language") as string,
      phoneNumberId: formData.get("phoneNumberId") as string || null,
    };

    const res = await saveAgent(data);
    if (res.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xl h-full bg-[var(--bg-app)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Bot className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {agent ? "Edit AI Agent" : "New AI Agent"}
            </h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
              {error}
            </div>
          )}

          <form id="agent-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Agent Name</label>
              <input required name="name" defaultValue={agent?.name} type="text" placeholder="e.g. Sales Assistant" className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors text-white" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">System Prompt</label>
              <p className="text-xs text-[var(--text-secondary)] mb-2">Instructions for how the AI should behave, what it should say, and its persona.</p>
              <textarea required name="prompt" defaultValue={agent?.prompt || "You are a helpful virtual assistant. Answer queries concisely and politely."} rows={8} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors text-white font-mono resize-y" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Voice</label>
                <select name="voice" defaultValue={agent?.voice || "alloy"} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors text-white">
                  <option value="alloy">Alloy (Neutral)</option>
                  <option value="echo">Echo (Male)</option>
                  <option value="fable">Fable (British)</option>
                  <option value="onyx">Onyx (Deep Male)</option>
                  <option value="nova">Nova (Female)</option>
                  <option value="shimmer">Shimmer (Female)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Language</label>
                <select name="language" defaultValue={agent?.language || "fr-FR"} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors text-white">
                  <option value="fr-FR">Français</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Assign to Phone Number</label>
              <p className="text-xs text-[var(--text-secondary)] mb-2">Incoming calls to this number will be automatically answered by this AI Agent.</p>
              <select name="phoneNumberId" defaultValue={agent?.phoneNumberId || ""} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors text-white">
                <option value="">Unassigned (No number)</option>
                {numbers.map((num) => (
                  <option key={num.id} value={num.id}>{num.number} ({num.friendlyName || 'Main'})</option>
                ))}
              </select>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-[var(--border-subtle)] flex justify-end gap-3 bg-[var(--bg-surface-hover)]">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-full font-medium text-sm transition-colors text-[var(--text-secondary)] hover:text-white">
            Cancel
          </button>
          <button form="agent-form" disabled={isLoading} type="submit" className="px-6 py-2.5 rounded-full font-medium text-sm transition-colors bg-cyan-500 hover:bg-cyan-600 text-black flex items-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Agent
          </button>
        </div>
      </div>
    </div>
  );
}
