"use client";

import { Reveal } from "./motion";

const pillars = [
  "Téléphonie Cloud B2B",
  "Softphone Web & Mobile (PWA)",
  "Routage d'Appels Intelligent",
  "Agents Vocaux IA 24/7",
  "Chiffrement TLS / SRTP",
  "Intégrations CRM & Helpdesk",
  "Appels Internes App-to-App",
  "Analytiques et Transcripts"
];

export default function TrustBar() {
  return (
    <section className="py-12 border-y border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/20 overflow-hidden">
      <Reveal className="text-center text-xs font-bold tracking-[0.2em] text-[var(--text-secondary)] uppercase mb-8" y={8}>
        Architecture et capacités de la plateforme
      </Reveal>

      {/* Row - scrolling left */}
      <div className="relative w-full flex overflow-hidden">
        <div className="absolute left-0 w-32 h-full bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10"></div>
        <div className="absolute right-0 w-32 h-full bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10"></div>
        <div className="flex w-[200%] animate-marquee opacity-60 hover:opacity-100 transition-opacity duration-500">
          {[...pillars, ...pillars].map((pillar, i) => (
            <div key={i} className="flex-1 flex justify-center items-center text-base font-bold mx-6 text-[var(--text-primary)] whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-3"></span>
              {pillar}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
