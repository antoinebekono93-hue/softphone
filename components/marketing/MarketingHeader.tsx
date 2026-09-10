"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/ia", label: "IA" },
  { href: "/receptionniste-ia", label: "Répondeur IA" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/etudes-de-cas", label: "Études de cas" },
  { href: "/integrations", label: "Intégrations" },
];

export default function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="fixed top-0 inset-x-0 h-16 flex items-center justify-between px-6 mx-auto w-full z-50 bg-[var(--bg-base)]/70 backdrop-blur-xl border-b border-[var(--border-subtle)]">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 flex-1">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md n8n-gradient-bg shadow-[0_0_15px_rgba(255,87,87,0.4)]"></div>
            <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Antigravity</span>
          </Link>
        </div>

        <nav className="hidden lg:flex gap-7 text-sm font-bold text-[var(--text-secondary)]" role="navigation" aria-label="Menu principal">
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

        <div className="flex gap-3 items-center flex-1 justify-end">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-medium text-[var(--text-primary)] hover:opacity-70 transition-opacity hidden sm:block">
            Connexion
          </Link>
          <Link href="/register" className="text-sm font-medium n8n-gradient-bg text-white px-4 py-2 rounded-full transition-transform hover:scale-105 shadow-lg shadow-rose-500/20 hidden sm:block">
            Essai Gratuit
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            <span className={`w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-300 ${open ? "rotate-45 translate-y-[4px]" : ""}`} />
            <span className={`w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-300 ${open ? "-rotate-45 -translate-y-[4px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      <div
        className={`lg:hidden fixed inset-0 top-16 bg-[var(--bg-base)]/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-16 inset-x-0 bg-[var(--bg-base)]/95 backdrop-blur-xl border-b border-[var(--border-subtle)] transition-all duration-300 overflow-hidden ${open ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"}`}
        role="navigation"
        aria-label="Menu mobile"
      >
        <nav className="flex flex-col p-6 gap-1">
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
            <Link href="/register" className="n8n-gradient-bg text-white px-4 py-3 rounded-xl text-sm font-bold text-center shadow-lg shadow-rose-500/20">
              Essai Gratuit
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}