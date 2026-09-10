"use client";

import { useState } from "react";

export default function FAQAccordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto divide-y divide-[var(--border-subtle)] rounded-[32px] glass-panel-premium px-2 md:px-6">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-5 px-4 text-left group"
              aria-expanded={isOpen}
            >
              <span className="text-base md:text-lg font-bold text-[var(--text-primary)] group-hover:text-rose-400 transition-colors">{item.question}</span>
              <span
                className={`w-8 h-8 shrink-0 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] transition-transform duration-300 group-hover:border-rose-500/30 ${isOpen ? "rotate-45" : ""}`}
                aria-hidden="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              role="region"
              aria-hidden={!isOpen}
            >
              <div className="overflow-hidden">
                <p className="text-[var(--text-secondary)] font-medium leading-relaxed pb-5 px-4">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}