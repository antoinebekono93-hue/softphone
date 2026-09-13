"use client";

import { motion, useReducedMotion } from "motion/react";
import { Item, Reveal, Stagger } from "./motion";

export default function ProductShowcase() {
  const reduced = useReducedMotion();
  const lift = reduced ? undefined : { y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.12)" };

  return (
    <section id="features" className="py-24 px-4 max-w-7xl mx-auto w-full">
      <Reveal className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
          La puissance de l'IA. <br className="hidden md:block"/>
          <span className="text-gradient">La simplicité d'une app.</span>
        </h2>
        <p className="text-[var(--text-secondary)] text-lg font-medium">
          Une suite d'outils conçue pour vous faire gagner un temps précieux.
        </p>
      </Reveal>

      <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]" stagger={0.1}>
        {/* Card 1: Large (AI Transcription) */}
        <Item className="md:col-span-2">
          <motion.div
            whileHover={lift}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-[32px] glass-panel-premium p-8 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Transcriptions IA en direct</h3>
            <p className="text-[var(--text-secondary)] font-medium">Lisez la conversation avant même de décrocher ou générez des résumés d'appels automatiquement.</p>

            <motion.div
              animate={reduced ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[-20px] right-8 w-80 h-48 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/90 backdrop-blur-xl p-4 shadow-[0_10px_30px_rgba(255,87,87,0.1)]"
            >
              <div className="flex gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 text-[10px] font-bold border border-rose-500/30">IA</div>
                <div className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">"Bonjour, j'appelle concernant le devis pour le chantier de rénovation..."</div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-[10px] font-bold border border-orange-500/30">JD</div>
                <div className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">"Bien sûr, je peux vous aider. Quel est le numéro de référence ?"</div>
              </div>
            </motion.div>
          </motion.div>
        </Item>

        {/* Card 2: Medium (Global Numbers) */}
        <Item>
          <motion.div
            whileHover={lift}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-[32px] glass-panel-premium p-8 relative overflow-hidden group"
          >
            <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Présence Globale</h3>
            <p className="text-[var(--text-secondary)] mb-8 font-medium">Numéros locaux dans plus de 50 pays.</p>
            <div className="w-full aspect-square rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] flex items-center justify-center relative shadow-inner">
              <div className="absolute w-full h-full border border-orange-500 rounded-full animate-ping opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </div>
          </motion.div>
        </Item>

        {/* Card 3: Medium (Shared Inbox) */}
        <Item>
          <motion.div
            whileHover={lift}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-[32px] glass-panel-premium p-8 relative overflow-hidden group"
          >
            <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Boîte Partagée</h3>
            <p className="text-[var(--text-secondary)] font-medium">Collaborez sur les SMS et messages vocaux en équipe.</p>
            <div className="absolute bottom-8 left-8 flex -space-x-4">
              <div className="w-12 h-12 rounded-full border-2 border-[var(--bg-surface-solid)] bg-gradient-to-tr from-rose-400 to-orange-500 shadow-md"></div>
              <div className="w-12 h-12 rounded-full border-2 border-[var(--bg-surface-solid)] bg-gradient-to-tr from-violet-400 to-fuchsia-500 shadow-md"></div>
              <div className="w-12 h-12 rounded-full border-2 border-[var(--bg-surface-solid)] bg-[var(--bg-surface-solid)] backdrop-blur-md flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shadow-md">+3</div>
            </div>
          </motion.div>
        </Item>

        {/* Card 4: Medium (AI Call Analytics) */}
        <Item>
          <motion.div
            whileHover={lift}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-[32px] glass-panel-premium p-8 relative overflow-hidden group"
          >
            <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Analytics IA</h3>
            <p className="text-[var(--text-secondary)] font-medium">Analysez chaque appel pour améliorer vos performances.</p>
            <div className="absolute bottom-6 right-6 flex items-end gap-2">
              <motion.div
                animate={reduced ? undefined : { height: ["4rem", "6.5rem", "4rem"] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                className="w-8 h-16 rounded-md bg-rose-500/30"
              ></motion.div>
              <motion.div
                animate={reduced ? undefined : { height: ["6rem", "9rem", "6rem"] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="w-8 h-24 rounded-md bg-rose-500/50"
              ></motion.div>
              <motion.div
                animate={reduced ? undefined : { height: ["3rem", "5rem", "3rem"] }}
                transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="w-8 h-12 rounded-md bg-orange-500/30"
              ></motion.div>
              <motion.div
                animate={reduced ? undefined : { height: ["5rem", "7.5rem", "5rem"] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
                className="w-8 h-20 rounded-md bg-orange-500/50"
              ></motion.div>
            </div>
          </motion.div>
        </Item>

        {/* Card 5: Large (CRM Sync) */}
        <Item className="md:col-span-2">
          <motion.div
            whileHover={lift}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-[32px] glass-panel-premium p-8 relative overflow-hidden group"
          >
            <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Synchronisation CRM (Bientôt)</h3>
            <p className="text-[var(--text-secondary)] font-medium">Enregistrez vos appels directement dans HubSpot et Salesforce sans aucun effort manuel.</p>
            <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-tl from-rose-500/10 to-transparent"></div>
          </motion.div>
        </Item>
      </Stagger>
    </section>
  );
}