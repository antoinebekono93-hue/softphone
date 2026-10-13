"use client";

import { useState } from "react";
import Link from "next/link";

const industries = [
  {
    id: "immobilier",
    label: "Immobilier & BTP",
    color: "text-blue-500",
    border: "border-blue-500/50",
    bg: "bg-blue-500/10",
    title: "Des communications adaptées aux chantiers et aux agences",
    description: "Connectez vos équipes terrain, gémez les appels de devis et suivez chaque prospect sans perdre une occasion.",
    points: [
      "Un numéro professionnel par commercial",
      "Agent vocal pour les appels hors horaires",
      "Transfert et mise en attente entre agences"
    ]
  },
  {
    id: "finance",
    label: "Services Financiers",
    color: "text-emerald-500",
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/10",
    title: "Tracez chaque échange avec vos clients",
    description: "Historique des appels, transcriptions et export des données, avec les règles de conservation que vous définissez.",
    points: [
      "Journal des appels et transcriptions",
      "Règles de conservation configurables",
      "Webhooks pour vos syst\u00e8mes de traitement interne"
    ]
  },
  {
    id: "sante",
    label: "Santé",
    color: "text-cyan-500",
    border: "border-cyan-500/50",
    bg: "bg-cyan-500/10",
    title: "Organisez les appels et les rendez-vous",
    description: "Prise de rendez-vous, transfert vers le bon service et traçabilité des échanges entrants.",
    points: [
      "Prise de rendez-vous automatisée",
      "Transfert vers le service concerné",
      "Historique consultable par l'équipe"
    ]
  },
  {
    id: "retail",
    label: "Retail & E-commerce",
    color: "text-violet-500",
    border: "border-violet-500/50",
    bg: "bg-violet-500/10",
    title: "Un canal vocal rattaché à vos commandes",
    description: "Suivi de commandes, questions SAV et demandes de retour dans la même boîte de réception que vos autres canaux.",
    points: [
      "Appels, SMS et WhatsApp au même endroit",
      "Agent vocal pour les demandes répétitives",
      "Rattachement des échanges à la fiche client"
    ]
  },
  {
    id: "tech",
    label: "Tech & SaaS",
    color: "text-cyan-500",
    border: "border-cyan-500/50",
    bg: "bg-cyan-500/10",
    title: "Support vocal et intégrations pour vos équipes produit",
    description: "Buster Call dans le navigateur, espace de travail installable et webhooks pour relier vos propres outils.",
    points: [
      "Buster Call web, mobile et desktop",
      "Webhooks sortants authentifiés",
      "Import de documents pour les agents"
    ]
  }
];

export default function IndustrySolutions() {
  const [active, setActive] = useState("immobilier");
  const current = industries.find((i) => i.id === active)!;

  return (
    <section className="landing-section landing-container border-t border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/30">
      <div className="max-w-7xl mx-auto w-full">
        <div className="landing-section-heading text-center">
          <h2 className="landing-heading font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
            Des solutions pour <span className="text-gradient">chaque secteur</span>
          </h2>
          <p className="text-[var(--text-secondary)] landing-body font-medium">
            Communiquez mieux avec vos clients, quel que soit votre domaine.
          </p>
        </div>

        {/* Tabs */}
        <div className="landing-selectors">
          {industries.map((industry) => (
            <button
              key={industry.id}
              onClick={() => setActive(industry.id)}
              aria-pressed={active === industry.id}
              aria-controls="IndustrySolutions-content"
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
        <div
          key={active}
          id="IndustrySolutions-content"
          className="reveal landing-card landing-panel glass-panel-premium"
        >
          <div className="landing-panel-grid items-center">
            <div>
              <h3 className={`landing-card-heading font-bold mb-4 ${current.color} text-[var(--text-primary)]`}>
                {current.title}
              </h3>
              <p className="text-[var(--text-secondary)] landing-body font-medium mb-8">
                {current.description}
              </p>
<ul className="grid grid-cols-1 gap-4">
                 {current.points.map((point, i) => (
                   <li key={i} className="flex items-start gap-2 text-sm font-medium text-[var(--text-secondary)]">
                     <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${current.color.replace("text-", "bg-")}`} />
                     <span>{point}</span>
                   </li>
                 ))}
               </ul>
              <Link
                href="/register"
                className={`inline-flex mt-8 items-center gap-2 text-sm font-semibold ${current.color} hover:opacity-80 transition-opacity`}
              >
                Découvrir pour votre secteur
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            </div>
            <div className="landing-panel-visual">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/40 p-6 sm:p-10 aspect-square flex items-center justify-center relative overflow-hidden">
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
