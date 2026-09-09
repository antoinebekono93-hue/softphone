"use client";

import { useState } from "react";
import Link from "next/link";

const industries = [
  {
    id: "immobilier",
    label: "Immobilier & BTP",
    color: "text-orange-500",
    border: "border-orange-500/50",
    bg: "bg-orange-500/10",
    title: "Des communications adaptées aux chantiers et aux agences",
    description: "Connectez vos équipes terrain, gérez les appels de devis et suivez chaque prospect sans perdre une occasion.",
    metrics: [
      { value: "42%", label: "Augmentation des rendez-vous qualifiés" },
      { value: "24/7", label: "Répondeur IA pour les appels hors horaires" }
    ]
  },
  {
    id: "finance",
    label: "Services Financiers",
    color: "text-emerald-500",
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/10",
    title: "Sécurisez les communications de vos clients",
    description: "Conformité RGPD, enregistrements cryptés et traçabilité totale de chaque interaction client.",
    metrics: [
      { value: "57%", label: "Augmentation de la satisfaction employé" },
      { value: "100%", label: "Appels enregistrés et conformes" }
    ]
  },
  {
    id: "sante",
    label: "Santé",
    color: "text-rose-500",
    border: "border-rose-500/50",
    bg: "bg-rose-500/10",
    title: "Coordonnez les soins et prenez soin de vos patients",
    description: "Télémédecine, alertes, coordination entre soignants : une communication fluide et sécurisée.",
    metrics: [
      { value: "76%", label: "Résolution au premier contact" },
      { value: "24/7", label: "Répondeur IA pour patient" }
    ]
  },
  {
    id: "retail",
    label: "Retail & E-commerce",
    color: "text-violet-500",
    border: "border-violet-500/50",
    bg: "bg-violet-500/10",
    title: "Offrez une expérience client unique à chaque interaction",
    description: "Suivi de commandes, service client multi-canal, promotions ciblées : le tout en un seul outil.",
    metrics: [
      { value: "53%", label: "Augmentation de la satisfaction client" },
      { value: "30%", label: "Recommandation NPS en plus" }
    ]
  },
  {
    id: "tech",
    label: "Tech & SaaS",
    color: "text-cyan-500",
    border: "border-cyan-500/50",
    bg: "bg-cyan-500/10",
    title: "Support multi-canal et intégrations pour les équipes produit",
    description: "Connectez votre softphone à votre CRM, votre support et vos outils internes pour une productivité maximale.",
    metrics: [
      { value: "500+", label: "Intégrations disponibles" },
      { value: "2min", label: "Temps de déploiement" }
    ]
  }
];

export default function IndustrySolutions() {
  const [active, setActive] = useState("immobilier");
  const current = industries.find((i) => i.id === active)!;

  return (
    <section className="py-24 px-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/30">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
            Des solutions pour <span className="text-gradient">chaque secteur</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg font-medium">
            Communiquez mieux avec vos clients, quel que soit votre domaine.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {industries.map((industry) => (
            <button
              key={industry.id}
              onClick={() => setActive(industry.id)}
              className={`px-5 py-3 rounded-full text-sm font-semibold transition-all ${
                active === industry.id
                  ? `${industry.bg} ${industry.color} border ${industry.border}`
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]"
              }`}
            >
              {industry.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div key={active} className="animate-fade-in-scale rounded-[32px] glass-panel-premium p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className={`text-2xl md:text-3xl font-bold mb-4 ${current.color} text-[var(--text-primary)]`}>
                {current.title}
              </h3>
              <p className="text-[var(--text-secondary)] text-lg font-medium mb-8">
                {current.description}
              </p>
              <div className="grid grid-cols-2 gap-6">
                {current.metrics.map((metric, i) => (
                  <div key={i}>
                    <div className="text-4xl font-extrabold n8n-gradient-text">{metric.value}</div>
                    <div className="text-sm font-medium text-[var(--text-secondary)] mt-2">{metric.label}</div>
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className={`inline-flex mt-8 items-center gap-2 text-sm font-semibold ${current.color} hover:opacity-80 transition-opacity`}
              >
                Découvrir pour votre secteur
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/40 p-10 aspect-square flex items-center justify-center relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${current.bg} opacity-20`}></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={`${current.color}`}>
                  <rect width="18" height="18" x="3" y="3" rx="4"/><path d="M12 3v18"/><path d="M3 12h18"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
