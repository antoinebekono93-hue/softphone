"use client";

import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Hook qui capture l'événement `beforeinstallprompt` (Chrome Android / Edge)
 * et expose une fonction `triggerPrompt` pour déclencher l'installation à la demande.
 * Sur iOS Safari (pas de beforeinstallprompt), expose `isIOS` pour afficher les
 * instructions manuelles "Partager → Ajouter à l'écran d'accueil".
 */
export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [wasDismissed, setWasDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Vérifier si déjà installé (standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Détecter iOS (iPhone, iPad, iPod) — Safari ne supporte pas beforeinstallprompt
    const ua = window.navigator.userAgent;
    const iosDevice =
      /iPhone|iPad|iPod/.test(ua) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(iosDevice);

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

    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
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

  // canInstall = vrai si prompt Chrome/Android dispo OU si iOS (pour afficher les instructions manuelles)
  const canInstall = (!!installPrompt || isIOS) && !isInstalled && !wasDismissed;

  return { canInstall, triggerPrompt, dismiss, isInstalled, isIOS };
}
