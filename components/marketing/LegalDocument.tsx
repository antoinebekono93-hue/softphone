import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export type LegalSectionData = {
  id: string;
  title: string;
  paragraphs?: React.ReactNode[];
  subsections?: { title: string; paragraphs?: React.ReactNode[]; list?: React.ReactNode[] }[];
  list?: React.ReactNode[];
  note?: React.ReactNode;
};

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2 list-disc pl-5 marker:text-[var(--text-muted)]">
      {items.map((item, index) => (
        <li key={index} className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function LegalNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
      {children}
    </p>
  );
}

export function LegalIdentity() {
  const rows = [
    siteConfig.legalEntity && { label: "Éditeur", value: siteConfig.legalEntity },
    siteConfig.tradeName &&
      siteConfig.tradeName !== siteConfig.legalEntity && { label: "Nom commercial", value: siteConfig.tradeName },
    siteConfig.companyRegistry && { label: "Immatriculation", value: siteConfig.companyRegistry },
    siteConfig.vatId && { label: "Numéro de TVA", value: siteConfig.vatId },
    siteConfig.companyAddress && {
      label: "Adresse",
      value: [siteConfig.companyAddress, siteConfig.country].filter(Boolean).join("\n"),
    },
    siteConfig.supportPhone && { label: "Téléphone", value: siteConfig.supportPhone },
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  if (rows.length === 0) {
    return null;
  }

  return (
    <dl className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col sm:flex-row sm:gap-3">
          <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] sm:w-44 shrink-0">
            {row.label}
          </dt>
          <dd className="text-sm text-[var(--text-primary)] whitespace-pre-line">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function LegalDocument({
  eyebrow,
  title,
  intro,
  lastUpdated,
  sections,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSectionData[];
  children?: React.ReactNode;
}) {
  const formattedDate = new Date(`${lastUpdated}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <>
      <div className="px-5 sm:px-6 pt-14 pb-8 max-w-4xl mx-auto w-full">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-4">
          {eyebrow}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)] text-pretty">
          {title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">{intro}</p>
        <p className="mt-4 text-sm font-medium text-[var(--text-muted)]">
          Dernière mise à jour : {formattedDate}
        </p>
        <div className="mt-6">
          <LegalIdentity />
        </div>
        {children}
      </div>

      <div className="px-5 sm:px-6 pb-16 max-w-4xl mx-auto w-full">
        <nav aria-label="Sommaire du document" className="border-t border-[var(--border-subtle)] pt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-4">
            Sommaire
          </h2>
          <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {sections.map((section, index) => (
              <li key={section.id} className="flex gap-2">
                <span className="font-mono text-xs text-[var(--text-muted)] pt-0.5 shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <a
                  href={`#${section.id}`}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors underline underline-offset-4 decoration-[var(--border-default)] hover:decoration-current"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-10">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
                <span className="font-mono text-sm text-[var(--text-muted)] mr-3">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>

              {section.paragraphs?.map((paragraph, paragraphIndex) => (
                <p
                  key={paragraphIndex}
                  className="mb-4 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                >
                  {paragraph}
                </p>
              ))}

              {section.list && (
                <div className="mt-4 mb-4">
                  <LegalList items={section.list} />
                </div>
              )}

              {section.subsections?.map((subsection, subsectionIndex) => (
                <div key={subsection.title} className="mt-6">
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
                    {subsection.title}
                  </h3>
                  {subsection.paragraphs?.map((paragraph, paragraphIndex) => (
                    <p
                      key={paragraphIndex}
                      className="mb-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {subsection.list && (
                    <div className="mt-3">
                      <LegalList items={subsection.list} />
                    </div>
                  )}
                </div>
              ))}

              {section.note && <div className="mt-4">{section.note}</div>}
            </section>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-[var(--border-subtle)] text-sm text-[var(--text-secondary)]">
          <p className="mb-3">Documents associés :</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/terms" className="underline underline-offset-4 hover:text-[var(--text-primary)]">
                Conditions générales
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-[var(--text-primary)]"
              >
                Politique de confidentialité
              </Link>
            </li>
            <li>
              <Link
                href="/refund-policy"
                className="underline underline-offset-4 hover:text-[var(--text-primary)]"
              >
                Politique de remboursement
              </Link>
            </li>
            <li>
              <Link
                href="/acceptable-use"
                className="underline underline-offset-4 hover:text-[var(--text-primary)]"
              >
                Usage acceptable
              </Link>
            </li>
            <li>
              <Link href="/contact" className="underline underline-offset-4 hover:text-[var(--text-primary)]">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
