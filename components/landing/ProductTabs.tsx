"use client";

import { useState } from "react";

const tabs = [
  {
    id: "sales",
    label: "Équipes Commerciales",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/50",
    gradient: "from-orange-500/10",
    title: "Multipliez vos ventes avec un outil conçu pour la vélocité",
    description: "Ne perdez plus aucune trace de vos appels de prospection. Automatisez vos démarches et concentrez-vous sur la conclusion.",
    features: [
      "Enregistrement automatique dans le CRM",
      "Statistiques d'appels en temps réel",
      "Numéroteur WebRTC ultra-rapide",
      "Campagnes outbound IA automatisées"
    ]
  },
  {
    id: "support",
    label: "Support Client",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><path d="M14.05 2a9 9 0 0 1 8 7.94"/><path d="M14.05 6A5 5 0 0 1 18 10"/></svg>
    ),
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/50",
    gradient: "from-rose-500/10",
    title: "Offrez une expérience client exceptionnelle à chaque appel",
    description: "Gérez vos flux d'appels de manière collaborative et résolvez les demandes plus vite avec l'IA.",
    features: [
      "Boîte de réception partagée (Voicemails & SMS)",
      "Transcription IA des messages vocaux",
      "Routage intelligent des appels",
      "Répondeur IA 24/7"
    ]
  },
  {
    id: "ai",
    label: "IA Vocale",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
    ),
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/50",
    gradient: "from-violet-500/10",
    title: "L'IA qui écoute, comprend et agit à votre place",
    description: "Des agents vocaux autonomes qui automatisent, assistent et analysent chaque interaction client en temps réel.",
    features: [
      "Transcriptions en direct pendant l'appel",
      "Résumés d'appels générés automatiquement",
      "Analyse de sentiment et coaching",
      "Agents vocaux autonomes"
    ]
  },
  {
    id: "integrations",
    label: "Intégrations",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
    ),
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/50",
    gradient: "from-emerald-500/10",
    title: "S'intègre avec votre écosystème actuel",
    description: "Connectez Antigravity aux outils que vos équipes utilisent déjà. Plus de 500 intégrations pré-construites.",
    features: [
      "HubSpot, Salesforce, Zendesk",
      "API ouvertes et webhooks",
      "Sync CRM bidirectionnelle",
      "Plugins et extensions"
    ]
  }
];

export default function ProductTabs() {
  const [active, setActive] = useState("sales");
  const current = tabs.find((t) => t.id === active)!;

  return (
    <section id="solutions" className="py-24 px-4 max-w-7xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
          Une plateforme pensée pour <span className="text-gradient">chaque métier.</span>
        </h2>
        <p className="text-[var(--text-secondary)] text-lg font-medium">
          Répondez aux besoins spécifiques de vos équipes avec des solutions dédiées.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all ${
              active === tab.id
                ? `${tab.bg} ${tab.color} border ${tab.border} shadow-sm`
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] bg-transparent hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <span className={active === tab.id ? tab.color : ""}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div key={active} className="animate-fade-in-scale rounded-[32px] glass-panel-premium p-8 md:p-12 relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${current.gradient} to-transparent pointer-events-none`}></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
          <div>
            <h3 className={`text-2xl md:text-3xl font-bold mb-4 text-[var(--text-primary)] ${current.color}`}>
              {current.title}
            </h3>
            <p className="text-[var(--text-secondary)] text-lg font-medium mb-8">
              {current.description}
            </p>
            <ul className="space-y-3">
              {current.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]">
                  <span className={`${current.color}`}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href="/register"
              className={`inline-flex mt-8 items-center gap-2 text-sm font-semibold ${current.color} hover:opacity-80 transition-opacity`}
            >
              Essayer maintenant
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
          <div className="hidden md:flex items-center justify-center">
            {/* Visual placeholder */}
            <div className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/40 p-6 space-y-4">
              {current.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
                  <div className={`w-8 h-8 rounded-lg ${current.bg} flex items-center justify-center ${current.color}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
