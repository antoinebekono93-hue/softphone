"use client";

import { useMemo, useState } from "react";
import CaseCard, { type CaseStudy } from "./CaseCard";

export default function CaseFilters({ cases }: { cases: CaseStudy[] }) {
  const [sector, setSector] = useState<string>("Tous");
  const [solution, setSolution] = useState<string>("Toutes");

  const sectors = useMemo(() => ["Tous", ...Array.from(new Set(cases.map((c) => c.sector)))], [cases]);
  const solutions = useMemo(() => ["Toutes", ...Array.from(new Set(cases.map((c) => c.solution)))], [cases]);

  const filtered = cases.filter(
    (c) => (sector === "Tous" || c.sector === sector) && (solution === "Toutes" || c.solution === solution),
  );

  return (
    <div>
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        {sectors.map((s) => (
          <button
            key={s}
            onClick={() => setSector(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              sector === s
                ? "n8n-gradient-bg text-white shadow-lg shadow-rose-500/20"
                : "bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 justify-center mb-12">
        {solutions.map((s) => (
          <button
            key={s}
            onClick={() => setSolution(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              solution === s
                ? "n8n-gradient-bg text-white shadow-lg shadow-rose-500/20"
                : "bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {s === "Toutes" ? `Toutes les solutions` : s}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((study) => (
          <CaseCard key={study.company} study={study} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-[var(--text-secondary)] font-medium py-16">
          Aucune étude ne correspond à ces filtres.
        </div>
      )}
    </div>
  );
}