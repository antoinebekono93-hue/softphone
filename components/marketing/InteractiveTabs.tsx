"use client";

import { useState } from "react";

export default function InteractiveTabs({
  tabs,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
}) {
  const [activeId, setActiveId] = useState(tabs[0].id);
  const active = tabs.find((t) => t.id === activeId);

  return (
    <div>
      <div className="flex gap-2 mb-12 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center scrollbar-none">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? "n8n-gradient-bg text-white shadow-lg shadow-rose-500/20"
                  : "bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div key={activeId} className="animate-fade-up">{active?.content}</div>
    </div>
  );
}