"use client";

import { Item, Reveal, Stagger } from "./motion";

const capabilities = [
  { value: "24/7", label: "Agents vocaux disponibles en continu" },
  { value: "Appels internes", label: "illimités entre utilisateurs (app-to-app)" },
  { value: "Multi-canal", label: "voix, SMS et WhatsApp dans une boîte unique" },
  { value: "PWA", label: "Softphone web, mobile et desktop" },
];

export default function StatsBar() {
  return (
    <section className="py-24 px-4 max-w-7xl mx-auto w-full">
      <Reveal className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
          Une architecture conçue pour la performance
        </h2>
        <p className="text-[var(--text-secondary)] text-lg font-medium">
          Fiabilité et réactivité au service de vos échanges professionnels.
        </p>
      </Reveal>

      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {capabilities.map((item, i) => (
          <Item key={i}>
            <div className="rounded-[32px] glass-panel-premium p-8 text-center h-full flex flex-col justify-center">
              <div className="text-3xl md:text-4xl font-extrabold n8n-gradient-text mb-2">
                {item.value}
              </div>
              <div className="text-sm font-medium text-[var(--text-secondary)]">{item.label}</div>
            </div>
          </Item>
        ))}
      </Stagger>
    </section>
  );
}
