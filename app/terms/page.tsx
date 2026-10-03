import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingLayout,
  LegalDocument,
  LegalNote,
  type LegalSectionData,
} from "@/components/marketing";
import { siteConfig, supportChannels } from "@/lib/site-config";

const metaTitle = "Conditions générales";

export const metadata: Metadata = {
  title: metaTitle,
  description:
    "Conditions générales d'utilisation de la plateforme Antigravity : compte, abonnements, paiement, renouvellement, résiliation, propriété intellectuelle, responsabilité et données.",
  alternates: { canonical: "/terms" },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: "/terms",
    title: `${metaTitle} | ${siteConfig.brand}`,
    description:
      "Conditions générales d'utilisation, d'abonnement et de paiement de la plateforme Antigravity.",
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
        Les présentes conditions générales régissent l&apos;accès et l&apos;utilisation de la
        plateforme <strong className="text-[var(--text-primary)]">{siteConfig.product}</strong>,
        plateforme en ligne de téléphonie professionnelle, de softphone cloud et d&apos;agents
        vocaux assistés par intelligence artificielle (ci-après « la Plateforme »). Elles forment un
        contrat entre vous, en qualité d&apos;utilisateur professionnel ou de représentant d&apos;une
        organisation, et l&apos;éditeur de la Plateforme.
      </>,
      <>
        L&apos;acceptation des présentes conditions est un préalable obligatoire à la création d&apos;un
        compte et à toute souscription à une offre. La création d&apos;un compte vaut acceptation
        pleine et entière des présentes conditions ainsi que de la{" "}
        <LegalLink href="/privacy" label="politique de confidentialité" />, de la{" "}
        <LegalLink href="/refund-policy" label="politique de remboursement" /> et de la{" "}
        <LegalLink href="/acceptable-use" label="politique d&apos;usage acceptable" />.
      </>,
      <>
        Les fonctions identifiées comme expérimentales, bêta ou en cours de déploiement sur la
        Plateforme ne font pas l&apos;objet d&apos;un engagement de disponibilité. Leur activation sur
        un compte n&apos;engage pas l&apos;éditeur à les maintenir.
      </>,
    ],
  },
  {
    id: "editeur",
    title: "Éditeur de la Plateforme",
    paragraphs: [
      <>
        L&apos;éditeur de la Plateforme est l&apos;entité dont les informations d&apos;identification
        figurent en tête du présent document. Ces informations sont également publiées sur la page{" "}
        <LegalLink href="/contact" label="Contact" />.
      </>,
      <>
        Pour toute question relative au présent contrat, à son interprétation ou à son
        application, vous pouvez utiliser le canal de contact réservé aux questions juridiques
        indiqué sur la page <LegalLink href="/contact" label="Contact" />.
      </>,
    ],
  },
  {
    id: "produit",
    title: "Description du service",
    list: [
      <>Attribution et gestion de numéros professionnels dans un pays et un fuseau horaire donnés.</>,
      <>
        Softphone web et application mobile utilisables dans un navigateur ou sur mobile, pour
        émettre et recevoir des appels.
      </>,
      <>
        Appels internes entre utilisateurs de la Plateforme, sans coût additionnel par appel, dans
        les limites d&apos;usage loyal prévues à l&apos;article « Usage loyal et fair-use ».
      </>,
      <>
        Communications par SMS et par messagerie tierce (WhatsApp) selon la disponibilité et la
        configuration de votre compte.
      </>,
      <>Fonctions de routage et de distribution des appels entrants, selon l&apos;abonnement retenu.</>,
      <>
        Enregistrement, transcription et analyse des appels lorsque la fonctionnalité est incluse
        dans l&apos;abonnement souscrit.
      </>,
      <>
        Agents vocaux assistés par intelligence artificielle : réponse automatique, qualification,
        prise de rendez-vous, traitement d&apos;intentions et analyse de conversation.
      </>,
    ],
    paragraphs: [
      <>
        La Plateforme repose sur des réseaux et des infrastructures de télécommunications fournis
        par des opérateurs tiers. Les caractéristiques techniques (qualité de service,
        disponibilité, délai d&apos;établissement d&apos;un appel, routage) dépendent de ces réseaux et
        peuvent varier selon la localisation, l&apos;opérateur de destination et la réglementation
        applicable. Le présent contrat ne constitue pas un engagement de niveau de service sur ces
        éléments.
      </>,
    ],
  },
  {
    id: "compte",
    title: "Création et gestion du compte",
    list: [
      <>
        Vous devez fournir des informations exactes, à jour et complètes lors de la création du
        compte, et les tenir à jour.
      </>,
      <>
        Vous êtes seul responsable de la confidentialité de vos identifiants de connexion et de
        toute activité effectuée depuis votre compte, y compris celle de vos collaborateurs.
      </>,
      <>
        Vous devez être majeur et agir dans un cadre professionnel ou pour le compte d&apos;une
        organisation dûment représentée.
      </>,
      <>
        Vous devez fournir une adresse électronique valide et un numéro de téléphone que vous
        contrôlez effectivement, afin que la Plateforme puisse vous joindre.
      </>,
      <>
        Un compte ne peut être cédé, loué, revendu ou mis à disposition à un tiers sans accord
        écrit préalable de l&apos;éditeur.
      </>,
    ],
  },
  {
    id: "abonnements",
    title: "Abonnements et offres",
    paragraphs: [
      <>
        L&apos;accès aux fonctions payantes de la Plateforme est conditionné à la souscription
        d&apos;un abonnement. Les offres disponibles, leurs prix, leur périodicité, leur contenu et
        leurs limites sont publiés sur la page <LegalLink href="/pricing" label="Tarifs" />. Cette
        page fait foi.
      </>,
      <>
        Chaque abonnement comporte une durée d&apos;un mois, à compter de sa date d&apos;activation, et se
        renouvelle automatiquement à échéance selon la périodicité choisie, jusqu&apos;à annulation de
        votre part dans les conditions de l&apos;article « Annulation et résiliation ».
      </>,
      <>
        Sauf mention contraire explicite sur la page des Tarifs, le prix d&apos;un abonnement est un
        prix de base mensuel qui couvre l&apos;accès aux fonctions logicielles et les volumes de
        minutes ou de messages inclus dans l&apos;offre. Les consommations hors forfait, les numéros
        supplémentaires, les destinations internationales non incluses et les modules
        complémentaires sont facturés en sus, selon le barème en vigueur au moment de la
        consommation.
      </>,
      <>
        L&apos;abonnement est souscrit pour l&apos;usage professionnel interne de votre
        organisation. Il ne comprend pas la revente du service, la mise à disposition à des tiers
        non autorisés, ni la fourniture de la Plateforme en tant que service pour le compte
        d&apos;autrui, sauf accord écrit préalable.
      </>,
    ],
  },
  {
    id: "renouvellement",
    title: "Renouvellement automatique",
    paragraphs: [
      <>
        Sauf mention contraire explicite publiée sur la page des Tarifs, tout abonnement se
        renouvelle automatiquement à la fin de chaque période de facturation, pour une période
        identique, au même prix, jusqu&apos;à ce que vous exprimiez votre souhait de ne pas
        renouveler.
      </>,
      <>
        Vous pouvez mettre fin à ce renouvellement automatique à tout moment depuis votre espace
        compte, ou en contacting le{" "}
        <LegalLink href="/contact" label="support paiement et facturation" />, dans les conditions
        et avant la date d&apos;échéance indiquées dans l&apos;article « Annulation et résiliation ».
        Une demande d&apos;annulation du renouvellement reçue avant l&apos;échéance de l&apos;abonnement en
        cours empêche la facturation de la période suivante.
      </>,
      <>
        À chaque renouvellement, le prix applicable est celui publié sur la page des Tarifs au
        moment du renouvellement. Une modification du prix ne s&apos;applique pas à une période déjà
        facturée.
      </>,
    ],
    note: (
      <LegalNote>
        Le renouvellement automatique est un mécanisme de paiement récurrent. Le renouvellement
        se poursuit à chaque échéance tant que vous ne l&apos;avez pas désactivé ; vous pouvez le
        désactiver à tout moment, avant la date d&apos;échéance, sans frais. Nous vous indiquons le
        montant et la date de chaque débit avant son prélèvement.
      </LegalNote>
    ),
  },
  {
    id: "paiement",
    title: "Paiement",
    paragraphs: [
      <>
        Les paiements sont réglés par l&apos;intermédiaire d&apos;un ou plusieurs prestataires de
        paiement externes. Les moyens de paiement acceptés sont indiqués au moment du règlement. Les
        frais bancaires éventuels sont à votre charge, sauf mention contraire affichée avant
        validation du paiement.
      </>,
      <>
        Les données de votre moyen de paiement ne sont ni conservées ni traitées par l&apos;éditeur :
        elles sont transmises et conservées exclusivement par le prestataire de paiement, qui en
        est le responsable. L&apos;éditeur ne dispose à aucun moment du numéro complet de votre carte
        ni de vos identifiants de paiement.
      </>,
      <>
        Le règlement d&apos;un abonnement vaut acceptation de la commande. La facture est mise à
        disposition dans votre espace compte. Les prix sont indiqués dans la devise publiée sur la
        page des Tarifs et sont Hors Taxes sauf mention contraire explicite.
      </>,
      <>
        Le défaut de paiement peut entraîner, après information préalable, la suspension de
        l&apos;accès aux fonctions payantes ainsi que la désactivation des numéros et services
        associés. Une régularisation permet la réactivation.
      </>,
    ],
  },
  {
    id: "annulation",
    title: "Annulation et résiliation",
    paragraphs: [
      <>
        Vous pouvez annuler votre abonnement à tout moment, sans motif et sans frais de
        résiliation, depuis votre espace compte ou en contacting le support.
      </>,
      <>
        L&apos;annulation prend effet à la fin de la période de facturation en cours. Le compte reste
        actif jusqu&apos;à cette date ; le temps restant de la période déjà payée n&apos;est pas remboursé
        au prorata, sauf dispositions légales impératives ou cas prévus par la{" "}
        <LegalLink href="/refund-policy" label="politique de remboursement" />.
      </>,
      <>
        À compter de l&apos;échéance, le renouvellement automatique est désactivé. Vos fonctions
        payantes basculent en lecture seule ou en accès restreint, et les services dépendant d&apos;un
        abonnement actif (numéros, agents vocaux, canaux de messagerie) sont libérés selon les
        conditions de la section « Données et leur conservation ».
      </>,
      <>
        À la clôture définitive du compte, vous pouvez exporter vos données pendant une durée
        limitée, communiquée au moment de la clôture.
      </>,
    ],
  },
  {
    id: "suspension",
    title: "Suspension, limitation et fermeture",
    paragraphs: [
      <>
        L&apos;éditeur peut suspendre tout ou partie de l&apos;accès au compte, sans préavis ou avec un
        préavis raisonnable selon la gravité, en cas de violation des présentes conditions ou de la{" "}
        <LegalLink href="/acceptable-use" label="politique d&apos;usage acceptable" />, de risque
        pour la sécurité de la Plateforme ou d&apos;autres utilisateurs, d&apos;obligation légale, ou
        d&apos;impaiement.
      </>,
      <>
        Une limitation de débit, une limitation de durée d&apos;appel ou une restriction de
        destination peuvent être appliquées à titre de protection technique et d&apos;usage loyal,
        notamment en cas de pic d&apos;activité anormal. Ces mesures sont proportionnées et levées
        lorsque leur cause disparaît.
      </>,
      <>
        En cas de manquement grave et répété, l&apos;éditeur peut fermer le compte après avoir laissé
        un délai raisonnable pour corriger la situation, puis notifier les coordonnées de contact
        à utiliser.
      </>,
      <>
        La suspension ou la fermeture ne donne pas lieu à remboursement des sommes déjà facturées,
        sauf disposition légale impérative.
      </>,
    ],
  },
  {
    id: "usage-loyal",
    title: "Usage loyal et fair-use",
    paragraphs: [
      <>
        L&apos;abonnement donne droit à un usage professionnel normal. Sont considérés comme non
        conformes les volumes anormaux, automatisés ou destinés à une revente, les bombardements de
        trafic, l&apos;enregistrement massif et non nécessaire, ainsi que toute utilisation visant à
        épuiser les ressources de la Plateforme.
      </>,
      <>
        Les protections techniques (durée maximale d&apos;un appel, nombre d&apos;appels simultanés,
        nombre d&apos;appels par heure ou par jour) sont appliquées à ces fins et indiquées dans votre
        espace compte. Elles ne constituent pas le quota commercial de votre abonnement.
      </>,
      <>
        Les appels internes entre utilisateurs de la Plateforme sont inclus dans l&apos;abonnement
        lorsqu&apos;aucune limite d&apos;usage loyal ne s&apos;y applique. Les appels vers le réseau
        téléphonique public sont toujours soumis au forfait de minutes ou au solde prépayé, et ne
        sont pas inclus au titre de l&apos;appel interne.
      </>,
    ],
  },
  {
    id: "propriete",
    title: "Propriété intellectuelle",
    list: [
      <>
        La Plateforme, son interface, ses logiciels, ses modèles, ses textes, ses éléments visuels
        et ses marques restent la propriété exclusive de l&apos;éditeur ou de ses ayants droit.
      </>,
      <>
        L&apos;éditeur vous concède, pour la durée de votre abonnement, une licence limitée,
        non exclusive, non cessible et non transmissible d&apos;utilisation de la Plateforme, pour
        votre usage professionnel interne.
      </>,
      <>
        Vous conservez l&apos;intégralité de vos droits sur les contenus que vous transmettez
        (contacts, messages, enregistrements, fichiers, transcriptions, prompts). Vous concédez à
        l&apos;éditeur la seule licence nécessaire pour vous fournir le service et traiter ces
        contenus, conformément à la{" "}
        <LegalLink href="/privacy" label="politique de confidentialité" />.
      </>,
      <>
        Toute reproduction, représentation, extraction ou exploitation de la Plateforme ou de ses
        éléments, hors les cas expressément autorisés par la loi, est interdite, ainsi que toute
        tentative de contourner ses dispositifs techniques de protection.
      </>,
      <>
        Les demandes relatives à la propriété intellectuelle peuvent être adressées via le canal de
        contact juridique indiqué sur la page <LegalLink href="/contact" label="Contact" />.
      </>,
    ],
  },
  {
    id: "disponibilite",
    title: "Disponibilité et évolution du service",
    paragraphs: [
      <>
        L&apos;éditeur met en œuvre les moyens raisonnables pour assurer la disponibilité de la
        Plateforme, mais ne garantit pas une disponibilité continue et ininterrompue. Les
        indisponibilités résultant de la maintenance, de pannes de réseaux ou d&apos;opérateurs tiers,
        de cas de force majeure ou d&apos;actes de tiers ne constituent pas un manquement.
      </>,
      <>
        L&apos;éditeur peut modifier, suspendre ou retirer une fonctionnalité, y compris un canal de
        messagerie ou une intégration, en tenant compte de ses dépendances techniques externes et
        des obligations réglementaires applicables. Lorsque cette modification affecte de façon
        significative un abonnement en cours, l&apos;éditeur vous en informe et vous accorde, le cas
        échéant, un remboursement au prorata de la période non consommée.
      </>,
    ],
  },
  {
    id: "donnees",
    title: "Vos données et leur conservation",
    paragraphs: [
      <>
        Les traitements de données personnelles, leurs finalités, leur base légale, leurs durées de
        conservation, les catégories de sous-traitants et les modalités d&apos;exercice de vos droits
        sont décrits dans la{" "}
        <LegalLink href="/privacy" label="politique de confidentialité" />, qui fait partie
        intégralement des présentes conditions.
      </>,
      <>
        À la clôture définitive d&apos;un compte, les données de communication sont supprimées ou
        anonymisées selon les durées prévues par cette politique. Les données de facturation sont
        conservées pendant la durée requise par les obligations comptables et fiscales applicables.
      </>,
    ],
  },
  {
    id: "responsabilite",
    title: "Limitations de responsabilité",
    paragraphs: [
      <>
        Dans la limite permise par la loi applicable, l&apos;éditeur ne saurait être tenu responsable
        des préjudices indirects tels que perte de chiffre d&apos;affaires, perte de clientèle,
        perte de données, perte de réputation, interruption d&apos;activité, perte de communications
        ou perte de revenus, résultant de l&apos;utilisation de la Plateforme ou de son
        indisponibilité.
      </>,
      <>
        L&apos;éditeur ne peut garantir que la Plateforme sera exempte d&apos;erreurs ou d&apos;interruptions.
        Vous demeurez responsable de la sécurisation de vos accès, de vos systèmes d&apos;information
        et de vos flux de communication, et il vous appartient de mettre en place les mesures de
        continuité de votre activité.
      </>,
      <>
        L&apos;éditeur ne peut être tenu responsable des agissements des utilisateurs, des
        opposants, des fournisseurs de vos propres outils, ni des défaillances de réseaux ou
        d&apos;opérateurs tiers, y compris lorsqu&apos;elles affectent un service connecté.
      </>,
      <>
        La responsabilité résultant d&apos;un usage professionnel fautif du service, en particulier
        d&apos;un usage frauduleux, d&apos;usurpation d&apos;identité, d&apos;appel automatisé illicite ou
        d&apos;un manquement à la politique d&apos;usage acceptable, reste à votre charge.
      </>,
      <>
        Dans tous les cas, la responsabilité totale de l&apos;éditeur au titre du contrat et de la
        Plateforme est limitée au montant des sommes effectivement payées par vous au titre de
        l&apos;abonnement concerné pendant les douze mois précédant l&apos;événement à l&apos;origine de la
        demande. Cette limitation ne s&apos;applique pas en cas de faute lourde ou intentionnelle, ni
        aux dommages corporels.
      </>,
    ],
  },
  {
    id: "paiements-tiers",
    title: "Prestataires de paiement et Merchant of Record",
    paragraphs: [
      <>
        Certains paiements peuvent, à l&apos;avenir, être traités par un prestataire de paiement tiers
        /agissant en qualité de Merchant of Record (marchand-collecteur). Dans cette
        hypothèse, le prestataire de paiement est le vendeur face au client pour la transaction
        concernée et assure la perception de la TVA et des taxes applicables.
      </>,
      <>
        Cette disposition est rédigée de manière à couvrir la structure de paiement susceptible
        d&apos;être retenue pour le traitement de vos règlements. Elle ne signifie pas qu&apos;un
        prestataire de paiement tiers est actuellement en charge de vos paiements.
      </>,
      <>
        Les moyens de paiement, les modalités de règlement et la devise applicable sont indiqués
        au moment du paiement et sur la page <LegalLink href="/pricing" label="Tarifs" />. Les frais
        éventuels associés à un moyen de paiement sont indiqués avant validation.
      </>,
      <>
        Les demandes de remboursement relatives à un abonnement sont traitées conformément à la{" "}
        <LegalLink href="/refund-policy" label="politique de remboursement" />.
      </>,
    ],
    note: (
      <LegalNote>
        Le traitement effectif d&apos;un paiement par un prestataire de paiement tiers sera signalé de
        manière explicite sur le parcours de règlement et dans la facture qui vous est remise, à la
        date à laquelle il entre en vigueur.
      </LegalNote>
    ),
  },
  {
    id: "conformite",
    title: "Conformité et obligations professionnelles",
    paragraphs: [
      <>
        Vous êtes seul responsable du respect des obligations applicables à votre activité, y
        compris la protection des données personnelles de vos interlocuteurs, la conservation des
        enregistrements d&apos;appels, l&apos;information préalable des personnes concernées, les règles
        de prospection téléphonique, de prospection par SMS ou par messagerie, ainsi que
        l&apos;obligation de disposer d&apos;un numéro déclaré ou d&apos;une identification d&apos;appelant
        lorsque la réglementation locale l&apos;impose.
      </>,
      <>
        Vous ne pouvez pas utiliser la Plateforme pour envoyer, recevoir ou diffuser des contenus
        illicites, pour porter atteinte aux droits d&apos;autrui, ou pour diffuser des virus, codes
        malveillants ou contenus de nature à perturber le service.
      </>,
    ],
  },
  {
    id: "modification",
    title: "Modification des conditions et droit applicable",
    paragraphs: [
      <>
        L&apos;éditeur peut modifier les présentes conditions. La version applicable est celle
        publiée sur cette page à la date de votre consultation. Une modification substantielle fait
        l&apos;objet d&apos;une information adressée à l&apos;adresse électronique de votre compte au moins
        quinze jours avant son entrée en vigueur.
      </>,
      <>
        En cas de désaccord avec une nouvelle version, vous pouvez résilier votre abonnement sans
        frais et avant l&apos;entrée en vigueur de cette nouvelle version, à proportion des sommes
        correspondant à la période non consommée.
      </>,
      <>
        Les présentes conditions sont soumises au droit applicable. À défaut de résolution amiable,
        les tribunaux compétents au siège de l&apos;éditeur seront seuls compétents. Lorsque des règles
        impératives protègent votre consommateur, ces règles prévalent sur les présentes
        stipulations.
      </>,
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: [
      <>
        Pour toute question relative aux présentes conditions, utilisez le canal indiqué sur la page{" "}
        <LegalLink href="/contact" label="Contact" />. Les demandes de contact relatives à la
        résiliation, au remboursement ou à l&apos;exercice de vos droits doivent être adressées par
        écrit afin de pouvoir être tracées et traitées dans les délais prévus par les présentes
        conditions.
      </>,
    ],
  },
];

export default function TermsPage() {
  const legalChannel = supportChannels.find((channel) => channel.id === "legal");

  return (
    <MarketingLayout>
      <LegalDocument
        eyebrow="Document contractuel"
        title={metaTitle}
        intro="Ce document encadre l'utilisation de la plateforme, les abonnements, les modalités de paiement, la résiliation et les engagements réciproques. Version française faisant foi."
        lastUpdated={siteConfig.legalEffectiveDate}
        sections={sections}
      >
        {legalChannel ? (
          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            Contact juridique direct :{" "}
            <a href={`mailto:${legalChannel.email}`} className="underline underline-offset-4">
              {legalChannel.email}
            </a>
          </p>
        ) : null}
      </LegalDocument>
    </MarketingLayout>
  );
}
