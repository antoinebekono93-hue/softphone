"use client";

import { useEffect, useCallback } from "react";

/**
 * Vibration API — fait vibrer le téléphone sur appel entrant.
 * Pattern : 3 vibrations courtes séparées par des pauses (identique à
 * de nombreuses apps de téléphonie native).
 * Silencieux sur desktop / si l'API n'est pas disponible.
 */
export function useVibration(ringing: boolean) {
  const vibrate = useCallback(() => {
    if (!("vibrate" in navigator)) return;
    // Pattern : [vibration, pause, vibration, pause, ...] en ms
    navigator.vibrate([400, 200, 400, 200, 400]);
  }, []);

  const stop = useCallback(() => {
    if (!("vibrate" in navigator)) return;
    navigator.vibrate(0); // 0 = stopper immédiatement
  }, []);

  useEffect(() => {
    if (!ringing) {
      stop();
      return;
    }

    // Vibrer immédiatement puis en boucle toutes les 3 secondes
    vibrate();
    const interval = setInterval(vibrate, 3000);

    return () => {
      clearInterval(interval);
      stop();
    };
  }, [ringing, vibrate, stop]);
}
