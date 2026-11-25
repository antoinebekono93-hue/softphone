"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, Users, WifiOff, X } from "lucide-react";
import { ContactListMobile } from "./ContactListMobile";
import { EmptyStateMobile } from "./EmptyStateMobile";
import { ScreenTitle } from "./ScreenTitle";
import { contactMatchesQuery, type PhoneContact } from "./phone-utils";

/**
 * Onglet Contacts : recherche + liste alphabétique avec en-têtes collants,
 * style natif iOS. Les données proviennent de /api/contacts (réutilisé).
 * La création/édition/détail complets vivent dans /dashboard/contacts.
 */
export function MobileContactsView({
  contacts,
  loading,
  error,
  onRetry,
  onCall,
  onSelect,
}: {
  contacts: PhoneContact[];
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  onCall: (contact: PhoneContact) => void;
  onSelect?: (contact: PhoneContact) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => contacts.filter((contact) => contactMatchesQuery(contact, query)),
    [contacts, query],
  );

  return (
    <div className="flex min-h-full flex-col">
      <ScreenTitle
        title="Contacts"
        action={
          <Link
            href="/dashboard/contacts"
            className="mb-1 grid h-11 w-11 place-items-center rounded-full text-[var(--brand)] transition-colors active:bg-[var(--bg-surface-hover)]"
            aria-label="Créer un contact"
          >
            <UserPlus className="h-5 w-5" aria-hidden="true" />
          </Link>
        }
      />

      <div className="px-4 pb-3">
        <div className="flex min-h-[44px] items-center gap-2 rounded-[10px] bg-[var(--bg-surface-hover)] px-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un contact"
            className="bc-field min-w-0 flex-1 bg-transparent py-2.5 text-[16px]"
            aria-label="Rechercher un contact"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-muted)] active:bg-[var(--bg-surface)]"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {loading && contacts.length === 0 ? (
        <ul className="bg-[var(--bg-surface)]">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2 min-h-[72px] animate-pulse">
              <div className="h-12 w-12 shrink-0 rounded-full bg-[var(--bg-surface-hover)]" />
              <div className="flex-1">
                <div className="h-4 w-1/3 rounded bg-[var(--bg-surface-hover)]" />
                <div className="mt-2 h-3 w-1/4 rounded bg-[var(--bg-surface-hover)]" />
              </div>
            </li>
          ))}
        </ul>
      ) : error && contacts.length === 0 ? (
        <EmptyStateMobile
          icon={WifiOff}
          title="Impossible de charger les contacts"
          description="Vérifiez votre connexion puis réessayez."
          action={
            onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="min-h-11 rounded-full bg-[var(--brand)] px-6 text-[15px] font-semibold text-white"
              >
                Réessayer
              </button>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyStateMobile
          icon={Users}
          title={query ? "Aucun contact trouvé" : "Aucun contact"}
          description={
            query ? "Essayez un autre nom, numéro ou email." : "Vos contacts apparaîtront ici."
          }
        />
      ) : (
        <div className="pb-6">
          <ContactListMobile contacts={filtered} onCall={onCall} onSelect={onSelect} />
        </div>
      )}
    </div>
  );
}
