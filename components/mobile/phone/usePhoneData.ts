"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PhoneCall, PhoneContact, PhoneVoicemail } from "./phone-utils";

interface PhoneData {
  contacts: PhoneContact[];
  calls: PhoneCall[];
  voicemails: PhoneVoicemail[];
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Source de données de l'interface mobile « app Téléphone ». Réutilise
 * strictement les API existantes (/api/contacts, /api/calls, /api/voicemails)
 * sans aucune modification backend. Se rafraîchit sur les évènements temps
 * réel déjà émis par le contexte d'appel.
 */
export function usePhoneData(): PhoneData {
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [calls, setCalls] = useState<PhoneCall[]>([]);
  const [voicemails, setVoicemails] = useState<PhoneVoicemail[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [contactsRes, callsRes, voicemailsRes] = await Promise.all([
        fetch("/api/contacts", { cache: "no-store" }),
        fetch("/api/calls", { cache: "no-store" }),
        fetch("/api/voicemails", { cache: "no-store" }),
      ]);

      const [contactsData, callsData, voicemailsData] = await Promise.all([
        contactsRes.ok ? contactsRes.json().catch(() => []) : [],
        callsRes.ok ? callsRes.json().catch(() => []) : [],
        voicemailsRes.ok ? voicemailsRes.json().catch(() => []) : [],
      ]);

      if (!mountedRef.current) return;
      if (Array.isArray(contactsData)) setContacts(contactsData);
      if (Array.isArray(callsData)) setCalls(callsData);
      if (Array.isArray(voicemailsData)) setVoicemails(voicemailsData);
    } catch {
      // Réseau indisponible : on conserve les données déjà chargées.
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const handler = () => void refresh();
    window.addEventListener("softphone:voicemail", handler);
    window.addEventListener("softphone:missed-call", handler);
    window.addEventListener("softphone:call-log", handler);
    const initialLoad = window.setTimeout(() => void refresh(), 0);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(initialLoad);
      window.removeEventListener("softphone:voicemail", handler);
      window.removeEventListener("softphone:missed-call", handler);
      window.removeEventListener("softphone:call-log", handler);
    };
  }, [refresh]);

  return { contacts, calls, voicemails, loading, refresh };
}
