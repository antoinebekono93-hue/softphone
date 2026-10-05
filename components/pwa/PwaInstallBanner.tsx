"use client";

import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Bannière discrète en bas de l'écran proposant d'installer la PWA.
 * - Chrome Android / Edge : utilise l'événement beforeinstallprompt → bouton "Installer".
 * - iOS Safari : affiche les instructions manuelles "Partager → Ajouter à l'écran d'accueil".
 * - Apparaît avec un délai de 3 secondes pour ne pas interrompre le premier chargement.
 */
export function PwaInstallBanner() {
  const { canInstall, triggerPrompt, dismiss, isIOS } = usePwaInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!canInstall) return;
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, [canInstall]);

  if (!visible) return null;

  return (
    <div
      className={`
        fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50
        flex items-start gap-3
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
      {/* Icône */}
      <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center shrink-0 mt-0.5">
        {isIOS ? (
          <Share className="w-5 h-5 text-[var(--brand)]" />
        ) : (
          <Download className="w-5 h-5 text-[var(--brand)]" />
        )}
      </div>

      {/* Texte */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
          Installer Buster Call
        </p>
        {isIOS ? (
          // Instructions spécifiques iOS Safari
          <p className="text-xs text-[var(--text-secondary)] leading-snug mt-1">
            Appuyez sur{" "}
            <span className="inline-flex items-center gap-0.5 font-semibold text-[var(--text-primary)]">
              <Share className="w-3 h-3" /> Partager
            </span>
            {" "}puis{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              « Ajouter à l&apos;écran d&apos;accueil »
            </span>
          </p>
        ) : (
          <p className="text-xs text-[var(--text-secondary)] leading-tight mt-0.5">
            Accès rapide depuis votre écran d&apos;accueil
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-start gap-2 shrink-0 mt-0.5">
        {/* Sur Android/Chrome : bouton "Installer" ; sur iOS : juste fermer */}
        {!isIOS && (
          <button
            onClick={triggerPrompt}
            className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold hover:opacity-90 transition-opacity active:scale-95"
          >
            Installer
          </button>
        )}
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
