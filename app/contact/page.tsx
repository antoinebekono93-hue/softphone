import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout, PageHero, SectionHeading } from "@/components/marketing";
import { legalLinks, siteConfig, supportChannels } from "@/lib/site-config";

const metaTitle = "Contact";

export const metadata: Metadata = {
  title: metaTitle,
  description:
    "Contactez Antigravity : support produit, support commercial, support paiement et facturation, questions juridiques et protection des données personnelles.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/contact",
    title: `${metaTitle} | ${siteConfig.brand}`,
    description:
      "Support produit, commercial, paiement et questions juridiques : le canal de contact adapté à chaque demande.",
  },
};

export default function ContactPage() {
  const hasContact = supportChannels.length > 0;

  return (
    <MarketingLayout>
      <PageHero
        badge="Contact"
        accent="cyan"
        title={
          <>
            Une question ? <span className="n8n-gradient-text">Adressez-la au bon canal</span>
          </>
        }
        subtitle="Nous avons séparé les demandes par nature pour que votre question soit traitée par le bon interlocuteur, dans les meilleurs délais."
      />

      <section className="px-5 sm:px-6 max-w-5xl mx-auto w-full pb-16">
        {hasContact ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {supportChannels.map((channel) => (
              <article
                key={channel.id}
                className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 flex flex-col gap-3"
              >
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{channel.title}</h2>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {channel.scope}
                </p>
                <a
                  href={`mailto:${channel.email}`}
                  className="mt-auto pt-3 text-sm font-semibold text-[var(--brand)] hover:underline break-all"
                >
                  {channel.email}
                </a>
                <p className="text-xs text-[var(--text-muted)]">{channel.responseTime}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              Canaux de contact en cours de publication
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-xl mx-auto">
              Les adresses de contact dédiées au support produit, au support commercial, au support
              paiement et aux questions juridiques sont en cours de mise en ligne. Elles seront
              publiées sur cette page dès leur disponibilité.
            </p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-xl mx-auto mt-4">
              En attendant, vous pouvez poser vos questions lors de la création de votre compte. La
              documentation produit est disponible depuis votre espace, une fois connecté.
            </p>
          </div>
        )}
      </section>

      <section className="px-5 sm:px-6 max-w-5xl mx-auto w-full pb-16">
        <SectionHeading
          title="Avant d'écrire"
          subtitle="Ces trois points règlent la majorité des demandes et vous font gagner un échange."
        />
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              Un problème de facturation
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Indiquez la date du débit, le montant et votre identifiant de compte. Ces
              informations accélèrent le traitement.
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              Un incident technique
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Notez l&apos;heure, votre numéro, le numéro appelé et le résultat obtenu. Ces éléments
              permettent de retrouver la ligne dans nos journaux d&apos;appel.
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              Une question sur vos données
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Précisez l&apos;organisation concernée et le droit que vous souhaitez exercer. Voir la{" "}
              <Link href="/privacy" className="underline underline-offset-4">
                politique de confidentialité
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 sm:px-6 max-w-5xl mx-auto w-full pb-20">
        <SectionHeading
          title="Documents de référence"
          subtitle="Ces documents répondent à la majorité des questions sans passer par un échange."
        />
        <ul className="grid sm:grid-cols-2 gap-3">
          {legalLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {link.label}
                <span aria-hidden="true" className="text-[var(--text-muted)]">
                  →
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/pricing"
              className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Tarifs et contenu des offres
              <span aria-hidden="true" className="text-[var(--text-muted)]">
                →
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </MarketingLayout>
  );
}
