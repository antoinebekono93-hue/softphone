import Link from "next/link";
import { MarketingLayout, PageHero, SectionHeading, InteractiveTabs } from "@/components/marketing";
import { TrustBar, FinalCTA } from "@/components/landing";

export const metadata = {
  title: "Solutions par secteur | Buster Call",
  description:
    "Répondeur IA, téléphonie et agents vocaux adaptés à votre métier : santé, juridique, immobilier, hôtellerie, commerce, finance, logistique, automobile.",
};

function SectorBlock({ intro, points }: { intro: string; points: string[] }) {
  return (
    <div className="rounded-[24px] glass-panel-premium p-8">
      <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">{intro}</p>
      <ul className="grid sm:grid-cols-2 gap-3">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-sm font-bold text-[var(--text-primary)]">
            <span className="w-6 h-6 rounded-full n8n-gradient-bg flex items-center justify-center text-white text-xs mt-0.5 shrink-0">
              ✓
            </span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

const sectors = [
  {
    id: "sante",
    label: "Santé",
    content: (
      <SectorBlock
        intro="Standards saturés, rendez-vous perdus, patients qui attendent au lieu d'être appelés. Le répondeur IA prend en charge les demandes de rendez-vous et les rappels, selon les règles que vous définissez."
        points={[
          "Prise de rendez-vous autonome",
          "Rappels de consultation automatiques",
          "Transfert des urgences vers le secrétariat",
          "Historique des appels consultable",
        ]}
      />
    ),
  },
  {
    id: "juridique",
    label: "Juridique",
    content: (
      <SectorBlock
        intro="Chaque appel non traité est une consultation ou un cabinet perdu. L'agent IA qualifie les demandes et prépare un compte rendu pour l'avocat."
        points={[
          "Qualification des consultations par besoin",
          "Prise de rendez-vous assistée",
          "Transcription des échanges",
          "Suivi des dossiers sans courriels perdus",
        ]}
      />
    ),
  },
  {
    id: "immobilier",
    label: "Immobilier",
    content: (
      <SectorBlock
        intro="Les prospects visitent le samedi et appellent le dimanche soir. L'agent IA capte chaque appel, qualifie la demande et planifie les visites."
        points={[
          "Qualification des leads hors horaires",
          "Planification des visites",
          "Relances automatiques des prospects",
          "Export des échanges vers votre outil agence",
        ]}
      />
    ),
  },
  {
    id: "hotellerie",
    label: "Hôtellerie",
    content: (
      <SectorBlock
        intro="La réservation directe est le canal le plus rentable — et le plus souvent perdu. L'agent IA prend les réservations et répond aux questions fréquentes de l'établissement."
        points={[
          "Réservations directes",
          "Gestion des demandes spéciales",
          "Réponses aux FAQ de l'établissement",
          "Transfert vers la réception à tout moment",
        ]}
      />
    ),
  },
  {
    id: "commerce",
    label: "Commerce & E-commerce",
    content: (
      <SectorBlock
        intro="Le téléphone reste le canal où se décident les commandes — à condition que quelqu'un réponde. L'agent IA traite commandes, retours et questions produits sans file d'attente."
        points={[
          "Prise de commande téléphonique assistée",
          "Gestion des retours et du SAV",
          "Relance des paniers abandonnés par appel",
          "Appels et SMS dans la même boîte de réception",
        ]}
      />
    ),
  },
  {
    id: "finance",
    label: "Finance",
    content: (
      <SectorBlock
        intro="Des volumes d'appels importants et des conseillers qui répètent sans cesse les mêmes réponses. L'agent IA décharge le standard et route chaque appel au bon interlocuteur."
        points={[
          "Routage vers le bon conseiller",
          "Réponses IA aux questions récurrentes",
          "Traçabilité des échanges sur votre compte",
          "Règles de conservation que vous définissez",
        ]}
      />
    ),
  },
  {
    id: "logistique",
    label: "Logistique",
    content: (
      <SectorBlock
        intro="Confirmer des livraisons, signaler des retards, prendre des notes : des dizaines d'appels quotidiens qu'aucune boîte vocale ne peut traiter. L'agent IA capte, trie et transmet."
        points={[
          "Confirmations de livraison automatiques",
          "Signalement des retards et incidents",
          "Prise de notes structurées",
          "Transmission vers vos outils de gestion",
        ]}
      />
    ),
  },
  {
    id: "sme",
    label: "PME & Services",
    content: (
      <SectorBlock
        intro="En petite équipe, un appel manqué est souvent une mission perdue. L'agent IA devient votre standardiste et votre assistante commerciale, sans matériel supplémentaire."
        points={[
          "Remplacement du répondeur vocal",
          "Qualification des devis et demandes",
          "Prise de rendez-vous commercial",
          "Softphone dans le navigateur, sans installation",
        ]}
      />
    ),
  },
  {
    id: "automobile",
    label: "Automobile",
    content: (
      <SectorBlock
        intro="Concessions, ateliers et négoce : la relation se joue au premier appel. L'agent IA qualifie les demandes de véhicules et prend les rendez-vous atelier."
        points={[
          "Qualification des demandes de véhicules",
          "Prise de rendez-vous atelier",
          "Suivi des retours clients après-vente",
          "Export des échanges vers votre CRM",
        ]}
      />
    ),
  },
];

const whoItHelps = [
  {
    title: "PME & artisans",
    description: "Agent vocal, devis et prises de rendez-vous sans recruter de standardiste.",
  },
  {
    title: "Cabinets & professions libérales",
    description: "Qualification des demandes et agenda tenus par l'agent vocal.",
  },
  {
    title: "Distributeurs & franchisés",
    description: "Standard mutualisé pour le réseau, appels suivis et données consolidées.",
  },
  {
    title: "Réseaux multi-sites",
    description: "Déploiement par site avec gouvernance centralisée des règles de routage.",
  },
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
        subtitle="Chaque secteur a ses appels critiques et ses contraintes. Buster Call s'adapte à votre jargon, vos horaires et vos processus."
      >
        <Link
          href="/contact"
          className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-cyan-500/25 hover:scale-105 transition-transform"
        >
          Tester sur mon secteur
        </Link>
        <Link
          href="/pricing"
          className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors"
        >
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
          subtitle="Des artisans aux réseaux multi-sites : le même agent vocal, à l'échelle qui vous convient."
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
            Dites-nous quels appels vous perdez et dans quel cadre ils doivent être traités. Nous
            configurerons le scénario correspondant avec vous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="n8n-gradient-bg text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-cyan-500/25 hover:scale-105 transition-transform"
            >
              Demander une démo sectorielle
            </Link>
            <Link
              href="/etudes-de-cas"
              className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-8 py-3 rounded-full font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              Voir les scénarios d&apos;usage
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <FinalCTA />
      </section>
    </MarketingLayout>
  );
}