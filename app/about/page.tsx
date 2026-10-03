import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout, PageHero, SectionHeading, LegalIdentity } from "@/components/marketing";
import { siteConfig } from "@/lib/site-config";

const metaTitle = "À propos";

export const metadata: Metadata = {
  title: metaTitle,
  description:
    "Antigravity réunit téléphonie professionnelle, softphone cloud, routage d'appels, messagerie et agents vocaux IA dans une plateforme de communication d'entreprise. Découvrez notre mission et notre vision.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/about",
    title: `${metaTitle} | ${siteConfig.brand}`,
    description:
      "Une plateforme de communication d'entreprise : numéros professionnels, softphone cloud, routage, messagerie et intelligence artificielle vocale.",
  },
};

const audiences = [
  {
    title: "Agences et cabinets de conseil",
    body: "Chaque collaborateur dispose d'un numéro professionnel, d'une softphone dans le navigateur, et les appels entrants sont routés vers la bonne personne sans intervention.",
  },
  {
    title: "Commerce et services",
    body: "Les appels manqués sont récupérés par un agent vocal qui qualifie la demande, prend rendez-vous et transmet les informations utiles à l'équipe.",
  },
  {
    title: "Santé et professions libérales",
    body: "Les demandes sont traitées dans des limites de durée et de contenu définies par l'organisation, et les échanges restent traçables.",
  },
  {
    title: "Logistique et industrie",
    body: "Les communications terrain passent par un canal unifié, avec routage des appels urgents et historisation des échanges.",
  },
  {
    title: "Équipes commerciales",
    body: "Les prospections sortientes utilisent des numéros identifiés, avec des règles d'usage qui protègent la réputation des numéros de l'entreprise.",
  },
  {
    title: "Directions et secrétariat",
    body: "Un routage explicite remplace les standardeurs : chaque appel est dirigé vers le bon interlocuteur et chaque message est tracé.",
  },
];

const capabilities = [
  {
    title: "Numéros professionnels",
    body: "Attribution et gestion de numéros dans les pays où vous exercez, avec identification d'appelant et routage des appels entrants.",
  },
  {
    title: "Softphone cloud",
    body: "Un poste téléphonique dans le navigateur et sur mobile, sans installation, utilisable au bureau comme en déplacement.",
  },
  {
    title: "Appels et routage",
    body: "Distribution des appels selon la disponibilité, l'horaire, la compétence ou l'intention, avec files d'attente et transfert.",
  },
  {
    title: "Messagerie multicanal",
    body: "SMS et messagerie WhatsApp reliés au même dossier client et aux mêmes agents, selon les canaux activés sur votre compte.",
  },
  {
    title: "Agents vocaux IA",
    body: "Des agents vocaux qui répondent, qualifient, prennent rendez-vous et analysent les conversations, avec transcription.",
  },
  {
    title: "Analytiques",
    body: "Vue d'ensemble du trafic, durée des appels, sujets abordés et taux de transformation, avec export des données.",
  },
];

