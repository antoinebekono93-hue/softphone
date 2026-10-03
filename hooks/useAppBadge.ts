"use client";

import { useEffect } from "react";

/**
 * App Badging API — affiche un badge avec le nombre d'éléments non lus
 * sur l'icône de l'application (écran d'accueil Android, dock macOS, taskbar Windows).
 * Compatible Chrome 81+, Edge 81+, Samsung Internet 14+.
 * N'a aucun effet sur Safari iOS (API non supportée).
 */
export function useAppBadge(count: number) {
  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;

    if (count > 0) {
      navigator.setAppBadge(count).catch(() => {});
    } else {
      navigator.clearAppBadge().catch(() => {});
    }

    return () => {
      // Nettoyage au démontage
      navigator.clearAppBadge?.().catch(() => {});
    };
  }, [count]);
}
