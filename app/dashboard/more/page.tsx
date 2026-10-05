import Link from "next/link";
import { ChevronRight, LayoutDashboard, Settings, CreditCard, Megaphone, MessageSquare, Phone, Users, Workflow } from "lucide-react";
const items = [
  ["Tableau de bord", "Activité et indicateurs", "/dashboard", LayoutDashboard],
  ["Campagnes", "Vos campagnes de communication", "/dashboard/campaigns", Megaphone],
  ["SMS", "Envois et gestion des SMS", "/dashboard/sms", MessageSquare],
  ["Numéros", "Vos lignes professionnelles", "/dashboard/numbers", Phone],
  ["Équipe", "Membres et accès", "/dashboard/team", Users],
  ["Automatisations", "Parcours et actions", "/dashboard/automations", Workflow],
  ["Facturation", "Abonnement et consommation", "/dashboard/billing", CreditCard],
  ["Réglages", "Préférences de votre espace", "/dashboard/settings", Settings],
] as const;
export default function MorePage() {
  return <section className="max-w-2xl mx-auto px-4 py-6">
    <h1 className="text-2xl font-semibold tracking-tight">Votre espace</h1>
    <p className="mt-1 mb-6 text-sm text-[var(--text-secondary)]">Tous vos outils, au même endroit.</p>
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      {items.map(([title, description, href, Icon]) => <Link key={href} href={href} className="flex items-center gap-4 p-4 border-b last:border-0 border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--bg-base)] text-[var(--brand)]"><Icon className="h-5 w-5" /></span>
        <span className="flex-1"><span className="block font-medium">{title}</span><span className="text-sm text-[var(--text-secondary)]">{description}</span></span>
        <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
      </Link>)}
    </div>
  </section>;
}
