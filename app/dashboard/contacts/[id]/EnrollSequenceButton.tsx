"use client";

import { useState } from "react";
import { Workflow, Loader2, Play } from "lucide-react";
import { enrollContact } from "../../sequences/actions";

export function EnrollSequenceButton({ contactId, sequences }: { contactId: string, sequences: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  
  const activeSequences = sequences.filter(s => s.isActive);

  const handleEnroll = async (sequenceId: string) => {
    setIsEnrolling(true);
    const res = await enrollContact(sequenceId, contactId);
    if (res.success) {
      alert("Contact inscrit avec succès à la séquence !");
    } else {
      alert("Erreur lors de l'inscription");
    }
    setIsEnrolling(false);
    setIsOpen(false);
  };

  if (activeSequences.length === 0) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-[var(--accent-cyan)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Inscrire à une séquence</span>
        </div>
        {isEnrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95">
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2 py-1">
            Choisir une séquence
          </div>
          <div className="max-h-48 overflow-y-auto mt-1">
            {activeSequences.map(seq => (
              <button
                key={seq.id}
                onClick={() => handleEnroll(seq.id)}
                className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
              >
                {seq.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
