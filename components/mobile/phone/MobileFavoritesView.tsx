"use client";

import { useMemo, useState } from "react";
import { Search, Star, WifiOff, X } from "lucide-react";
import { ContactListMobile } from "./ContactListMobile";
import { EmptyStateMobile } from "./EmptyStateMobile";
import { ScreenTitle } from "./ScreenTitle";
import { contactMatchesQuery, contactName, isFavoriteContact, type PhoneContact } from "./phone-utils";

/**
 * Onglet Favoris : contacts prioritaires issus de l'état persistant réel
 * (`Contact.isVip`, exposé par /api/contacts, dérivé via `isFavoriteContact`).
 * Lecture seule : aucune mutation de favori n'est supportée côté mobile à ce
 * stade, donc l'étoile est un indicateur d'état non interactif (pas de toggle,
 * pas de state local). Réutilise les primitives natives de Contacts.
 */
export function MobileFavoritesView({
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

  const favorites = useMemo(
    () =>
      contacts
        .filter(isFavoriteContact)
        .sort((a, b) => contactName(a).localeCompare(contactName(b), "fr")),
    [contacts],
  );

  const filtered = useMemo(
    () => favorites.filter((contact) => contactMatchesQuery(contact, query)),
    [favorites, query],
  );

  return (
    <div className="flex min-h-full flex-col">
      <ScreenTitle title="Favoris" />

      {favorites.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex min-h-[44px] items-center gap-2 rounded-[10px] bg-[var(--bg-surface-hover)] px-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
            <input
              type="search"
              inputMode="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un favori"
              className="bc-field min-w-0 flex-1 bg-transparent py-2.5 text-[16px]"
              aria-label="Rechercher un favori"
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
      )}

      {loading && contacts.length === 0 ? (
        <ul className="bg-[var(--bg-surface)]">
          {[0, 1, 2, 3, 4].map((i) => (
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
          title="Impossible de charger les favoris"
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
          icon={Star}
          title={query ? "Aucun favori trouvé" : "Aucun favori"}
          description={
            query
              ? "Essayez un autre nom, numéro ou email."
              : "Les contacts marqués comme favoris apparaîtront ici."
          }
        />
      ) : (
        <div className="pb-6">
          <ContactListMobile
            contacts={filtered}
            onCall={onCall}
            onSelect={onSelect}
            grouped={false}
            showFavoriteBadge
          />
        </div>
      )}
    </div>
  );
}
