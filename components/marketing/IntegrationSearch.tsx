"use client";

import { useMemo, useState } from "react";

export type Integration = {
  name: string;
  category: string;
  description: string;
  icon: string;
  status: "native" | "api" | "recommandee";
};

const categoryLabels: Record<string, string> = {
  CRM: "CRM",
  Productivité: "Productivité",
  IA: "IA",
  Téléphonie: "Téléphonie",
  Helpdesk: "Helpdesk",
  Marketing: "Marketing",
};

export default function IntegrationSearch({ integrations }: { integrations: Integration[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Toutes");

  const categories = useMemo(
    () => ["Toutes", ...Array.from(new Set(integrations.map((i) => categoryLabels[i.category] ?? i.category)))],
    [integrations],
  );

  const filtered = integrations.filter((i) => {
    const matchesCategory = category === "Toutes" || (categoryLabels[i.category] ?? i.category) === category;
    const q = query.toLowerCase();
    const matchesQuery =
      q === "" ||
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-4 mb-8 items-stretch">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]"
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une intégration… (HubSpot, Notion, WhatsApp, Webhook…)"
            className="w-full rounded-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] py-3 pl-11 pr-5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              category === c
                ? "n8n-gradient-bg text-white shadow-lg shadow-rose-500/20"
                : "bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((integration) => (
          <div key={integration.name} className="rounded-[20px] glass-panel-premium p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] flex items-center justify-center text-lg font-extrabold text-[var(--text-primary)]">
                {integration.icon}
              </div>
              <div>
                <div className="font-bold text-[var(--text-primary)]">{integration.name}</div>
                <div className="text-xs font-bold text-[var(--text-secondary)]">{categoryLabels[integration.category] ?? integration.category}</div>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{integration.description}</p>
            <div className="mt-auto">
              {integration.status === "native" && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  Natif
                </span>
              )}
              {integration.status === "recommandee" && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400">
                  Recommandée
                </span>
              )}
              {integration.status === "api" && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] text-[var(--text-secondary)]">
                  Via API / Webhook
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-[var(--text-secondary)] font-medium py-16">
          Aucune intégration ne correspond à « {query} ». Elle peut être ajoutée via nos API Webhooks.
        </div>
      )}

      {(filtered.length > 0 || query === "") && (
        <div className="text-center mt-10 text-sm text-[var(--text-secondary)] font-medium">
          {filtered.length} intégration{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""} · Besoin autre chose ? <span className="text-rose-400 font-bold">Demandez une intégration</span>
        </div>
      )}
    </div>
  );
}