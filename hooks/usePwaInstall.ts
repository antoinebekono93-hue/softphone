"use client";

import { useEffect, useState, useCallback } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Hook qui capture l'événement `beforeinstallprompt` (Chrome Android / Edge)
 * et expose une fonction `triggerPrompt` pour déclencher l'installation à la demande.
 * Safari / Firefox ne supportent pas cet event — la bannière n'apparaîtra pas.
 */
export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [wasDismissed, setWasDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si déjà installé (standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Ne pas re-proposer si déjà refusé dans cette session
    const dismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      setWasDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Détecter si installé après le prompt
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const triggerPrompt = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  }, [installPrompt]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem("pwa-install-dismissed", "1");
    setWasDismissed(true);
    setInstallPrompt(null);
  }, []);

  const canInstall = !!installPrompt && !isInstalled && !wasDismissed;

  return { canInstall, triggerPrompt, dismiss, isInstalled };
}
