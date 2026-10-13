"use client";

import { useRingtone } from "@/hooks/useRingtone";

// Single owner of the incoming-call ringtone, mounted once globally by
// CommunicationProvider. Guarantees exactly one ringtone instance on every
// viewport (mobile shell AND desktop workspace) and across page navigation.
export function GlobalRingtone() {
  useRingtone();
  return null;
}
