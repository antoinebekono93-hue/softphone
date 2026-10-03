import Link from "next/link";
import { legalLinks, siteConfig } from "@/lib/site-config";

const productLinks = [
  { href: "/#features", label: "Fonctionnalités" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/ia", label: "IA" },
  { href: "/integrations", label: "Intégrations" },
];

const resourceLinks = [
  { href: "/receptionniste-ia", label: "Répondeur IA" },
  { href: "/etudes-de-cas", label: "Études de cas" },
  { href: "/secteurs", label: "Solutions par secteur" },
];

const companyLinks = [
  { href: "/about", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-sm font-bold text-[var(--text-primary)] mb-1">{title}</h2>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export default function MarketingFooter() {
  const year = new Date().getFullYear();
  const holder = siteConfig.legalEntity || siteConfig.brand;

  return (
    <footer className="border-t border-[var(--border-subtle)] pt-14 pb-8 px-6 sm:px-8 max-w-7xl mx-auto w-full bg-[var(--bg-base)]">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 mb-12">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <span
              aria-hidden="true"
              className="w-5 h-5 rounded bg-gradient-to-tr from-cyan-500 to-violet-500"
            />
            <span className="font-bold text-[var(--text-primary)]">{siteConfig.brand}</span>
          </div>
          <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed max-w-xs">
            Téléphonie professionnelle, softphone cloud et agents vocaux IA pour les entreprises.
          </p>
        </div>

        <LinkColumn title="Produit" links={productLinks} />
        <LinkColumn title="Ressources" links={resourceLinks} />
        <LinkColumn title="Entreprise" links={companyLinks} />
        <LinkColumn title="Légal" links={legalLinks} />
      </div>

      <div className="border-t border-[var(--border-subtle)] pt-6 flex flex-col gap-3 text-xs font-medium text-[var(--text-secondary)]">
        <p>
          © {year} {holder}. Tous droits réservés.
        </p>
        <p>
          Les communications vocales et les identifiants de canal sont fournis par nos opérateurs de
          télécommunications. Les moyens de paiement sont traités par des prestataires de paiement
          externes.
        </p>
      </div>
    </footer>
  );
}
