"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Inbox, Bot, Users, Grid2X2, ArrowUpRight } from "lucide-react";
import { useTelnyx } from "@/contexts/TelnyxContext";
import { useAppCall } from "@/contexts/AppCallContext";
import { useEffect } from "react";

const ITEMS = [
  { label: "Discussions", icon: Inbox, href: "/dashboard/inbox" },
  { label: "Appels", icon: Phone, href: "/dashboard/softphone" },
  { label: "Contacts", icon: Users, href: "/dashboard/contacts" },
  { label: "Assistant", icon: Bot, href: "/dashboard/ai-team" },
  { label: "Plus", icon: Grid2X2, href: "/dashboard/more" },
];
export function MobileBottomNav() {
  const pathname = usePathname();
  const { callState } = useTelnyx();
  const { appCallStatus } = useAppCall();
  const activeCall = ["ringing", "active", "connecting"].includes(callState) ||
    ["RINGING", "ACTIVE", "CONNECTING", "OFFERING"].includes(appCallStatus);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      // Ignore pinch-zoom: accessibility zoom must not resize the app shell.
      if (viewport.scale !== 1) return;
      const editable = document.activeElement?.matches("input,textarea,[contenteditable=true]");
      const keyboard = Boolean(editable && window.innerHeight - viewport.height > 120);
      document.documentElement.dataset.keyboard = String(keyboard);
      document.documentElement.style.setProperty("--app-viewport-height", viewport.height + "px");
    };
    viewport.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    update();
    return () => {
      viewport.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      delete document.documentElement.dataset.keyboard;
      document.documentElement.style.removeProperty("--app-viewport-height");
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.activeCallBar = String(activeCall && pathname !== "/dashboard/softphone");
    return () => { delete document.documentElement.dataset.activeCallBar; };
  }, [activeCall, pathname]);
  useEffect(() => {
    const main = document.querySelector<HTMLElement>(".main-dashboard-content");
    if (!main) return;
    const key = "antigravity-scroll:" + pathname;
    let position = 0;
    try { position = Number(sessionStorage.getItem(key)) || 0; } catch {}
    const frame = requestAnimationFrame(() => { main.scrollTop = position; });
    const remember = () => { position = main.scrollTop; };
    main.addEventListener("scroll", remember, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      main.removeEventListener("scroll", remember);
      try { sessionStorage.setItem(key, String(position)); } catch {}
    };
  }, [pathname]);
  return <nav aria-label="Navigation principale" className="mobile-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--bg-base)]">
    {activeCall && pathname !== "/dashboard/softphone" && <Link href="/dashboard/softphone" className="absolute bottom-full inset-x-3 mb-2 min-h-11 rounded-xl px-4 flex items-center justify-between bg-[var(--success)] text-[var(--bg-base)] shadow-lg">
      <span className="flex items-center gap-2 text-sm font-semibold"><Phone className="h-4 w-4" /> Revenir à l’appel</span><ArrowUpRight className="h-4 w-4" />
    </Link>}
    <div className="grid grid-cols-5 h-16 px-1">
      {ITEMS.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined}
          className={"relative min-w-0 flex flex-col items-center justify-center gap-1 rounded-xl touch-manipulation transition-colors " + (isActive ? "text-[var(--brand)]" : "text-[var(--text-secondary)]")}>
          <span className={"grid h-7 w-12 place-items-center rounded-full " + (isActive ? "bg-[var(--bg-surface-hover)]" : "")}><Icon aria-hidden="true" className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} /></span>
          <span className="text-[11px] font-medium">{item.label}</span>
          {item.label === "Appels" && activeCall && <span className="absolute right-4 top-2 h-2 w-2 rounded-full bg-[var(--success)]"><span className="sr-only">Appel en cours</span></span>}
        </Link>;
      })}
    </div>
  </nav>;
}