export default function AboutPage() {
  return (
    <MarketingLayout>
      <PageHero
        badge="À propos"
        accent="violet"
        title={
          <>
            La communication d&apos;entreprise, <span className="n8n-gradient-text">réunie au même endroit</span>
          </>
        }
        subtitle="Antigravity est une plateforme de communication B2B qui réunit téléphonie professionnelle, messagerie multicanal, routage d'appels et agents vocaux assistés par intelligence artificielle, dans un produit unique destiné aux équipes."
      />

      <section className="px-5 sm:px-6 max-w-4xl mx-auto w-full pb-16">
        <SectionHeading
          title="Ce que nous faisons"
          subtitle="Nous construisons une couche de communication qui relie les personnes, les numéros et les systèmes d'information d'une entreprise."
        />
        <LegalIdentity />
        <div className="space-y-4 text-[15px] leading-relaxed text-[var(--text-secondary)] mt-6">
          <p>
            Une entreprise qui gère ses appels sur plusieurs outils dispersés perd du temps en
            transferts, en information répétée et en outils qui ne se parlent pas. Antigravity a été
            conçu pour supprimer cette dispersion : un seul numéro, un seul poste téléphonique, un
            seul historique de conversation, et des agents capables de traiter la partie répétitive
            du travail.
          </p>
          <p>
            La plateforme couvre la chaîne complète d&apos;un appel professionnel : attribution du
            numéro, établissement de l&apos;appel dans le navigateur ou sur mobile, distribution vers
            le bon interlocuteur, réponse automatisée lorsqu&apos;aucun humain n&apos;est disponible, puis
            exploitation de l&apos;échange sous forme de transcription, de synthèse et d&apos;indicateurs.
          </p>
          <p>
            Nous evitons volontairement tout ce qui repose sur des éléments non vérifiables. Nous
            ne publions ni classement, ni certification, ni référence client que nous ne pouvons pas
            justifier. Les chiffres que nous avançons sont ceux que nous pouvons mesurer, et les
            fonctions disponibles sont celles qui sont effectivement en production.
          </p>
        </div>
      </section>

      <section className="px-5 sm:px-6 max-w-6xl mx-auto w-full pb-16">
        <SectionHeading
          title="Ce que la plateforme fait"
          subtitle="Les six briques de la chaîne de communication, réunies dans un même produit."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"
            >
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 sm:px-6 max-w-6xl mx-auto w-full pb-16">
        <SectionHeading
          title="À qui cela s'adresse"
          subtitle="Des organisations qui utilisent le téléphone comme outil de vente, de service et de relation."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {audiences.map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"
            >
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 sm:px-6 max-w-4xl mx-auto w-full pb-16">
        <SectionHeading title="Mission" subtitle="Notre raison d'exister, en une phrase." />
        <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
          Donner à chaque entreprise, quelle que soit sa taille, un canal de communication
          professionnel fiable, mesurable et honnête : un numéro qui répond, un poste qui
          fonctionne partout, des agents qui prennent le relais quand l&apos;équipe ne peut pas, et des
          données que l&apos;équipe peut vérifier.
        </p>
      </section>

      <section className="px-5 sm:px-6 max-w-4xl mx-auto w-full pb-20">
        <SectionHeading
          title="Vision Telecom Intelligence OS"
          subtitle="La trajectoire que nous donnons à la plateforme."
        />
        <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Un système d&apos;exploitation de l&apos;intelligence des télécommunications n&apos;est pas un
            simple softphone : c&apos;est la couche qui relie chaque canal de communication d&apos;une
            entreprise à son information métier. L&apos;objectif est qu&apos;un appel entrant,
            un SMS ou un message WhatsApp soit compris, qualifié, rattaché à la bonne fiche et
            traité sans ressaisie, puis mesuré pour améliorer la prise en charge.
          </p>
          <p className="text-[15px] leading-relaxed text-[var(--text-secondary)] mt-4">
            Cette trajectoire suppose que les briques soient d&apos;abord fiables et vérifiables. Nous
            considérons donc qu&apos;une fonctionnalité n&apos;est annoncée que lorsqu&apos;elle est
            réellement disponible, et qu&apos;un chiffre n&apos;est publié que lorsqu&apos;il est mesurable.
            C&apos;est une contrainte que nous nous imposons, et c&apos;est ce qui rendra la plateforme
            crédible auprès des équipes qui l&apos;utilisent au quotidien.
          </p>
        </div>
      </section>

      <section className="px-5 sm:px-6 max-w-4xl mx-auto w-full pb-20">
        <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
            Voir la plateforme en détail
          </h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-xl mx-auto mb-6">
            Consultez les tarifs et le contenu exact de chaque offre, les fonctions d&apos;IA vocale, ou
            écrivez-nous pour une question précise.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pricing"
              className="n8n-gradient-bg text-white px-6 py-3 rounded-full text-sm font-bold"
            >
              Voir les tarifs
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] text-[var(--text-primary)] px-6 py-3 text-sm font-bold"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
