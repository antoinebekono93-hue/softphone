import Link from "next/link";
import type { CSSProperties } from "react";

type CssVars = CSSProperties & Record<`--${string}`, string | number>;

export default function HeroSection() {
  return (
    <main className="flex-1 flex flex-col items-center text-center px-4 pt-24 pb-12 md:pt-32 md:pb-20 relative overflow-hidden">
      {/* Dégradé statique : aucun filtre animé pendant le défilement */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[400px] pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_70%)]"
      />

      {/* Badge */}
      <div
        className="reveal inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs text-cyan-400 mb-8 shadow-sm"
        style={{ "--reveal-delay": "0.05s" } as CssVars}
      >
        <span className="font-bold">Nouveau :</span>
        <span>Plateforme IA Vocal Agentic en ligne</span>
      </div>

      {/* Titre visible dès le HTML initial */}
      <h1 className="relative text-[clamp(2rem,8vw,3rem)] md:text-[5.5rem] font-extrabold tracking-tight mb-6 max-w-4xl leading-[1.08] text-balance text-[var(--text-primary)]">
        Buster Call — Le système télécom qui révolutionne votre{" "}
        <span className="n8n-gradient-text">relation client.</span>
      </h1>

      {/* Sous-titre */}
      <p
        className="reveal text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 font-normal leading-relaxed"
        style={{ "--reveal-delay": "0.6s" } as CssVars}
      >
        Une plateforme pour centraliser vos appels, vos numéros professionnels et vos agents vocaux IA dans Buster Call.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 items-center mb-10">
        {[
          <Link key="cta1" href="/register" className="text-base font-semibold n8n-gradient-bg text-white px-8 py-4 rounded-full shadow-lg shadow-cyan-500/30 hover:scale-105 transition-all flex items-center gap-2">
            Créer un compte <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>,
          <Link key="cta2" href="/pricing" className="text-base font-semibold text-[var(--text-primary)] bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] px-8 py-4 rounded-full transition-all flex items-center gap-2">
            Voir les tarifs
          </Link>,
          <Link key="cta3" href="/register" className="text-base font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-4 rounded-full transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Parler à un expert
          </Link>,
        ].map((node, i) => (
          <div key={i} className="reveal" style={{ "--reveal-delay": `${0.72 + i * 0.1}s` } as CssVars}>
            {node}
          </div>
        ))}
      </div>

      {/* Trust badges */}
      <div
        className="reveal flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-[var(--text-secondary)] mb-16"
        style={{ "--reveal-delay": "1s" } as CssVars}
      >
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Buster Call web, mobile et desktop</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Numéros professionnels par utilisateur</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Appels internes illimités entre utilisateurs (app-to-app)</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Sans carte bancaire pour créer un compte</span>
      </div>

      {/* Hero Visual Mockup */}
      <div
        className="reveal w-full max-w-5xl relative mt-4"
        style={{ "--reveal-delay": "1.05s", "--reveal-y": "48px" } as CssVars}
      >
        <div className="rounded-3xl bg-[var(--bg-surface-hover)] p-4 md:p-8 overflow-hidden relative">
          <div className="rounded-xl bg-[var(--bg-surface-solid)] shadow-2xl overflow-hidden border border-[var(--border-subtle)]">
            {/* MacOS / Browser Header */}
            <div className="h-12 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between px-4">
              <div className="flex items-center gap-2 w-1/3">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              </div>
              <div className="w-1/3 flex justify-center">
                <div className="bg-[var(--bg-surface-hover)] rounded-md text-xs text-[var(--text-secondary)] py-1.5 px-4 font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  app.bustercall.fr
                </div>
              </div>
              <div className="w-1/3 flex justify-end gap-3 text-[var(--text-secondary)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
              </div>
            </div>

            {/* Fake Dashboard Inner Content */}
            <div className="py-6 px-3 md:py-0 md:px-0 md:aspect-[16/9] flex items-center justify-center relative bg-[var(--bg-base)]">
              {/* Fake Softphone UI */}
              <div className="w-full max-w-80 md:h-[80%] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] shadow-lg relative z-0 flex flex-col p-5 md:p-6 overflow-hidden md:mt-8">
                <div className="w-full flex justify-between items-center mb-8">
                  <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">Appel en cours</div>
                  <div className="text-emerald-500 text-xs font-mono font-bold">04:12</div>
                </div>
                <div className="w-24 h-24 rounded-full bg-[var(--bg-elevated)] mx-auto flex items-center justify-center text-3xl font-bold mb-4 text-[var(--text-primary)]">
                  JD
                </div>
                <div className="text-2xl text-center font-bold text-[var(--text-primary)] mb-1">Jean Dupont</div>
                <div className="text-[var(--text-secondary)] text-center text-sm font-medium mb-12">Entreprise BTP S.A.</div>

                <div className="flex justify-center gap-6 mt-auto">
                  <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] flex items-center justify-center shadow-sm">
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
      </div>
    </main>
  );
}
