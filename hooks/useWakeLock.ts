"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Screen Wake Lock API — empêche l'écran de s'éteindre pendant un appel actif.
 * Se réacquiert automatiquement si la page revient au premier plan (visibilitychange).
 * Compatible Chrome 84+, Edge 84+, Opera 70+. Non disponible sur Firefox / Safari.
 */
export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      // Peut échouer si la page est en arrière-plan au moment de la demande
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (active) {
      void acquire();
    } else {
      void release();
    }

    // Réacquisition automatique quand la page revient au premier plan
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && active) {
        void acquire();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      void release();
    };
  }, [active, acquire, release]);
}
