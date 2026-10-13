"use client";

import { Clock, Grid3x3, MessageCircle, Star, Users, type LucideIcon } from "lucide-react";

export type PhoneTab = "favorites" | "recents" | "contacts" | "dialer" | "messages";

const TABS: { id: PhoneTab; label: string; icon: LucideIcon }[] = [
  { id: "favorites", label: "Favoris", icon: Star },
  { id: "recents", label: "Récents", icon: Clock },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "dialer", label: "Clavier", icon: Grid3x3 },
  { id: "messages", label: "Messagerie", icon: MessageCircle },
];

/**
 * Barre d'onglets basse type app Téléphone iOS (5 onglets, Clavier au centre).
 * Respecte la safe-area basse et reste au-dessus du contenu du shell.
 */
export function MobileBottomTabBar({
  active,
  onChange,
  badges,
}: {
  active: PhoneTab;
  onChange: (tab: PhoneTab) => void;
  badges?: Partial<Record<PhoneTab, number>>;
}) {
  return (
    <nav
      role="tablist"
      aria-label="Sections du téléphone"
      className="flex shrink-0 items-stretch border-t border-[var(--border-subtle)] bg-[var(--bg-glass)] backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        const badge = badges?.[tab.id] ?? 0;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => onChange(tab.id)}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-colors ${
              isActive ? "text-[var(--brand)]" : "text-[var(--text-muted)]"
            }`}
          >
            <span className="relative">
              <Icon className="h-6 w-6" aria-hidden="true" strokeWidth={isActive ? 2.4 : 2} />
              {badge > 0 && (
                <span className="absolute -right-2 -top-1 min-w-[16px] rounded-full bg-[var(--danger)] px-1 text-center text-[10px] font-semibold leading-4 text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
