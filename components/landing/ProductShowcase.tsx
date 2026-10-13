"use client";

import { motion, useReducedMotion } from "motion/react";
import { Item, Reveal, Stagger } from "./motion";

export default function ProductShowcase() {
  const reduced = useReducedMotion();
  const lift = reduced ? undefined : { y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.12)" };

  return (
    <section id="features" className="landing-section landing-container max-w-7xl mx-auto w-full">
      <Reveal className="landing-section-heading text-center">
        <h2 className="landing-heading landing-heading-large font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
          La puissance de l&apos;IA. <br className="hidden md:block"/>
          <span className="text-gradient">La simplicité d&apos;une app.</span>
        </h2>
        <p className="text-[var(--text-secondary)] landing-body font-medium">
          Une suite d&apos;outils conçue pour vous faire gagner un temps précieux.
        </p>
      </Reveal>

      <Stagger className="landing-grid landing-feature-grid" stagger={0.1}>
        {/* Card 1: Large (AI Transcription) */}
        <Item className="landing-feature-wide">
          <motion.div
            whileHover={lift}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full landing-card glass-panel-premium relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h3 className="landing-card-heading font-bold mb-2 text-[var(--text-primary)]">Transcriptions IA en direct</h3>
            <p className="text-[var(--text-secondary)] font-medium">Lisez la conversation avant même de décrocher ou générez des résumés d&apos;appels automatiquement.</p>

            <motion.div
              animate={reduced ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="landing-transcript relative mt-5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] p-4 shadow-[0_10px_30px_rgba(34,211,238,0.1)]"
            >
              <div className="flex gap-3 mb-3">
                <div className="w-6 h-6 shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500 text-xs font-bold border border-cyan-500/30">IA</div>
                <div className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">&quot;Bonjour, j&apos;appelle concernant le devis pour le chantier de rénovation...&quot;</div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 shrink-0 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-500 text-xs font-bold border border-violet-500/30">JD</div>
                <div className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">&quot;Bien sûr, je peux vous aider. Quel est le numéro de référence ?&quot;</div>
              </div>
            </motion.div>
          </motion.div>
        </Item>

        {/* Card 2: Medium (Global Numbers) */}
        <Item>
          <motion.div
            whileHover={lift}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full landing-card glass-panel-premium relative overflow-hidden group"
          >
            <h3 className="landing-card-heading font-bold mb-2 text-[var(--text-primary)]">Présence Globale</h3>
            <p className="text-[var(--text-secondary)] mb-8 font-medium">Numéros locaux dans plus de 50 pays.</p>
            <div className="landing-globe aspect-square rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] flex items-center justify-center relative shadow-inner">
              <div className="absolute w-full h-full border border-violet-500 rounded-full animate-ping opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </div>
          </motion.div>
        </Item>

        {/* Card 3: Medium (Shared Inbox) */}
        <Item>
          <motion.div
            whileHover={lift}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full landing-card glass-panel-premium relative overflow-hidden group"
          >
            <h3 className="landing-card-heading font-bold mb-2 text-[var(--text-primary)]">Boîte Partagée</h3>
            <p className="text-[var(--text-secondary)] font-medium">Collaborez sur les SMS et messages vocaux en équipe.</p>
            <div className="relative mt-6 flex -space-x-4">
              <div className="w-12 h-12 rounded-full border-2 border-[var(--bg-surface-solid)] bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-md"></div>
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
            className="h-full landing-card glass-panel-premium relative overflow-hidden group"
          >
            <h3 className="landing-card-heading font-bold mb-2 text-[var(--text-primary)]">Analytics IA</h3>
            <p className="text-[var(--text-secondary)] font-medium">Analysez chaque appel pour améliorer vos performances.</p>
            <div className="landing-chart relative flex items-end justify-end gap-2">
              <motion.div
                animate={reduced ? undefined : { scaleY: [1, 1.625, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                className="w-8 h-16 origin-bottom rounded-md bg-cyan-500/30"
              ></motion.div>
              <motion.div
                animate={reduced ? undefined : { scaleY: [1, 1.5, 1] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="w-8 h-24 origin-bottom rounded-md bg-cyan-500/50"
              ></motion.div>
              <motion.div
                animate={reduced ? undefined : { scaleY: [1, 1.667, 1] }}
                transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="w-8 h-12 origin-bottom rounded-md bg-blue-500/30"
              ></motion.div>
              <motion.div
                animate={reduced ? undefined : { scaleY: [1, 1.5, 1] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
                className="w-8 h-20 origin-bottom rounded-md bg-blue-500/50"
              ></motion.div>
            </div>
          </motion.div>
        </Item>

        {/* Card 5: Large (CRM Sync) */}
        <Item className="landing-feature-wide">
          <motion.div
            whileHover={lift}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full landing-card glass-panel-premium relative overflow-hidden group"
          >
<h3 className="landing-card-heading font-bold mb-2 text-[var(--text-primary)]">Interopérabilité (webhooks)</h3>
             <p className="text-[var(--text-secondary)] font-medium">Transmettez les appels, transcriptions et événements de la plateforme vers votre propre système via des webhooks sortants authentifiés.</p>
            <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-tl from-cyan-500/10 to-transparent"></div>
          </motion.div>
        </Item>
      </Stagger>
    </section>
  );
}
