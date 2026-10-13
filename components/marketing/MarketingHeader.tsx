"use client";

import "./marketing-responsive.css";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/ia", label: "IA" },
  { href: "/receptionniste-ia", label: "Répondeur IA" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/etudes-de-cas", label: "Scénarios d'usage" },
  { href: "/integrations", label: "Intégrations" },
];

export default function MarketingHeader() {
  const [openPath, setOpenPath] = useState<string | null>(null);
  const pathname = usePathname();
  const open = openPath === pathname;
  const menuButton = useRef<HTMLButtonElement>(null);

useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpenPath(null); menuButton.current?.focus(); }
    };
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpenPath(null); };
    document.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  return (
    <header onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpenPath(null); }} className="marketing-header fixed top-0 inset-x-0 flex items-center justify-between px-4 sm:px-6 mx-auto w-full z-50 bg-[var(--bg-base)] xl:bg-[var(--bg-base)]/70 xl:backdrop-blur-xl border-b border-[var(--border-subtle)]">
      {pathname === "/" && <a href="#landing-content" className="marketing-skip-link">Aller au contenu</a>}
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 min-w-0 xl:flex-1">
          <Link href="/" className="marketing-logo flex items-center gap-2">
            <div className="w-6 h-6 rounded-md n8n-gradient-bg shadow-[0_0_15px_rgba(34,211,238,0.4)]"></div>
            <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Buster Call</span>
          </Link>
        </div>

        <nav className="hidden xl:flex gap-4 xl:gap-7 text-sm font-bold text-[var(--text-secondary)]" role="navigation" aria-label="Menu principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors ${pathname === link.href ? "text-[var(--text-primary)]" : "hover:text-[var(--text-primary)]"}`}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="marketing-header-actions flex items-center ml-auto xl:flex-1 justify-end">
          <div className="marketing-theme-toggle"><ThemeToggle /></div>
          <Link href="/login" className="text-sm font-medium text-[var(--text-primary)] hover:opacity-70 transition-opacity hidden sm:block">
            Connexion
          </Link>
          <Link href="/register" className="marketing-register text-sm font-medium n8n-gradient-bg text-white rounded-full transition-transform hover:scale-105 shadow-lg shadow-cyan-500/20">
            Créer un compte
          </Link>
          <button
            ref={menuButton}
            onClick={() => setOpenPath(open ? null : pathname)}
            className="xl:hidden flex flex-col justify-center items-center w-11 h-11 gap-1.5"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="marketing-mobile-menu"
          >
            <span className={`w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-300 ${open ? "rotate-45 translate-y-[4px]" : ""}`} />
            <span className={`w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-300 ${open ? "-rotate-45 -translate-y-[4px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      <div
        className={`marketing-menu-overlay xl:hidden fixed inset-0 bg-black/60 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpenPath(null)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        id="marketing-mobile-menu"
        inert={!open}
        aria-hidden={!open}
        onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setOpenPath(null); }}
        className={`marketing-mobile-menu xl:hidden fixed inset-x-0 overflow-y-auto overscroll-contain bg-[var(--bg-base)] border-b border-[var(--border-subtle)] transition-[transform,opacity,visibility] duration-200 ${open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0 pointer-events-none"}`}
        role="navigation"
        aria-label="Menu mobile"
      >
        <nav className="flex flex-col p-4 sm:p-6 gap-1">
          <div className="marketing-mobile-theme"><ThemeToggle /></div>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "n8n-gradient-bg text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="border-t border-[var(--border-subtle)] mt-3 pt-4 flex flex-col gap-2">
            <Link href="/login" className="px-4 py-3 rounded-xl text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all text-center">
              Connexion
            </Link>
            <Link href="/register" className="n8n-gradient-bg text-white px-4 py-3 rounded-xl text-sm font-bold text-center shadow-lg shadow-cyan-500/20">
              Créer un compte
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
