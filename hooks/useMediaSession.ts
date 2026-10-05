"use client";

import { useEffect, useCallback } from "react";

interface MediaSessionConfig {
  title: string;
  artist?: string;
  isActive: boolean;
  onMute?: () => void;
  onHangup?: () => void;
}

/**
 * Media Session API — expose les contrôles d'appel sur :
 * - L'écran verrouillé iOS/Android
 * - La notification persistante Android
 * - Les contrôles media du navigateur (barre de notification Chrome)
 * - Les casques Bluetooth / AirPods
 *
 * Actions mappées :
 *  - "pause"       → muet (l'action la plus proche pour un appel)
 *  - "stop"        → raccrocher
 *  - "seekbackward" → non utilisé (requis pour certains navigateurs)
 *  - "seekforward"  → non utilisé
 */
export function useMediaSession({
  title,
  artist = "Buster Call",
  isActive,
  onMute,
  onHangup,
}: MediaSessionConfig) {
  const setMetadata = useCallback(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: "Appel en cours",
      artwork: [
        { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
    });
    navigator.mediaSession.playbackState = "playing";
  }, [title, artist]);

  const clearMetadata = useCallback(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
    // Supprimer les handlers
    navigator.mediaSession.setActionHandler("pause", null);
    navigator.mediaSession.setActionHandler("stop", null);
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (isActive) {
      setMetadata();

      // Muet via le bouton "pause" (sémantique la plus proche)
      if (onMute) {
        navigator.mediaSession.setActionHandler("pause", onMute);
      }
      // Raccrocher via "stop"
      if (onHangup) {
        navigator.mediaSession.setActionHandler("stop", onHangup);
      }
      // Éviter les erreurs sur certains navigateurs qui exigent ces actions
      navigator.mediaSession.setActionHandler("play", () => {});
    } else {
      clearMetadata();
    }

    return () => {
      clearMetadata();
    };
  }, [isActive, setMetadata, clearMetadata, onMute, onHangup]);
}
