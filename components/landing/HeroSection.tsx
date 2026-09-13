"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { WordReveal } from "./motion";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroSection() {
  const reduced = useReducedMotion();

  return (
    <main className="flex-1 flex flex-col items-center text-center px-4 pt-32 pb-20 relative overflow-hidden">
      {/* Glow de fond animé */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rose-500/20 blur-[120px] rounded-full pointer-events-none -z-10"
        animate={
          reduced
            ? { opacity: 0.6 }
            : { opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-orange-500/20 blur-[100px] rounded-full pointer-events-none -z-10"
        animate={
          reduced
            ? { opacity: 0.4 }
            : { opacity: [0.3, 0.7, 0.3], scale: [1, 1.15, 1] }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05, ease: EASE }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 mb-8 shadow-sm"
      >
        <span className="font-bold">Nouveau :</span>
        <span>Plateforme IA Vocal Agentic en ligne</span>
      </motion.div>

      {/* H1 dévoilé mot à mot */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-5xl md:text-[5.5rem] font-extrabold tracking-tight mb-6 max-w-4xl leading-[1.05] text-[var(--text-primary)]"
      >
        <WordReveal text="Le Softphone IA qui révolutionne votre" delay={0.1} />
        <span className="n8n-gradient-text">
          <WordReveal text="relation client." delay={0.42} />
        </span>
      </motion.h1>

      {/* Sous-titre */}
      <motion.p
        initial={{ opacity: 0, y: reduced ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
        className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 font-normal leading-relaxed"
      >
        Rejoignez plus de <span className="font-bold text-[var(--text-primary)]">10 000 entreprises</span> qui font confiance à Antigravity pour leurs communications vocales pilotées par l'IA.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.72 } } }}
        className="flex flex-col sm:flex-row gap-4 items-center mb-10"
      >
        {[
          <Link key="cta1" href="/register" className="text-base font-semibold n8n-gradient-bg text-white px-8 py-4 rounded-full shadow-lg shadow-rose-500/30 hover:scale-105 transition-all flex items-center gap-2">
            Essai gratuit 14 jours <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>,
          <Link key="cta2" href="/pricing" className="text-base font-semibold text-[var(--text-primary)] bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] px-8 py-4 rounded-full transition-all flex items-center gap-2">
            Voir les tarifs
          </Link>,
          <Link key="cta3" href="/register" className="text-base font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-4 rounded-full transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Parler à un expert
          </Link>,
        ].map((node, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: reduced ? 0 : 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}>
            {node}
          </motion.div>
        ))}
      </motion.div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.0, ease: EASE }}
        className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-[var(--text-secondary)] mb-16"
      >
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>99,99% Disponibilité</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Déploiement en 2 minutes</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Sans carte bancaire requise</span>
      </motion.div>

      {/* Hero Visual Mockup */}
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 48, scale: reduced ? 1 : 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 1.05, ease: EASE }}
        className="w-full max-w-5xl relative mt-4"
      >
        <div className="rounded-3xl bg-[#f3f4f6] p-4 md:p-8 overflow-hidden relative">
          <div className="rounded-xl bg-white shadow-2xl overflow-hidden border border-gray-200">
            {/* MacOS / Browser Header */}
            <div className="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-4">
              <div className="flex items-center gap-2 w-1/3">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              </div>
              <div className="w-1/3 flex justify-center">
                <div className="bg-gray-100 rounded-md text-xs text-gray-500 py-1.5 px-4 font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  app.antigravity.fr
                </div>
              </div>
              <div className="w-1/3 flex justify-end gap-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
              </div>
            </div>

            {/* Fake Dashboard Inner Content */}
            <div className="aspect-[21/9] md:aspect-[16/9] flex items-center justify-center relative bg-[#fafafa]">
              {/* Fake Softphone UI */}
              <div className="w-80 h-[80%] rounded-2xl border border-[var(--border-subtle)] bg-white shadow-lg relative z-0 flex flex-col p-6 overflow-hidden mt-8">
                <div className="w-full flex justify-between items-center mb-8">
                  <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">Appel en cours</div>
                  <div className="text-emerald-500 text-xs font-mono font-bold">04:12</div>
                </div>
                <div className="w-24 h-24 rounded-full bg-black mx-auto flex items-center justify-center text-3xl font-bold mb-4 text-white">
                  JD
                </div>
                <div className="text-2xl text-center font-bold text-[var(--text-primary)] mb-1">Jean Dupont</div>
                <div className="text-[var(--text-secondary)] text-center text-sm font-medium mb-12">Entreprise BTP S.A.</div>

                <div className="flex justify-center gap-6 mt-auto">
                  <div className="w-14 h-14 rounded-full bg-white border border-[var(--border-subtle)] flex items-center justify-center shadow-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-primary)]"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-rose-500 shadow-sm flex items-center justify-center text-white">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" x2="1" y1="1" y2="23"></line></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}