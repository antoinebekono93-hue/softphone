"use client";

import { motion, useReducedMotion } from "motion/react";
import { Item, Reveal, Stagger } from "./motion";

const securityStandards = [
  { name: "RGPD", description: "Conformité européenne de protection des données" },
  { name: "Chiffrement TLS / SRTP", description: "Sécurisation des flux audio et des connexions" },
  { name: "Hébergement Sécurisé", description: "Infrastructure cloud redondante et cloisonnée" },
  { name: "Isolation des Données", description: "Cloisonnement strict par organisation cliente" }
];

export default function ComplianceBadges() {
  const reduced = useReducedMotion();

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto w-full">
      <Reveal className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
          Sécurité et conformité <span className="text-gradient">des données</span>
        </h2>
        <p className="text-[var(--text-secondary)] text-lg font-medium">
          Standards de protection appliqués à vos communications et à votre historique client.
        </p>
      </Reveal>

      <Stagger className="flex flex-wrap justify-center gap-4">
        {securityStandards.map((item, i) => (
          <Item key={i}>
            <motion.div
              whileHover={reduced ? undefined : { y: -3, scale: 1.02 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 px-6 py-3.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-emerald-500/40 hover:shadow-lg transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">{item.name}</div>
                <div className="text-xs text-[var(--text-secondary)] font-medium">{item.description}</div>
              </div>
            </motion.div>
          </Item>
        ))}
      </Stagger>
    </section>
  );
}
