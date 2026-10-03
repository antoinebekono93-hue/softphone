"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Item, Reveal, Stagger } from "./motion";

const useCases = [
  {
    context: "Agences & retail",
    title: "Centraliser les appels d'une réseau d'agences",
    description: "Chaque Collaborateur reçoit un numéro professionnel dédié. Les appels entrants et sortants sont centralisés dans un seul softphone, avec un historique partagé par équipe.",
    products: ["Softphone Web", "Numéros Professionals", "Appels Internes"],
    color: "from-sky-500/20 to-transparent"
  },
  {
    context: "Services client",
    title: "Qualifier les appels hors horaires d'ouverture",
    description: "Un agent vocal IA peut décrocher, qualifier le motif de l'appel et transferring vers le bon interlocuteur, y compris en dehors des horaires planifiés.",
    products: ["Agent Vocal IA", "Renvoi d'Appel", "Transcripts"],
    color: "from-cyan-500/20 to-transparent"
  },
  {
    context: "Équipes terrain",
    title: "Rester joignable depuis un seul numéro",
    description: "Les équipes mobiles utilisent le même numéro professionnel depuis un navigateur ou une application installable, sans configuration de routage supplémentaire.",
    products: ["Softphone PWA", "Numéros Professionnels", "Transfert d'Appel"],
    color: "from-emerald-500/20 to-transparent"
  },
  {
    context: "Pilotage & CRM",
    title: "Unifier les échanges dans le CRM",
    description: "Appels, SMS et historiques sont rattachés au même contact dans votre CRM, et exposés via API et webhooks pour les workflows internes.",
    products: ["Intégrations CRM", "API & Webhooks", "Analytiques"],
    color: "from-violet-500/20 to-transparent"
  }
];

const productColors: Record<string, string> = {
  "Softphone Web": "text-cyan-500 border-cyan-500/30 bg-cyan-500/10",
  "Softphone PWA": "text-cyan-500 border-cyan-500/30 bg-cyan-500/10",
  "Numéros Professionals": "text-blue-500 border-blue-500/30 bg-blue-500/10",
  "Numéros Professionnels": "text-blue-500 border-blue-500/30 bg-blue-500/10",
  "Appels Internes": "text-sky-500 border-sky-500/30 bg-sky-500/10",
  "Agent Vocal IA": "text-violet-500 border-violet-500/30 bg-violet-500/10",
  "Renvoi d'Appel": "text-violet-500 border-violet-500/30 bg-violet-500/10",
  "Transfert d'Appel": "text-violet-500 border-violet-500/30 bg-violet-500/10",
  "Transcripts": "text-blue-500 border-blue-500/30 bg-blue-500/10",
  "Intégrations CRM": "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
  "API & Webhooks": "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
  "Analytiques": "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
};

export default function CaseStudies() {
  const reduced = useReducedMotion();

  return (
    <section className="py-24 px-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/30">
      <div className="max-w-7xl mx-auto w-full">
        <Reveal className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
            Cas d'usage <span className="text-gradient">concrets</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg font-medium">
            Exemples d'organisations qui centralisent leurs communications avec la plateforme.
          </p>
        </Reveal>

        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((uc, i) => (
            <Item key={i}>
              <motion.div
                whileHover={reduced ? undefined : { y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[32px] glass-panel-premium p-8 relative overflow-hidden group h-full"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${uc.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                      {uc.context}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-3">{uc.title}</h3>

                  <p className="text-[var(--text-secondary)] font-medium mb-6 leading-relaxed">{uc.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {uc.products.map((product, j) => (
                      <span key={j} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${productColors[product] || "text-[var(--text-secondary)] border-[var(--border-subtle)] bg-[var(--bg-surface)]"}`}>
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Item>
          ))}
        </Stagger>

        <Reveal className="text-center mt-12" delay={0.1}>
          <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors">
            Discusser votre cas d'usage avec notre équipe
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}