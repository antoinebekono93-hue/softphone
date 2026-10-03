import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingLayout,
  LegalDocument,
  LegalNote,
  type LegalSectionData,
} from "@/components/marketing";
import { siteConfig, supportChannels } from "@/lib/site-config";

const metaTitle = "Politique de remboursement";

export const metadata: Metadata = {
  title: metaTitle,
  description:
    "Conditions de remboursement des abonnements Antigravity : cas éligibles, délai pour demander, abonnements et renouvellements, consommations de minutes et de messages, recharges de solde, procédure de demande et délai de traitement.",
  alternates: { canonical: "/refund-policy" },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: "/refund-policy",
    title: `${metaTitle} | ${siteConfig.brand}`,
    description:
      "Cas éligibles au remboursement, délai pour déposer une demande, abonnements, consommations déjà réalisées et procédure de traitement.",
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
    id: "principe",
    title: "Principe",
    paragraphs: [
      <>
        La Plateforme fournit des services numériques et des communications de télécommunications
        dont l&apos;usage est immédiat et irréversible. Le droit de rétractation légal ne s&apos;applique
        donc pas à ce type de prestation lorsqu&apos;il a commencé à être exécuté avec votre accord
        préalable.
      </>,
      <>
        Conformément à ces conditions, tout abonnement souscrit sur la Plateforme est un paiement
        récurrent sans engagement de durée, renouvelé automatiquement jusqu&apos;à annulation, et
        n&apos;est pas remboursable au prorata du temps restant de la période en cours.
      </>,
      <>
        La présente politique définit malgré tout les cas dans lesquels un remboursement est
        accordé, à titre commercial, ainsi que la procédure à suivre pour en bénéficier. Elle
        s&apos;ajoute aux droits que vous pouvez ejercers en application de la législation
        impérative applicable, qui ne peuvent être ni limités ni supprimés par ce document.
      </>,
    ],
  },
  {
    id: "droits-imperatifs",
    title: "Droits impératifs et réclamations",
    paragraphs: [
      <>
        Conformément à l&apos;article L221-28 du code de la consommation, les dispositions légales
        relatives au droit de rétractation ne s&apos;appliquent pas à la fourniture d&apos;un contenu
        numérique qui n&apos;est pas fourni sur un support matériel lorsque l&apos;exécution a commencé
        avec votre accord préalable et que vous avez expressément renoncé à votre droit de
        rétractation.
      </>,
      <>
        Cette dérogation ne porte jamais atteinte à vos droits en cas de défaut de conformité, de
        manquement de l&apos;éditeur à ses obligations, d&apos;affichage de contenus mensongers, ou à toute autre
        faculté ouverte par la loi. L&apos;article L221-18 du code de la consommation vous permet
        également de demander un remboursement lorsque la fourniture n&apos;a pas été réalisée dans
        les trente jours suivant la commande.
      </>,
      <>
        Toute réclamation relative à la facturation doit être adressée à l&apos;éditeur selon la
        procédure décrite ci-dessous. Vous conservez l&apos;ensemble des moyens de preuve utiles à
        l&apos;appui de votre demande.
      </>,
    ],
    note: (
      <LegalNote>
        Si votre situation relève d&apos;un droit impératif de la réglementation applicable dans votre
        pays de résidence, ce droit prévaut sur les clauses commerciales ci-dessous et peut être
        exercé auprès de l&apos;éditeur ou, le cas échéant, devant l&apos;autorité compétente.
      </LegalNote>
    ),
  },
  {
    id: "eligible",
    title: "Cas éligibles à un remboursement",
    paragraphs: [
      <>
        Un remboursement peut être accordé dans les cas suivants, sur demande :
      </>,
    ],
    list: [
      <>
        <strong className="text-[var(--text-primary)]">Doublon de paiement</strong> : votre compte a
        été débité à deux reprises pour la même période de facturation.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Prélèvement après annulation</strong> : un
        montant a été prélevé pour une période déjà annulée au titre du renouvellement
        automatique.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Prestation non fournie</strong> : l&apos;abonnement
        souscrit n&apos;a pas été activé ou n&apos;a pas été fourni, alors que le paiement a été
        accepté.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Indisponibilité majeure et prolongée</strong> :
        une interruption de service affectant la fonction principale de la Plateforme pendant une
        durée prolongée significativement supérieure aux incidents techniques ordinaires.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Non-conformité substantielle</strong> :
        l&apos;abonnement ne correspond pas de manière importante à ce qui a été vendu ou annoncé.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Erreur de justification ou de tarif</strong> :
        un montant a été appliqué au titre d&apos;un abonnement ou d&apos;une consommation ne
        correspondant pas à votre situation.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Rupture de l&apos;offre par l&apos;éditeur</strong> :
        une fonctionnalité incluse dans l&apos;abonnement est retirée de manière significative,
        conformément aux conditions d&apos;évolution du service prévues dans les{" "}
        <LegalLink href="/terms" label="Conditions générales" />.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Règlement non autorisé</strong> : un débit
        est contested à la suite d&apos;un usage frauduleux du compte ou d&apos;une compromission de
        vos identifiants, sous réserve des mesures de sécurité raisonnablement attendues de votre
        part.
      </>,
    ],
  },
  {
    id: "non-eligible",
    title: "Cas ne donnant pas lieu à remboursement",
    paragraphs: [
      <>
        Ne donnent pas lieu à remboursement, sauf disposition légale impérative :
      </>,
    ],
    list: [
      <>Le temps restant d&apos;une période d&apos;abonnement déjà payée et déjà entamée.</>,
      <>
        Les consommations de minutes, d&apos;appels ou de messages déjà effectuées, ainsi que les
        frais d&apos;acheminement correspondant facturés par nos opérateurs de télécommunications.
      </>,
      <>
        Les recharges de solde prépayé et les crédits déjà consommés, ces prestations étant
        directement exécutables et sans possibilité de reprise une fois le service rendu.
      </>,
      <>
        Les abonnements résiliés puis souscrits de nouveau, lorsqu&apos;il s&apos;agit d&apos;une
        nouvelle période de service.
      </>,
      <>
        Les demandes fondées sur une insatisfaction subjective, sans défaut technique, sans
        manquement de l&apos;éditeur et sans écart entre le service rendu et le service vendu.
      </>,
      <>
        Les amendes ou pénalités appliquées par un opérateur, une autorité ou un tiers, ainsi que
        les amendes ou pénalités appliquées par un opérateur, une autorité ou un tiers, ainsi
        que les sanctions administratives, qui restent à la charge du client.
      </>,
      <>
        Les demandes de remboursement exprimées au-delà du délai prévu à l&apos;article « Délai pour
        déposer une demande ».
      </>,
      <>
        Les refus de remboursement demandés par le prestataire de paiement lorsque le paiement a
        été effectué sur un canal hors du périmètre de l&apos;éditeur.
      </>,
    ],
  },
  {
    id: "delai-demande",
    title: "Délai pour déposer une demande",
    list: [
      <>
        Pour un doublon de paiement ou un prélèvement contesté : dans les <strong
          className="text-[var(--text-primary)]"
        >
          60 jours
        </strong>{" "}
        suivant la date du relevé correspondant.
      </>,
      <>
        Pour tout autre motif : dans les <strong className="text-[var(--text-primary)]">30 jours</strong>{" "}
        suivant le fait à l&apos;origine de l&apos;incident, afin de permettre la vérification technique.
      </>,
      <>
        Pour une résiliation anticipée invoquée sur le fondement d&apos;un manquement de l&apos;éditeur
        ou d&apos;une pratique commerciale agressive : à tout moment.
      </>,
    ],
    paragraphs: [
      <>
        Les droits impératifs de réclamation Issuing de la réglementation applicable demeurent
        ouverts au-delà de ces délais commerciaux.
      </>,
    ],
  },
  {
    id: "abonnements",
    title: "Abonnements et renouvellements",
    paragraphs: [
      <>
        Les abonnements sont facturés au début de chaque période d&apos;un mois et se renouvlent
        automatiquement jusqu&apos;à annulation. La période de la facturation suivante est réservée
        au moment du renouvellement ; elle n&apos;est pas remboursable au prorata.
      </>,
      <>
        Si vous annulez le renouvellement avant la date d&apos;échéance, aucun nouveau prélèvement
        n&apos;est effectué. Si un prélèvement a déjà eu lieu pour une période qui ne sera pas
        utilisée, ce montant est remboursé conformément à la section « Cas éligibles ».
      </>,
      <>
        Si vous avez souscrit puis résilié un abonnement dans les premiers jours de la période
        alors que le service n&apos;a pas été utilisé, la demande est examinée au cas par cas et peut
        faire l&apos;objet d&apos;un remboursement au titre de la période non consommée.
      </>,
    ],
  },
  {
    id: "consommations",
    title: "Services déjà consommés et usage télécom",
    paragraphs: [
      <>
        Les communications vocales et les messages sont acheminés par des réseaux de
        télécommunications opérateurs tiers. Dès qu&apos;un appel ou un message est transmis, la
        ressource correspondante est consommée de façon définitive : elle ne peut pas faire l’objet d’une reprise matérielle, et
        l&apos;éditeur n&apos;a pas la maîtrise du coût déjà engagé auprès de l&apos;opérateur.
      </>,
      <>
        En conséquence, les minutes PSTN, les appels vers des numéros surtaxés ou des numéros
        premium, les SMS et les messages WhatsApp effectivement envoyés ou reçus sont considérés
        comme des services fournis et ne sont pas remboursés, y compris en cas d&apos;erreur de
        saisie, de destinataire incorrect, de message non lu ou d&apos;appel non abouti côté
        destinataire lorsque l&apos;appel a été établi.
      </>,
      <>
        Les volumes de minutes ou de messages inclus dans un abonnement qui n&apos;ont pas été
        consommés ne sont ni reportés ni remboursés en cas de résiliation avant la fin de la
        période : ils sont perdus à l&apos;issue de la période pour laquelle ils ont été acquis.
      </>,
      <>
        Les protections techniques d&apos;usage loyal (durée maximale d&apos;appel, nombre d&apos;appels
        simultanés ou par période) ne constituent pas un quota commercial et ne donnent lieu à
        aucun remboursement lorsqu&apos;elles bloquent un appel ou une campagne.
      </>,
    ],
  },
  {
    id: "recharges",
    title: "Recharges de solde et wallet",
    paragraphs: [
      <>
        Les recharges de solde prépayé sont des crédits d&apos;appel immédiatement utilisables. Une
        recharge n&apos;est pas remboursable dès lors qu&apos;elle a été créditée sur votre compte et
        qu&apos;elle a commencé à être utilisée, le solde étantfungible et sans fractionnement
        possible entre comptes.
      </>,
      <>
        Ne sont pas remboursables : les crédits partiellement consommés, les crédits consommés
        involontairement à la suite d&apos;une erreur de manipulation, et les crédits gaspillés lors
        d&apos;une campagne d&apos;appel ou de messagerie.
      </>,
      <>
        Peuvent faire l&apos;objet d&apos;un remboursement, après vérification : les crédits crédités par
        erreur et non consommés, et les crédits correspondant à un paiement dupliqué.
      </>,
      <>
        Aucune recharge automatique ne doit être activée sans votre consentement explicite. Si vous
        avez activé un réapprovisionnement automatique et souhaitez le désactiver, la demande doit
        être formulée avant le prochain débit.
      </>,
    ],
  },
  {
    id: "procedure",
    title: "Procédure de demande",
    list: [
      <>L&apos;identité de l&apos;organisation et l&apos;adresse électronique associée au compte.</>,
      <>La date de la facturation ou du débit contesté.</>,
      <>Le montant concerné et la référence de la transaction ou de la facture.</>,
      <>Une description précise du motif de la demande.</>,
      <>
        Les pièces justificatives utiles : capture du relevé bancaire, capture d&apos;écran, référence
        technique de l&apos;incident.
      </>,
    ],
    paragraphs: [
      <>
        Pour déposer une demande, adressez-vous au support via le canal indiqué sur la page{" "}
        <LegalLink href="/contact" label="Contact" /> et fournissez les éléments ci-dessus.
      </>,
      <>
        Une demande incomplète peut être suspendue jusqu&apos;à fourniture des informations
        manquantes. Vous recevez un accusé de réception ainsi que la date de début du délai de
        traitement.
      </>,
    ],
  },
  {
    id: "traitement",
    title: "Délai de traitement et modalités de remboursement",
    paragraphs: [
      <>
        Une demande recevable est examinée dans un délai raisonnable, généralement de cinq jours
        ouvrés à quinze jours ouvrés selon la nature de la demande. Ce délai peut être dépassé
        lorsque la vérification nécessite l&apos;avis d&apos;un opérateur de télécommunications ou d&apos;un
        prestataire de paiement, ou lorsque vous ne fournissez pas les informations demandées. Dans
        ce cas, nous vous en informons et vous indiquons le délai supplémentaire nécessaire.
      </>,
      <>
        Lorsqu&apos;un remboursement est accordé, il est effectué par le canal utilisé pour le paiement
        d&apos;origine, selon la devise du paiement initial. Vous n&apos;êtes pas en droit d&apos;exiger un
        remboursement sous une autre forme, sauf disposition légale impérative.
      </>,
      <>
        Le délai d&apos;inscription du remboursement auprès de votre établissement bancaire dépend de
        votre banque et n&apos;est pas maîtrisé par l&apos;éditeur. Nous vous communiquons la référence du
        remboursement dès son émission.
      </>,
      <>
        Un remboursement n&apos;entraîne pas la clôture de votre compte. Lorsque le remboursement porte
        sur une période déjà entamée, votre abonnement peut être ajourné à compter de la période
        suivante afin que vous ne soyez pas facturé pour une période non utilisée.
      </>,
    ],
    note: (
      <LegalNote>
        Certains paiements peuvent être traités par un prestataire de paiement tiers.
        Lorsqu&apos;un remboursement est demandé sur un canal de règlement délégué, la demande est
        transmise à ce prestataire, qui reste seul juge de l&apos;éligibilité du remboursement à
        l&apos;égard de sa propre transaction. L&apos;éditeur vous accompagne dans cette démarche et vous
        communique la référence transmise.
      </LegalNote>
    ),
  },
  {
    id: "modification",
    title: "Modification de la politique de remboursement",
    paragraphs: [
      <>
        La présente politique peut être mise à jour. La version applicable est celle publiée sur
        cette page à la date de votre demande. La version ayant fait l&apos;objet de l&apos;acceptation de
        vos conditions au moment de la souscription reste applicable à cette souscription.
      </>,
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: [
      <>
        Pour toute demande de remboursement, utilisez le canal indiqué sur la page{" "}
        <LegalLink href="/contact" label="Contact" />. Les demandes doivent être adressées par écrit
        afin de pouvoir être tracées, datées et traitées dans les délais indiqués ci-dessus.
      </>,
    ],
  },
];

export default function RefundPolicyPage() {
  const paymentChannel = supportChannels.find((channel) => channel.id === "payment");

  return (
    <MarketingLayout>
      <LegalDocument
        eyebrow="Remboursements"
        title={metaTitle}
        intro="Cette politique décrit les cas dans lesquels un abonnement ou une consommation peut être remboursé, le délai pour déposer une demande, la procédure à suivre et les délais de traitement. Elle ne limite pas les droits que vous tenez de la législation impérative."
        lastUpdated={siteConfig.legalEffectiveDate}
        sections={sections}
      >
        {paymentChannel ? (
          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            Demande de remboursement :{" "}
            <a href={`mailto:${paymentChannel.email}`} className="underline underline-offset-4">
              {paymentChannel.email}
            </a>
          </p>
        ) : null}
      </LegalDocument>
    </MarketingLayout>
  );
}
