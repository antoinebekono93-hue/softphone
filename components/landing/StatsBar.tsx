"use client";

import { AnimatedNumber, Item, Reveal, Stagger } from "./motion";

const stats = [
  { value: 10000, label: "Entreprises clientes", suffix: "+" },
  { value: 50, label: "Pays supportés", suffix: "+" },
  { value: 99.99, label: "Disponibilité", suffix: "%", decimals: 2 },
  { value: 2000000, label: "Appels traités / jour", suffix: "+", compact: true },
];

export default function StatsBar() {
  return (
    <section className="py-24 px-4 max-w-7xl mx-auto w-full">
      <Reveal className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
          La plateforme de communication IA de confiance
        </h2>
        <p className="text-[var(--text-secondary)] text-lg font-medium">
          Fiabilité et échelle au service de votre entreprise.
        </p>
      </Reveal>

      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <Item key={i}>
            <div className="rounded-[32px] glass-panel-premium p-8 text-center h-full">
              <div className="text-4xl md:text-5xl font-extrabold n8n-gradient-text mb-2 whitespace-nowrap">
                <AnimatedNumber
                  value={stat.value}
                  decimals={stat.decimals ?? 0}
                  compact={stat.compact ?? false}
                />
                {stat.suffix}
              </div>
              <div className="text-sm font-medium text-[var(--text-secondary)]">{stat.label}</div>
            </div>
          </Item>
        ))}
      </Stagger>

      {/* Live counter banner */}
      <Reveal delay={0.1}>
        <div className="rounded-[32px] border border-emerald-500/30 bg-emerald-500/5 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-bold text-[var(--text-primary)]">En direct</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm font-medium text-[var(--text-secondary)]">
              <span className="font-bold text-[var(--text-primary)]">
                <AnimatedNumber value={52451} duration={2} />
              </span>{" "}
              appels la dernière heure
            </div>
            <div className="text-sm font-medium text-[var(--text-secondary)]">
              <span className="font-bold text-[var(--text-primary)]">
                <AnimatedNumber value={211713421} duration={2.4} compact />
              </span>{" "}
              minutes les dernières 24h
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}