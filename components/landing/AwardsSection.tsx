"use client";

import { motion, useReducedMotion } from "motion/react";
import { Item, Reveal, Stagger } from "./motion";

const architecturalGarantees = [
  { icon: "🔒", title: "Isolation Multi-Tenant", subtitle: "Cloisonnement strict des données par organisation" },
  { icon: "⚡", title: "Latence Optimisée", subtitle: "Routage direct des flux vocaux WebRTC" },
  { icon: "🛡️", title: "Protection Anti-Fraude", subtitle: "Limites d'usage loyal et pré-autorisation wallet" },
  { icon: "📊", title: "Traçabilité Complète", subtitle: "Journaux d'appels et métriques en temps réel" },
  { icon: "🔄", title: "Continuité de Service", subtitle: "Redondance d'infrastructure et failover opérateur" },
  { icon: "⚙️", title: "API & Webhooks", subtitle: "Intégration directe avec vos outils métier" }
];

export default function AwardsSection() {
  const reduced = useReducedMotion();

  return (
    <section className="py-24 px-4 max-w-7xl mx-auto w-full">
      <Reveal className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
          Garanties <span className="text-gradient">techniques</span>
        </h2>
        <p className="text-[var(--text-secondary)] text-lg font-medium">
          Une plateforme bâtie sur des standards ouverts et des choix d'architecture robustes.
        </p>
      </Reveal>

      <Stagger className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {architecturalGarantees.map((item, i) => (
          <Item key={i}>
            <motion.div
              whileHover={reduced ? undefined : { y: -4 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-[32px] glass-panel-premium p-8 text-center group h-full"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl bg-[var(--bg-surface-hover)] text-cyan-400">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{item.title}</h3>
              <p className="text-sm font-medium text-[var(--text-secondary)]">{item.subtitle}</p>
            </motion.div>
          </Item>
        ))}
      </Stagger>
    </section>
  );
}
