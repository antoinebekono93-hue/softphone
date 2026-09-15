"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { WordReveal } from "./motion";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function FinalCTA() {
  const reduced = useReducedMotion();

  return (
    <section className="py-32 px-4 max-w-7xl mx-auto w-full text-center relative overflow-hidden">
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10"
        animate={reduced ? { opacity: 0.4 } : { opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.h2
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-[var(--text-primary)]"
      >
        <WordReveal text="Prêt à moderniser" delay={0.05} />
        <br />
        <span className="n8n-gradient-text">
          <WordReveal text="votre téléphonie ?" delay={0.25} />
        </span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: reduced ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
        className="text-xl text-[var(--text-secondary)] mb-12 font-medium"
      >
        Déployable en 2 minutes. Sans engagement.
      </motion.p>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.7 } } }}
        className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-10"
      >
        {[
          <Link key="1" href="/register" className="inline-flex text-lg font-semibold n8n-gradient-bg text-white px-10 py-5 rounded-full shadow-lg shadow-cyan-500/30 hover:scale-105 transition-all items-center gap-2">
            Commencer l'essai gratuit de 14 jours <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>,
          <Link key="2" href="/pricing" className="inline-flex text-lg font-semibold text-[var(--text-primary)] bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] px-10 py-5 rounded-full transition-all items-center gap-2">
            Voir les tarifs
          </Link>,
          <Link key="3" href="/register" className="inline-flex text-lg font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-5 rounded-full transition-colors items-center gap-2">
            Parler à un expert
          </Link>,
        ].map((node, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: reduced ? 0 : 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}>
            {node}
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 1.0 }}
        className="text-sm font-medium text-[var(--text-secondary)]"
      >
        Essai gratuit 14 jours · Aucune carte bancaire requise · Sans engagement
      </motion.p>
    </section>
  );
}