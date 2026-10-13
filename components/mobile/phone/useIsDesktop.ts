"use client";

import { useSyncExternalStore } from "react";

// The single controlled responsive mechanism for the phone experience.
// `null` on the server and during the first hydration render keeps SSR output
// identical to the first client render (no hydration mismatch) and prevents the
// desktop tree from ever mounting on a mobile viewport.
const QUERY = "(min-width: 768px)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean | null {
  return null;
}

export function useIsDesktop(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribe, getSnapshot, getServerSnapshot);
}
