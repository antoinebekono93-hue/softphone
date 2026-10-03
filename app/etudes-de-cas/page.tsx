import Link from "next/link";
import { MarketingLayout, PageHero, SectionHeading } from "@/components/marketing";
import { FinalCTA } from "@/components/landing";

export const metadata = {
  title: "Scénarios d'usage | Antigravity",
  description:
    "Exemples illustratifs d'organisations qui centralisent leurs appels, leurs numéros et leurs agents vocaux IA avec un softphone web.",
};

const scenarios = [
  {
    sector: "Agences & retail",
    solution: "Softphone & numéros",
    title: "Donner un numéro professionnel à chaque collaborateur",
    description:
      "Une chaîne d'agences attribue un numéro à chacun de ses conseillers. Les appels entrants et sortants sont Handling dans un même softphone, avec un historique partagé par équipe.",
    steps: [
      "Attribution d'un numéro professionnel par utilisateur",
      "Softphone web, mobile et desktop sur le même compte",
      "Transfert d'appel et mise en attente entre collègues",
    ],
  },
  {
    sector: "Services client",
    solution: "Agent vocal IA",
    title: "Qualifier les appels hors horaires d'ouverture",
    description:
      "Un agent vocal IA décroche en dehors des horaires planifiés, qualifie le motif de l'appel et transfère vers le bon interlocuteur, ou propose un rappel.",
    steps: [
      "Décrochage et qualification automatique",
      "Transfert vers un humain ou rappel programmé",
      "Transcription et résumé de l'échange",
    ],
  },
  {
    sector: "Équipes terrain",
    solution: "Softphone PWA",
    title: "Rester joignable depuis un seul numéro",
    description:
      "Les équipes mobiles utilisent le même numéro professionnel depuis un navigateur ou une application installable, sans configuration de routage supplémentaire par poste.",
    steps: [
      "Installation de l'application sur le téléphone",
      "Même numéro sur mobile, navigateur et desktop",
      "Appels internes illimités entre utilisateurs de l'organisation",
    ],
  },
  {
    sector: "Pilotage & CRM",
    solution: "Intégrations & API",
    title: "Rattacher chaque échange au bon contact",
    description:
      "Appels, SMS et historiques sont rattachés à la même fiche contact dans le CRM, et exposés via API et webhooks pour les workflows internes.",
    steps: [
      "Appels et SMS rattachés à la fiche contact",
      "API et webhooks pour les workflows internes",
      "Analytiques d'appels et rapports d'activité",
    ],
  },
];

export default function CaseStudiesPage() {
  return (
    <MarketingLayout>
      <PageHero
        badge="Scénarios d'usage"
        accent="cyan"
        title={
          <>
            Des situations concrètes <span className="n8n-gradient-text">que la plateforme adresse</span>
          </>
        }
        subtitle="Voici des scénarios d'usage types, описants comment une organisation peut centraliser ses communications avec Antigravity."
      >
        <Link href="/register" className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-cyan-500/25 hover:scale-105 transition-transform">
          Créer un compte
        </Link>
        <Link href="/pricing" className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors">
          Voir les tarifs
        </Link>
      </PageHero>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4 mb-12">
          <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
            Ces scénarios sont des <span className="font-bold text-[var(--text-primary)]">exemples illustratifs</span>{" "}
            décrivant des usages possibles de la plateforme. Ils ne constituent pas des témoignages clients
            ni des résultats garantis, et aucune entreprise n'est citée.
          </p>
        </div>

        <SectionHeading
          title="Explorer les scénarios"
          subtitle="Chaque scénario décrit un point de départ et les étapes typiques de mise en œuvre."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {scenarios.map((scenario) => (
            <article
              key={scenario.title}
              className="rounded-[32px] glass-panel-premium p-8 h-full flex flex-col gap-4"
            >
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                  {scenario.solution}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] text-[var(--text-secondary)]">
                  {scenario.sector}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">{scenario.title}</h2>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed">{scenario.description}</p>
              <ul className="mt-2 flex flex-col gap-2">
                {scenario.steps.map((step) => (
                  <li key={step} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24 pt-8">
        <FinalCTA />
      </section>
    </MarketingLayout>
  );
}