import Link from "next/link";
import { MarketingLayout, PageHero, SectionHeading, InteractiveTabs } from "@/components/marketing";
import { TrustBar, FinalCTA } from "@/components/landing";

export const metadata = {
  title: "Solutions par secteur | Antigravity",
  description:
    "Répondeur IA, téléphonie et IA vocale adaptés à votre métier : santé, juridique, immobilier, hôtellerie, commerce, finance, logistique. Découvrez les cas d'usage de votre secteur.",
};

function SectorBlock({ intro, points, stats }: { intro: string; points: string[]; stats: { value: string; label: string }[] }) {
  return (
    <div className="rounded-[24px] glass-panel-premium p-8 grid md:grid-cols-2 gap-8">
      <div>
        <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">{intro}</p>
        <ul className="space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-sm font-bold text-[var(--text-primary)]">
              <span className="w-6 h-6 rounded-full n8n-gradient-bg flex items-center justify-center text-white text-xs mt-0.5">✓</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] p-6 flex flex-col justify-center gap-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-5xl font-extrabold n8n-gradient-text">{s.value}</div>
            <div className="text-sm font-bold text-[var(--text-secondary)] mt-2 leading-snug">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const sectors = [
  {
    id: "sante",
    label: "Santé",
    content: (
      <SectorBlock
        intro="Stands saturés, rendez-vous perdus, patients qui attendent au lieu d'être appelés. Le répondeur IA prend en charge les demandes de rendez-vous, les rappels et les renouvellements, en toute conformité."
        points={[
          "Prise de rendez-vous autonome 24/7",
          "Rappels de consultation automatiques",
          "Anonymisation RGPD des échanges",
          "Remontée des urgences vers le secrétariat",
        ]}
        stats={[
          { value: "−60%", label: "de charge du standard" },
          { value: "9,4/10", label: "de satisfaction patients" },
        ]}
      />
    ),
  },
  {
    id: "juridique",
    label: "Juridique",
    content: (
      <SectorBlock
        intro="Chaque appel non traité est une consultation ou un cabinet perdu. L'IA qualifie les demandes, protège la confidentialité des échanges et prépare un compte rendu complet pour l'avocat."
        points={[
          "Qualification des consultations par besoin",
          "Prise de rendez-vous secrétariat automatisée",
          "Transcriptions confidentielles chiffrées",
          "Suivi des dossiers sans courriels perdus",
        ]}
        stats={[
          { value: "+68%", label: "de consultations réservées" },
          { value: "3 h", label: "économisées par avocat / semaine" },
        ]}
      />
    ),
  },
  {
    id: "immobilier",
    label: "Immobilier",
    content: (
      <SectorBlock
        intro="Les prospects visitent le samedi et appellent le dimanche soir. L'IA capte chaque appel, qualifie le budget et la localisation, planifie les visites et rappelle les non-joignables."
        points={[
          "Qualification des leads hors horaires",
          "Planification des visites synchronisée",
          "Relances automatiques des prospects",
          "Synchro CRM / outils agence",
        ]}
        stats={[
          { value: "+2,6x", label: "de visites programmées" },
          { value: "58%", label: "de leads qualifiés la nuit" },
        ]}
      />
    ),
  },
  {
    id: "hotellerie",
    label: "Hôtellerie",
    content: (
      <SectorBlock
        intro="La réservation directe est le canal le plus rentable — et le plus souvent perdu. L'IA prend les réservations 24/7, gère les demandes spéciales et synchronise votre PMS."
        points={[
          "Réservations directes 24/7",
          "Gestion des demandes spéciales",
          "Réponses aux FAQ de l'établissement",
          "Sync PMS (Mews, cloud, etc.)",
        ]}
        stats={[
          { value: "+19%", label: "de réservations directes" },
          { value: "€12k", label: "de commissions économisées /mois" },
        ]}
      />
    ),
  },
  {
    id: "commerce",
    label: "Commerce & E-commerce",
    content: (
      <SectorBlock
        intro="Le téléphone reste le canal où se décident les commandes — à condition que quelqu'un réponde. L'IA traite commandes, retours et questions produits sans file d'attente."
        points={[
          "Prise de commande téléphonique assistée",
          "Gestion des retours et SAV",
          "Cross-sell et panier moyen",
          "Relance des paniers abandonnés par appel",
        ]}
        stats={[
          { value: "+31%", label: "de ventes assistées" },
          { value: "−52%", label: "de réclamations retours" },
        ]}
      />
    ),
  },
  {
    id: "finance",
    label: "Finance",
    content: (
      <SectorBlock
        intro="Des volumes d'appels importants, des heures critiques pour la conformité, et des conseillers qui répètent sans cesse les mêmes réponses. L'IA décharge le standard et route chaque appel au bon expert."
        points={[
          "Routage vers le bon conseiller",
          "Réponse IA aux questions récurrentes",
          "Traçabilité et enregistrements conformes",
          "Réduction des coûts télécom par ligne",
        ]}
        stats={[
          { value: "65%", label: "d'appels routés en automatique" },
          { value: "−38%", label: "de coût télécom par agence" },
        ]}
      />
    ),
  },
  {
    id: "logistique",
    label: "Logistique",
    content: (
      <SectorBlock
        intro="Confirmer des livraisons, signaler des retards, prendre des notes : des dizaines d'appels quotidiens qu'aucune boîte vocale ne peut traiter. L'IA capte, trie et transmet."
        points={[
          "Confirmations de livraison automatiques",
          "Signalement des retards et incidents",
          "Prise de notes structurées",
          "Rattachement automatique aux tournées",
        ]}
        stats={[
          { value: "−93%", label: "d'appels non suivis" },
          { value: "+22%", label: "de livraisons dans les délais" },
        ]}
      />
    ),
  },
  {
    id: "sme",
    label: "PME & Services",
    content: (
      <SectorBlock
        intro="En petite équipe, un appel manqué est souvent une mission perdue. L'IA devient votre standardiste, votre assistante commerciale et votre support, sans recrutement ni matériel."
        points={[
          "Remplacement du répondeur vocal",
          "Qualification des devis et demandes",
          "Prise de rendez-vous commercial",
          "Disponible dès 15 minutes",
        ]}
        stats={[
          { value: "0", label: "appel manqué aux horaires de fermeture" },
          { value: "15 min", label: "pour être opérationnel" },
        ]}
      />
    ),
  },
  {
    id: "automobile",
    label: "Automobile",
    content: (
      <SectorBlock
        intro="Concessions, ateliers et négoce : la relation se joue au premier appel. L'IA qualifie les leads véhicules, prend les rendez-vous atelier et suit la flotte de retour clients."
        points={[
          "Qualification des demandes de véhicules",
          "Prise de rendez-vous atelier autonome",
          "Suivi des retours clients après-vente",
          "Sync CRM réseau national",
        ]}
        stats={[
          { value: "+2x", label: "de demandes d'essais" },
          { value: "78%", label: "de rendez-vous atelier en autonomie" },
        ]}
      />
    ),
  },
];

const whoItHelps = [
  { title: "PME & artisans", description: "Standardiste IA 24/7, devis et prises de rendez-vous sans recruter." },
  { title: "Cabinets & professions libérales", description: "Confidentialité, qualification et agenda gérés par l'IA." },
  { title: "Distributeurs & franchisés", description: "Standard réseau, appels suivis, données consolidées." },
  { title: "Réseaux nationaux", description: "Déploiement multi-sites en 6 semaines, gouvernance centralisée." },
];

export default function SectorsPage() {
  return (
    <MarketingLayout>
      <PageHero
        badge="Solutions par secteur"
        accent="emerald"
        title={
          <>
            Une téléphonie IA qui <span className="n8n-gradient-text">parle votre métier</span>
          </>
        }
        subtitle="Chaque secteur a ses appels critiques et ses contraintes. Antigravity s'adapte à votre jargon, vos horaires et vos processus."
      >
        <Link href="/register" className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-rose-500/25 hover:scale-105 transition-transform">
          Tester sur mon secteur
        </Link>
        <Link href="/pricing" className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors">
          Voir les tarifs
        </Link>
      </PageHero>

      <div className="max-w-7xl mx-auto px-6 pb-10">
        <TrustBar />
      </div>

      {/* Tabs secteurs */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <InteractiveTabs tabs={sectors} />
      </section>

      {/* Qui ça aide */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeading
          title="Qui ça aide ?"
          subtitle="Des artisans aux réseaux nationaux : la même IA vocale, à l'échelle qui vous convient."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whoItHelps.map((w) => (
            <div key={w.title} className="rounded-[24px] glass-panel-premium p-6 flex flex-col gap-3">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">{w.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{w.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA vers devis */}
      <section className="max-w-7xl mx-auto px-6 py-16 pb-24">
        <div className="rounded-[32px] glass-panel-premium p-8 md:p-12 text-center max-w-4xl mx-auto flex flex-col gap-6">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Votre secteur n&apos;est pas là ? <span className="n8n-gradient-text">Parlons-en</span>
          </h2>
          <p className="text-[var(--text-secondary)] font-medium leading-relaxed max-w-2xl mx-auto">
            Nous construisons des scénarios sur mesure avec chaque client. Dites-nous quels appels vous perdez, nous configurons la réponse qui va avec.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-rose-500/25 hover:scale-105 transition-transform">
              Demander une démo sectorielle
            </Link>
            <Link href="/etudes-de-cas" className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors">
              Voir les études de cas
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}