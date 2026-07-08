'use client';
import { useState, useEffect } from 'react';
import { Plus, Bot } from 'lucide-react';
import Link from 'next/link';

export default function GodModeTemplatesPage() {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetch('/api/god-mode/templates')
      .then(res => res.json())
      .then(data => setTemplates(data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Templates d'Agents (Âmes)</h2>
          <p className="text-[var(--text-secondary)]">Gérez les profils et les comportements profonds des agents IA.</p>
        </div>
        <Link href="/god-mode/templates/new" className="bg-[var(--accent-primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nouveau Template
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((tpl: any) => (
          <div key={tpl.id} className="p-6 border border-[var(--border-subtle)] rounded-3xl bg-[var(--bg-elevated)]">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tpl.bgColor} ${tpl.color}`}>
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">{tpl.name}</h3>
                <p className="text-sm text-[var(--accent-primary)]">{tpl.jobTitle}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={`/god-mode/templates/${tpl.id}`} className="flex-1 text-center py-2 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl text-sm font-medium hover:bg-[var(--accent-primary)] hover:text-white transition-colors">
                Configurer l'Âme
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
