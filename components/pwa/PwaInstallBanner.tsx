"use client";

import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Bannière discrète en bas de l'écran proposant d'installer la PWA.
 * S'affiche uniquement sur Chrome Android / Edge via beforeinstallprompt.
 * Se masque automatiquement sur iOS (Safari gère son propre mécanisme).
 * Apparaît avec un délai de 3 secondes pour ne pas interrompre le premier chargement.
 */
export function PwaInstallBanner() {
  const { canInstall, triggerPrompt, dismiss } = usePwaInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!canInstall) return;
    // Délai pour ne pas apparaître dès le chargement initial
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, [canInstall]);

  if (!visible) return null;

  return (
    <div
      className={`
        fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3
        bg-[var(--bg-surface)] border border-[var(--border-subtle)]
        rounded-2xl shadow-2xl shadow-black/40
        px-4 py-3
        max-w-sm w-[calc(100%-2rem)]
        transition-all duration-500
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-[var(--brand)]" />
      </div>

      {/* Texte */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
          Installer Antigravity
        </p>
        <p className="text-xs text-[var(--text-secondary)] leading-tight mt-0.5">
          Accès rapide depuis votre écran d&apos;accueil
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={triggerPrompt}
          className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold hover:opacity-90 transition-opacity active:scale-95"
        >
          Installer
        </button>
        <button
          onClick={() => { dismiss(); setVisible(false); }}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
