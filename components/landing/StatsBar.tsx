"use client";

import { Item, Reveal, Stagger } from "./motion";

const capabilities = [
  { value: "24/7", label: "Agents vocaux disponibles en continu" },
  { value: "Appels internes", label: "illimités entre utilisateurs (app-to-app)" },
  { value: "Multi-canal", label: "voix, SMS et WhatsApp dans une boîte unique" },
  { value: "PWA", label: "Buster Call web, mobile et desktop" },
];

export default function StatsBar() {
  return (
    <section className="landing-section landing-container max-w-7xl mx-auto w-full">
      <Reveal className="landing-section-heading text-center">
        <h2 className="landing-heading font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
          Une architecture conçue pour la performance
        </h2>
        <p className="text-[var(--text-secondary)] landing-body font-medium">
          Fiabilité et réactivité au service de vos échanges professionnels.
        </p>
      </Reveal>

      <Stagger className="landing-grid landing-stats-grid">
        {capabilities.map((item, i) => (
          <Item key={i}>
            <div className="landing-card glass-panel-premium text-center h-full flex flex-col justify-center">
              <div className="landing-stat-value font-extrabold n8n-gradient-text mb-2">
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
