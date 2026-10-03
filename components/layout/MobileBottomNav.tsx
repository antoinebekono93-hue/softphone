"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  Phone,
  Inbox,
  Bot,
  MessageSquare,
} from "lucide-react";
import { useTelnyx } from "@/contexts/TelnyxContext";
import { useAppCall } from "@/contexts/AppCallContext";
import { dashboardModuleHref, resolveDashboardModule } from "@/lib/dashboard-modules";

const NAV_ITEMS = [
  { id: "home", label: "Accueil", icon: Home, href: "/dashboard" },
  { id: "softphone", label: "Appels", icon: Phone, href: "/dashboard/softphone" },
  { id: "inbox", label: "Messages", icon: Inbox, href: "/dashboard/inbox" },
  { id: "ai", label: "IA", icon: Bot, href: "/dashboard/ai-team" },
  { id: "sms", label: "SMS", icon: MessageSquare, href: "/dashboard/sms" },
] as const;

/**
 * Barre de navigation fixe en bas de l'écran — visible uniquement sur mobile.
 * Reproduit le pattern "Tab Bar" natif iOS / Android.
 * Inclut des badges pour les appels entrants actifs.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeModule = resolveDashboardModule(pathname, searchParams.get("module"));
  
  // Badges d'activité
  const { callState, callDirection } = useTelnyx();
  const { appCallStatus } = useAppCall();
  
  const hasActiveCall = callState === "ringing" || callState === "active" || callState === "connecting";
  const hasInternalCall = appCallStatus === "RINGING" || appCallStatus === "ACTIVE" || appCallStatus === "CONNECTING" || appCallStatus === "OFFERING";

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[var(--bg-base)]/90 backdrop-blur-xl border-t border-[var(--border-subtle)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === "softphone"
              ? pathname === "/dashboard/softphone"
              : item.id === "home"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          const showBadge =
            item.id === "softphone" && (hasActiveCall || hasInternalCall);

          return (
            <Link
              key={item.id}
              href={
                item.id === "home" || item.id === "softphone" || item.id === "inbox"
                  ? item.href
                  : dashboardModuleHref(item.href, activeModule)
              }
              className="relative flex flex-col items-center justify-center gap-1 min-w-[3rem] min-h-[3.5rem] px-2 transition-transform active:scale-90"
              aria-label={item.label}
            >
              {/* Badge activité appel */}
              {showBadge && (
                <span className="absolute top-1.5 right-2 w-2.5 h-2.5 rounded-full bg-[var(--success)] border-2 border-[var(--bg-base)] animate-pulse" />
              )}

              {/* Pill de fond sur l'item actif */}
              {isActive && (
                <span className="absolute inset-x-1 top-1 bottom-1 rounded-2xl bg-[var(--bg-surface)] -z-10" />
              )}

              <Icon
                className={`w-5 h-5 transition-colors duration-150 ${
                  isActive
                    ? "text-[var(--brand)]"
                    : "text-[var(--text-secondary)]"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium tracking-tight transition-colors duration-150 ${
                  isActive
                    ? "text-[var(--brand)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
