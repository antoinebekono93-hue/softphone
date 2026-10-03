import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingLayout,
  LegalDocument,
  LegalNote,
  type LegalSectionData,
} from "@/components/marketing";
import { siteConfig, supportChannels } from "@/lib/site-config";

const metaTitle = "Politique d'usage acceptable";

export const metadata: Metadata = {
  title: metaTitle,
  description:
    "Usages interdits sur la plateforme Antigravity : spam et prospection frauduleuse, fraude, usurpation d'identité, appels automatisés illicites, trafic artificiel, fraude aux minutes et au solde, revente non autorisée, conformité WhatsApp et Meta, et règles d'enregistrement des appels.",
  alternates: { canonical: "/acceptable-use" },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: "/acceptable-use",
    title: `${metaTitle} | ${siteConfig.brand}`,
    description:
      "Liste des usages interdits, obligations de conformité et conséquences en cas de manquement.",
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
    id: "objet",
    title: "Objet et champ d'application",
    paragraphs: [
      <>
        La présente politique définit les usages qui sont interdits sur la plateforme{" "}
        <strong className="text-[var(--text-primary)]">{siteConfig.product}</strong>. Elle
        s&apos;applique à l&apos;ensemble des fonctions du service : softphone, appels, numéros
        professionnels, routage, SMS, messagerie WhatsApp, agents vocaux assistés par intelligence
        artificielle, enregistrement, transcription et analytiques.
      </>,
      <>
        Elle s&apos;applique à tous les utilisateurs et à toutes les organisations clientes, ainsi
        qu&apos;à leurs collaborateurs, sous-traitants, prestataires et agents automatisés agissant
        pour leur compte. Un compte reste responsable de l&apos;ensemble des activités réalisées depuis
        celui-ci.
      </>,
      <>
        Cette politique s&apos;inscrit dans le cadre des{" "}
        <LegalLink href="/terms" label="Conditions générales" />. Son non-respect constitue un
        manquement contractuel susceptible d&apos;entraîner les mesures prévues à la section
        « Sanctions en cas de manquement ».
      </>,
    ],
  },
  {
    id: "interdits",
    title: "Usages interdits",
    paragraphs: [<>Sont expressément interdits les usages suivants.</>],
    subsections: [
      {
        title: "Usages frauduleux",
        list: [
          <>Usurpation d&apos;identité, fausse identité ou usurpation de la personnalité d&apos;un tiers.</>,
          <>
            Usurpation d&apos;identité de l&apos;appelant afin de se présenter comme l&apos;éditeur, comme un
            organisme public, comme une entreprise de Plumrush ou comme tout autre tiers.
          </>,
          <>Falsification d&apos;informations de facturation, usurpation de compte ou de numéro.</>,
          <>Fraude aux minutes, au forfait, au solde prépayé ou à l&apos;abonnement.</>,
          <>Contournement des mécanismes de contrôle, de facturation ou de quota.</>,
        ],
      },
      {
        title: "Spam, prospection et sollicitations illicites",
        list: [
          <>
            Envoi de SMS, de messages WhatsApp ou d&apos;appels non sollicités à destination de
            personnes qui n&apos;ont pas donné leur consentement préalable.
          </>,
          <>Spam par SMS, par messagerie ou par appel, y compris par l&apos;intermédiaire d&apos;agents automatisés.</>,
          <>
            Prospection téléphonique non conforme à la réglementation applicable, notamment en
            l&apos;absence d&apos;identification de l&apos;appelant ou de liste d&apos;exclusion respectée.
          </>,
          <>
            Envoi de messages non sollicités depuis un numéro professionnel à des fins de
            prospection, sans base légale de prospection.
          </>,
          <>Harcèlement, harcèlement moral, menaces, intimidation ou contenus haineux.</>,
        ],
      },
      {
        title: "Phishing, escroquerie et contenus illicites",
        list: [
          <>Hameçonnage (phishing), faux avis de paiement, fraude au faux support technique.</>,
          <>Attaques par déni de service, injection de script, exploitation de vulnérabilités.</>,
          <>Contenus illicites, diffamatoires, haineux, discriminatoires ou incitant à la violence.</>,
          <>Contenus de nature à tromper les utilisateurs finaux de votre organisation.</>,
        ],
      },
      {
        title: "Appels automatisés et trafic artificiel",
        list: [
          <>
            Mise en place d&apos;appels automatiques ou de systèmes de composition automatisée
            lorsqu&apos;ils sont interdits par la réglementation applicable ou par les règles de
            l&apos;opérateur.
          </>,
          <>
            Requêtes automatisées, robots, agents ou tout mécanisme générant un trafic artificiel
            destiné à surcharger la Plateforme ou à altérer les métriques de disponibilité.
          </>,
          <>
            Toute campagne de centre d&apos;appels, tout robot d&apos;appel ou tout composeur utilisé sans les
            enregistrements, consentements, mentions et horaires d&apos;appel exigés par la
            réglementation applicable.
          </>,
          <>
            Contournement des limites techniques d&apos;usage loyal afin de dépasser les quotas
            commerciaux d&apos;un plan.
          </>,
        ],
      },
      {
        title: "Revente et usage non autorisé",
        list: [
          <>
            Revente, location, sous-location ou mise à disposition du service à un tiers sans
            accord écrit préalable.
          </>,
          <>
            Fourniture de la Plateforme en tant que service pour le compte d&apos;autrui sans
            autorisation, notamment en tant que régie ou en tant que plateforme de opérateur.
          </>,
          <>
            Partage d&apos;un compte entre plusieurs organisations, ou transfert des identifiants
            d&apos;accès.
          </>,
        <>Reverse engineering de la Plateforme, à l&apos;exception des cas expressément autorisés par la loi.</>,
        ],
      },
      {
        title: "Sabotage des réseaux et des ressources",
        list: [
          <>Envoi de virus, de logiciels malveillants, de spams ou de contenus de nature à perturber le service.</>,
          <>
            Utilisation de la Plateforme pour acheminer des communications provenant de logiciels
            malveillants ou de réseaux non autorisés.
          </>,
          <>
            Enregistrement massif de conversations, de prospection audio non sollicitée ou de
            contenus de tiers.
          </>,
          <>
            Utilisation de faux numéros, de numéros surtaxés de manière abusive, de numéros
            premium, ou de services de renumérotation.
          </>,
        ],
      },
      {
        title: "Manipulation de la plateforme",
        list: [
          <>
            Contournement des règles des opérateurs de télécommunications, des filtres ou des
            quotas d&apos;acheminement.
          </>,
          <>
            Tentative d&apos;obtenir un accès non autorisé à un autre compte, à une autre
            organisation ou à une autre partie du système.
          </>,
          <>
            Publication de contenus portant atteinte aux droits de tiers, y compris de contenus
           Relevant d&apos;un droit à l&apos;image ou à la vie privée.
          </>,
        ],
      },
    ],
  },
  {
    id: "consentement",
    title: "Consentement et prospection marketing",
    paragraphs: [
      <>
        Vous êtes seul responsable de l&apos;obtention, de la conservation et de la preuve du
        consentement des personnes que vous sollicitez. Le simple fait qu&apos;un numéro apparaisse dans
        votre répertoire ne constitue pas un consentement.
      </>,
    ],
    list: [
      <>
        Avant toute campagne de prospection ou de sollicitation commerciale, vous devez vous
        assurer que vous disposez d&apos;une base légale valide au regard du droit applicable : accord
        préalable de la personne, intérêt légitime documenté ou sollicitation addressed à une
        personne professionnelle, selon les règles locales applicables.
      </>,
      <>
        Vous devez laisser à chaque personne un moyen simple et gratuit de s&apos;opposer à toute sollicitation et
        cesser immédiatement les sollicitations sur demande.
      </>,
      <>
        Vous devez respecter les heures autorisées pour la prospection et les plafonds de fréquence
        imposés par la réglementation applicable dans les pays de vos destinataires.
      </>,
      <>
        Tout numéro identifié comme spam par un destinataire ou par un opérateur peut être
        bloqué définitivement sur la Plateforme, ce qui affecte l&apos;ensemble de vos campagnes.
      </>,
    ],
    note: (
      <LegalNote>
        La prospection par SMS, par messagerie ou par appel sans consentement préalable est
        interdite en France sans exceptions prévues par la loi. Elle est interdite dans de nombreux
        autres pays, ou soumis à des conditions supplémentaires. Vous êtes seul juge de ce qui
        s&apos;applique à vos destinataires.
      </LegalNote>
    ),
  },
  {
    id: "whatsapp-meta",
    title: "Conformité WhatsApp et Meta",
    paragraphs: [
      <>
        L&apos;utilisation des canaux de messagerie tiers est soumise aux conditions des fournisseurs
        concernés, en particulier les règles officielles de WhatsApp Business et les règles de la
        plateforme Meta. Ces règles évoluent indépendamment de la nôtre et s&apos;imposent à vous
        directement.
      </>,
    ],
    list: [
      <>Vous ne devez utiliser que les commandes, formats et scénarios de conversation autorisés.</>,
      <>
        Vous ne devez pas envoyer de messages non sollicités, de messages en masse sans
        consentement, ni de contenus proscrits par WhatsApp Business.
      </>,
      <>
        Vous devez respecter les règles relatives aux models de messages, aux fenêtres de
       .template et aux coûts de conversation.
      </>,
      <>
        Vous ne devez pas exporter, scraper ou extraire les contacts ou les données de comptes WhatsApp
        à des fins d&apos;envoi de masse.
      </>,
      <>
        La perte d&apos;un numéro, d&apos;un compte professionnel ou d&apos;une autorisation de messagerie ne
        peut faire l&apos;objet d&apos;un remboursement et engage votre responsabilité exclusive vis-à-vis
        de vos destinataires.
      </>,
    ],
  },
  {
    id: "enregistrement",
    title: "Enregistrement des appels et obligations réglementaires",
    paragraphs: [
      <>
        Lorsque l&apos;enregistrement des appels est activé, vous êtes seul responsable du respect de la
        réglementation applicable à l&apos;enregistrement et à la conservation des communications et
        des données personnelles, notamment :
      </>,
    ],
    list: [
      <>
        L&apos;information préalable des personnes concernées quant à l&apos;enregistrement de la
        conversation.
      </>,
      <>
        Le respect des durées de conservation maximales imposées par la réglementation locale.
      </>,
      <>
        La sécurisation de l&apos;accès aux enregistrements et de leur suppression à l&apos;issue de la
        durée légale.
      </>,
      <>
        La déclaration préalable du numéro professionnel, son enregistrement et l&apos;obligation
        d&apos;affichage d&apos;une identification de l&apos;appelant lorsque la réglementation locale
        l&apos;impose.
      </>,
      <>
        L&apos;obtention d&apos;un numéro déclaré et autorisé, notamment pour les numéros de services
        d&apos;urgence ou les numéros surtaxés.
      </>,
    ],
  },
  {
    id: "suspension",
    title: "Suspension en cas d'abus",
    list: [
      <>signalement de fraude, de spam ou d&apos;harcèlement par des destinataires ;</>,
      <>non-respect des règles d&apos;un opérateur de télécommunications ou d&apos;un fournisseur de messagerie ;</>,
      <>risque pour la sécurité ou la stabilité de la Plateforme ;</>,
      <>risque juridique ou réglementaire pour l&apos;éditeur ;</>,
      <>tentative de contournement des quotas, des limites d&apos;usage loyal ou de la facturation ;</>,
      <>création de trafic artificiel ou d&apos;appels en masse ;</>,
    ],
    paragraphs: [
      <>
        L&apos;éditeur peut, sans préavis ou avec un préavis aussi bref que possible compte tenu de la
        gravité, suspendre un compte, limiter un débit ou bloquer un numéro lorsque l&apos;usage du
        service expose l&apos;éditeur, ses opérateurs, ou les utilisateurs de la Plateforme à un
        risque identifié, notamment dans les cas énumérés ci-dessus.
      </>,
      <>
        Une limitation technique d&apos;usage loyal (durée maximale d&apos;appel, nombre d&apos;appels
        simultanés, par heure ou par jour, restriction de destination) peut être appliquée à titre
        préventif et à titre conservatoire, indépendamment d&apos;une infraction caractérisée.
      </>,
      <>
        Le compte suspendu peut être rétabli après examen, à la discrétion de l&apos;éditeur, une fois
        la cause supprimée et les engagements pris. Un compte fermé pour manquement grave peut ne
        jamais être rétabli.
      </>,
      <>
        Une suspension n&apos;ouvre droit à aucun remboursement des sommes déjà facturées, sauf
        disposition légale impérative. La politique de{" "}
        <LegalLink href="/refund-policy" label="remboursement" /> reste applicable.
      </>,
    ],
  },
  {
    id: "sanctions",
    title: "Sanctions en cas de manquement",
    list: [
      <>Avertissement et demande de mise en conformité, sans impact sur le service.</>,
      <>Limitation de débit, de durée d&apos;appel, de volume de messages ou de destination.</>,
      <>Blocage d&apos;un numéro professionnel ou d&apos;un canal de messagerie.</>,
      <>Suspension temporaire des fonctions payantes ou du compte.</>,
      <>Fermeture définitive du compte et suppression des données, après information préalable.</>,
      <>Résiliation immédiate des abonnements en cours, sans remboursement de la période engagée.</>,
    ],
    paragraphs: [
      <>
        Lorsqu&apos;un manquement expose des tiers, une autorité ou nos opérateurs à un risque,
        l&apos;éditeur peut agir sans préavis et sans délai de correction. Le compte peut être transmis
        aux autorités compétentes ou aux opérateurs concernés lorsque la loi l&apos;impose ou le
        permet.
      </>,
    ],
  },
  {
    id: "signalement",
    title: "Signalement et demande de réexamen",
    paragraphs: [
      <>
        Si vous pensez qu&apos;une décision de suspension a été prise par erreur, adressez votre demande
        de réexamen via le canal indiqué sur la page{" "}
        <LegalLink href="/contact" label="Contact" />, en précisant l&apos;organisation concernée, la
        date de la décision et les informations permettant de comprendre la situation. Nous
        examinons ces demandes et vous répondons.
      </>,
      <>
        Si vous pensez qu&apos;un contenu, un numéro ou une campagne tiers constitue un abus,
        signalez-le au même point de contact en indiquant l&apos;identité du client concerné, la date,
        la destination et la nature du manquement afin que nous puissions examiner rapidement la demande.
      </>,
    ],
  },
  {
    id: "modification",
    title: "Modification de la politique",
    paragraphs: [
      <>
        La présente politique peut être mise à jour pour tenir compte de l&apos;évolution du service,
        des règles des opérateurs de télécommunications et des fournisseurs de messagerie, ainsi que
        des évolutions juridiques. La version applicable est celle publiée sur cette page à la date
        de votre consultation.
      </>,
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: [
      <>
        Pour toute question relative à cette politique, à un signalement d&apos;abus ou à une demande
        de réexamen, utilisez le canal indiqué sur la page{" "}
        <LegalLink href="/contact" label="Contact" />.
      </>,
    ],
  },
];

export default function AcceptableUsePage() {
  const legalChannel = supportChannels.find((channel) => channel.id === "legal");

  return (
    <MarketingLayout>
      <LegalDocument
        eyebrow="Usage de la plateforme"
        title={metaTitle}
        intro="Cette politique liste les usages interdits sur la plateforme Antigravity, les obligations de conformité qui vous incombent, les règles applicables à la prospection et aux canaux de messagerie, et les conséquences d'un manquement."
        lastUpdated={siteConfig.legalEffectiveDate}
        sections={sections}
      >
        {legalChannel ? (
          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            Signalement d&apos;abus :{" "}
            <a href={`mailto:${legalChannel.email}`} className="underline underline-offset-4">
              {legalChannel.email}
            </a>
          </p>
        ) : null}
      </LegalDocument>
    </MarketingLayout>
  );
}
