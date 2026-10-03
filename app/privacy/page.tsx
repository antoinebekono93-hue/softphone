import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingLayout,
  LegalDocument,
  LegalNote,
  type LegalSectionData,
} from "@/components/marketing";
import { siteConfig, supportChannels } from "@/lib/site-config";

const metaTitle = "Politique de confidentialité";

export const metadata: Metadata = {
  title: metaTitle,
  description:
    "Comment Antigravity collecte, utilise, conserve et protège vos données personnelles : données de compte et de contact, historique d'appels, SMS et WhatsApp, enregistrements, transcriptions, données IA, données d'usage et de facturation.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: "/privacy",
    title: `${metaTitle} | ${siteConfig.brand}`,
    description:
      "Quelles données sont collectées, sur quelle base légale, combien de temps elles sont conservées et comment exercer vos droits.",
  },
};

function LegalLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="underline underline-offset-4 hover:text-[var(--text-primary)]">
      {label}
    </Link>
  );
}

const sections: LegalSectionData[] = [
  {
    id: "responsable",
    title: "Responsable du traitement",
    paragraphs: [
      <>
        Le responsable du traitement des données personnelles collectées via la plateforme{" "}
        <strong className="text-[var(--text-primary)]">{siteConfig.product}</strong> est l&apos;éditeur
        de la Plateforme, identifié en tête du présent document et sur la page{" "}
        <LegalLink href="/contact" label="Contact" />.
      </>,
      <>
        Lorsque la Plateforme est utilisée par une organisation, cette organisation est le
        responsable du traitement des données qu&apos;elle collecte auprès de ses propres
        interlocuteurs. L&apos;éditeur intervient alors comme sous-traitant au sens de la
        réglementation applicable, et les obligations d&apos;information incombant à l&apos;organisation
        client lui reviennent.
      </>,
    ],
  },
  {
    id: "donnees",
    title: "Données collectées",
    subsections: [
      {
        title: "Données de compte et d'organisation",
        list: [
          <>Nom, prénom, adresse électronique, numéro de téléphone, fonction et organisation.</>,
          <>
            Informations d&apos;authentification (mot de passe chiffré, jetons de session,
            identifiants techniques) et historique de connexion.
          </>,
          <>
            Préférences de facturation : entité de facturation, adresse de facturation, régime
            applicable le cas échéant.
          </>,
        ],
      },
      {
        title: "Données de communication et de relation client",
        list: [
          <>Répertoire de contacts importé ou saisi : nom, numéro, adresse électronique, notes.</>,
          <>
            Métadonnées des appels : horodatage, durée exacte, direction, numéro appelant ou
            appelé, identifiant de l&apos;appel, compte utilisateur, issue de l&apos;appel.
          </>,
          <>
            Contenu des SMS et des conversations WhatsApp : messages échangés, horodatage, statut
            de délivrance, Files d&apos;conversation.
          </>,
          <>
            Enregistrements audio et transcriptions, lorsqu&apos;ils sont activés sur votre compte ou
            sur celui de votre organisation.
          </>,
          <>
            Réponses et annotations des agents vocaux assistés par intelligence artificielle,
            résultats d&apos;analyse de sentiment et synthèses produites par ces agents.
          </>,
          <>
            Journaux techniques et données d&apos;exploitation utiles au diagnostic : événements de
            routage, états de session, journaux d&apos;erreur.
          </>,
        ],
      },
      {
        title: "Données techniques et de navigation",
        list: [
          <>Adresse IP, type de navigateur et de système d&apos;exploitation, langue, fuseau horaire.</>,
          <>Identifiants de session, jetons d&apos;authentification, horodatages des requêtes.</>,
          <>
            Données d&apos;analytique d&apos;audience du site public et des pages de marketing, sous
            réserve de votre consentement lorsque le droit l&apos;exige.
          </>,
        ],
      },
      {
        title: "Données de facturation",
        list: [
          <>
            Montants facturés, abonnements souscrits, recharges de solde, consommations de minutes,
            de SMS et de messages, et historique des transactions.
          </>,
          <>
            Éventuellement, des identifiants de client et de transaction fournis par un prestataire
            de paiement, à l&apos;exclusion de toute donnée de carte bancaire complète.
          </>,
        ],
      },
    ],
  },
  {
    id: "paiement",
    title: "Données de paiement",
    paragraphs: [
      <>
        La plateforme ne collecte ni ne stocke les données brutes de votre carte bancaire (numéro de
        carte, cryptogramme, date d&apos;expiration complète). La saisie et la conservation de ces
        données relèvent exclusivement du prestataire de paiement qui vous propose le règlement au
        moment du paiement.
      </>,
      <>
        Les données de transaction que nous conservons se limitent au strict nécessaire pour
        réconcilier les flux de facturation, fournir vos factures, prévenir la fraude et respecter
        nos obligations comptables et fiscales.
      </>,
    ],
    note: (
      <LegalNote>
        Certains paiements peuvent, à l&apos;avenir, être traités par un prestataire de paiement tiers
        agissant en qualité de Merchant of Record. Lorsque cette structure entre en vigueur, il
        devient le responsable du traitement des données de facturation correspondantes, et cette
        information vous sera signalée de manière explicite sur le parcours de règlement et dans la
        facture remise.
      </LegalNote>
    ),
  },
  {
    id: "finalites",
    title: "Finalités et bases légales",
    subsections: [
      {
        title: "Exécution du contrat",
        list: [
          <>Créer et administrer votre compte et votre organisation, et sécuriser l&apos;accès.</>,
          <>
            Fournir les fonctions de la Plateforme : appels, numéros, routage, messagerie,
            enregistrement, transcription, agents vocaux et analytiques.
          </>,
          <>
            Gérer votre abonnement, votre facturation, votre solde prépayé et les limitations
            techniques d&apos;usage loyal.
          </>,
          <>Assurer le support technique et traiter vos demandes.</>,
          <>Prévenir la fraude et sécuriser la Plateforme.</>,
        ],
        paragraphs: [
          <>
            Base légale : exécution du contrat conclu entre vous et l&apos;éditeur, et intérêt légitime
            de l&apos;éditeur à sécuriser son service et à prévenir les usages frauduleux.
          </>,
        ],
      },
      {
        title: "Obligations légales",
        list: [
          <>
            Conservation des données de facturation, tenue des écritures comptables, obligations
            fiscales et douanières applicables.
          </>,
          <>Obligations de conservation des enregistrements d&apos;appels lorsqu&apos;elles existent.</>,
          <>Obligations de réponse aux autorités administratives ou judiciaires compétentes.</>,
        ],
        paragraphs: [<>{<>Base légale : obligation légale applicable à l&apos;éditeur.</>}</>],
      },
      {
        title: "Intérêt légitime",
        list: [
          <>Amélioration de la qualité du service, diagnostic et correction d&apos;anomalies.</>,
          <>Sécurité, prévention des abus, détection des trafics artificiels et de la fraude aux minutes.</>,
          <>Statistiques internes agrégées et non ré-identifiables.</>,
        ],
        paragraphs: [
          <>
            Base légale : intérêt légitime de l&apos;éditeur à assurer la qualité, la sécurité et la
            continuité de la Plateforme. Vous pouvez vous opposer à ce traitement à tout moment.
          </>,
        ],
      },
      {
        title: "Consentement",
        list: [
          <>
            Prospection commerciale par courrier électronique, par SMS ou par messagerie, lorsque
            cette prospection est soumise à votre accord préalable.
          </>,
          <>
            Stockage de cookies et traceurs non strictement nécessaires, notamment pour mesurer
            l&apos;audience du site public.
          </>,
        ],
        paragraphs: [
          <>
            Base légale : votre consentement. Vous pouvez le retirer à tout moment, sans que cela
            remette en cause la licéité des traitements effectués auparavant.
          </>,
        ],
      },
    ],
  },
  {
    id: "destinataires",
    title: "Destinataires et sous-traitants",
    paragraphs: [
      <>
        Vos données sont accessibles aux seuls personnels habilités de l&apos;éditeur, ainsi
        qu&apos;aux catégories de destinataires suivantes, qui interviennent en qualité de
        sous-traitants pour fournir le service :
      </>,
    ],
    list: [
      <>Prestataires de paiement, qui traitent les règlements sans jamais détenir vos moyens de paiement.</>,
      <>Opérateurs et fournisseurs de réseaux de télécommunications pour l&apos;acheminement des communications.</>,
      <>Fournisseurs d&apos;infrastructure cloud et d&apos;hébergement.</>,
      <>Fournisseurs de services d&apos;intelligence artificielle utilisés par les fonctions d&apos;analyse et d&apos;agents vocaux.</>,
      <>Outils de mesure d&apos;audience et de support client.</>,
      <>Prestataires de services de sécurité, de sauvegarde et de journalisation.</>,
      <>Autorités administratives ou judiciaires lorsque la loi l&apos;impose.</>,
    ],
    note: (
      <LegalNote>
        Certains de ces sous-traitants peuvent traiter des données hors de l&apos;Union européenne.
        Dans ce cas, des garanties appropriées sont mises en œuvre, notamment des clauses
        contractuelles types de la Commission européenne ou un cadre équivalent. La liste à jour
        des catégories de sous-traitants et de leurs pays d&apos;hébergement est disponible sur
        demande via le canal indiqué en fin de document.
      </LegalNote>
    ),
  },
  {
    id: "conservation",
    title: "Durées de conservation",
    paragraphs: [
      <>
        Les données sont conservées pendant la durée strictement nécessaire à la finalité pour
        laquelle elles ont été collectées, puis supprimées ou anonymisées. Les durées applicables
        sont les suivantes :
      </>,
    ],
    list: [
      <>
        <strong className="text-[var(--text-primary)]">Données de compte</strong> : pendant toute la
        durée du compte, puis pendant une période de grâce limitée après clôture, le temps de vous
        permettre de réactiver le compte, avant suppression définitive.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Métadonnées d&apos;appels et de messages</strong> :
        pendant la durée du compte, puis pour une durée limitée rendue nécessaire à la fourniture
        des factures et à la résolution d&apos;un litige.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Enregistrements audio</strong> : pendant la durée
        de conservation définie dans les réglages de votre organisation, puis supprimés à
        l&apos;issue de cette période. En l&apos;absence de réglage, ils sont supprimés au plus tard
        après une durée maximale courte que vous pouvez vérifier et ajuster dans votre espace.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Transcriptions et analyses IA</strong> : pendant
        la durée du compte, sauf suppression anticipée de votre part.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Données de facturation</strong> : pendant la durée
        requise par les obligations comptables et fiscales applicables, généralement plusieurs
        exercices, puis archivées avant suppression.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Journaux de sécurité</strong> : pendant une durée
        limitée, puis supprimés.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Données de prospection</strong> : jusqu&apos;au
        retrait de votre consentement ou à votre opposition, puis suppressées.
      </>,
    ],
  },
  {
    id: "securite",
    title: "Sécurité",
    list: [
      <>Chiffrement des échanges entre votre navigateur et nos serveurs.</>,
      <>
        Stockage des identifiants et des données sensibles chiffrés au repos, et cloisonnement des
        environnements.
      </>,
      <>
        Contrôle d&apos;accès fondé sur les rôles, journalisation des accès et traçabilité des actions
        sensibles.
      </>,
      <>Sauvegardes régulières et procédure de restauration testée.</>,
      <>Sensibilisation et engagements de confidentialité imposés au personnel.</>,
    ],
    paragraphs: [
      <>
        Aucun système n&apos;étant infaillible, l&apos;éditeur met en œuvre les moyens raisonnables
        pour protéger vos données contre la perte, l&apos;accès non autorisé, la divulgation et
        l&apos;altération. En cas de violation de données susceptible d&apos;engendrer un risque élevé
        pour vos droits et libertés, l&apos;éditeur en informera l&apos;autorité de contrôle compétente
        dans les délais prévus par la réglementation, ainsi que les personnes concernées lorsque
        cette obligation s&apos;applique.
      </>,
    ],
  },
  {
    id: "droits",
    title: "Vos droits",
    list: [
      <>
        <strong className="text-[var(--text-primary)]">Droit d&apos;accès</strong> : obtenir la
        confirmation que vos données sont traitées et en recevoir une copie.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Droit de rectification</strong> : faire
        corriger des données inexactes ou incomplètes.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Droit à l&apos;effacement</strong> : demander
        la suppression de vos données lorsque les conditions sont réunies.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Droit à la limitation</strong> : demander le
        gel temporaire d&apos;un traitement contesté.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Droit d&apos;opposition</strong> : vous
        opposer à un traitement fondé sur l&apos;intérêt légitime ou à la prospection.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Droit à la portabilité</strong> : recevoir les
        données que vous avez fournies dans un format structuré et lisible par machine.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Droit de retirer votre consentement</strong> à
        tout moment pour les traitements qui reposent sur celui-ci.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Droit de définir des directives</strong> relatives
        au sort de vos données après votre décès, dans les conditions prévues par la loi.
      </>,
    ],
    paragraphs: [
      <>
        Vous disposez, selon les conditions prévues par la réglementation applicable, des droits
        suivants sur vos données personnelles.
      </>,
      <>
        Pour exercer vos droits, adressez votre demande au canal indiqué dans la section Contact de
        la présente politique, en précisant l&apos;organisation concernée et le droit visé. Nous
        répondons dans les délais prévus par la réglementation applicable et vous pouvons demander
        un délai supplémentaire de traitement pour une demande complexe, dont nous vous informons
        dans ce cas. Vous pouvez également introduire une réclamation auprès de l&apos;autorité de
        contrôle compétente dans votre pays de résidence.
      </>,
      <>
        L&apos;exercice de vos droits est gratuit. Il peut toutefois être refusé s&apos;il est
        manifestement infondé, répété ou de nature à porter atteinte aux droits d&apos;autrui.
      </>,
    ],
  },
  {
    id: "mineurs",
    title: "Mineurs et usage professionnel",
    paragraphs: [
      <>
        La Plateforme est destinée aux entreprises et aux professionnels. Si un compte est utilisé
        par un mineur sans autorisation parentale, l&apos;éditeur procède à sa fermeture.
      </>,
    ],
  },
  {
    id: "modification",
    title: "Modification de la politique",
    paragraphs: [
      <>
        Cette politique peut être mise à jour pour tenir compte de l&apos;évolution du service, des
        évolutions juridiques ou des modifications de sous-traitants. La version applicable est
        celle publiée sur cette page. Une modification substantielle fait l&apos;objet d&apos;une
        information adressée à l&apos;adresse électronique de votre compte avant son entrée en vigueur.
      </>,
    ],
  },
  {
    id: "contact",
    title: "Contact et réclamations",
    paragraphs: [
      <>
        Pour toute question relative à vos données personnelles, à un exercice de droits ou à une
        réclamation, utilisez le canal indiqué sur la page{" "}
        <LegalLink href="/contact" label="Contact" />. Nous accusons réception de votre demande et
        vous répondons dans les délais prévus par la réglementation applicable.
      </>,
    ],
  },
];

export default function PrivacyPage() {
  const legalChannel = supportChannels.find((channel) => channel.id === "legal");

  return (
    <MarketingLayout>
      <LegalDocument
        eyebrow="Données personnelles"
        title={metaTitle}
        intro="Cette politique décrit les données personnelles traitées via la plateforme Antigravity, les raisons de ce traitement, les bases légales, les durées de conservation, la sécurité mise en œuvre et les modalités d'exercice de vos droits."
        lastUpdated={siteConfig.legalEffectiveDate}
        sections={sections}
      >
        {legalChannel ? (
          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            Contact protection des données :{" "}
            <a href={`mailto:${legalChannel.email}`} className="underline underline-offset-4">
              {legalChannel.email}
            </a>
          </p>
        ) : null}
      </LegalDocument>
    </MarketingLayout>
  );
}
