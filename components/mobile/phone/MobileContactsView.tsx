"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";
import { ContactListMobile } from "./ContactListMobile";
import { EmptyStateMobile } from "./EmptyStateMobile";
import { ScreenTitle } from "./ScreenTitle";
import { contactName, type PhoneContact } from "./phone-utils";

/**
 * Onglet Contacts : recherche + liste alphabétique avec en-têtes collants,
 * style natif iOS. Les données proviennent de /api/contacts (réutilisé).
 */
export function MobileContactsView({
  contacts,
  loading,
  onCall,
  onSelect,
}: {
  contacts: PhoneContact[];
  loading: boolean;
  onCall: (contact: PhoneContact) => void;
  onSelect?: (contact: PhoneContact) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((contact) => {
      const name = contactName(contact).toLowerCase();
      return (
        name.includes(q) ||
        (contact.phone ?? "").toLowerCase().includes(q) ||
        (contact.company ?? "").toLowerCase().includes(q)
      );
    });
  }, [contacts, query]);

  return (
    <div className="flex min-h-full flex-col">
      <ScreenTitle
        title="Contacts"
        action={
          <Link
            href="/dashboard/contacts"
            className="mb-1 grid h-9 w-9 place-items-center rounded-full text-[var(--brand)] transition-colors active:bg-[var(--bg-surface-hover)]"
            aria-label="Créer un contact"
          >
            <UserPlus className="h-5 w-5" aria-hidden="true" />
          </Link>
        }
      />

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-[10px] bg-[var(--bg-surface-hover)] px-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher"
            className="bc-field min-w-0 flex-1 bg-transparent py-2.5 text-[16px]"
            aria-label="Rechercher un contact"
          />
        </div>
      </div>

      {loading && contacts.length === 0 ? (
        <p className="px-4 py-10 text-center text-[14px] text-[var(--text-secondary)]">Chargement…</p>
      ) : filtered.length === 0 ? (
        <EmptyStateMobile
          icon={Users}
          title={query ? "Aucun résultat" : "Aucun contact"}
          description={
            query
              ? "Essayez un autre nom, numéro ou entreprise."
              : "Ajoutez votre premier contact pour appeler en un geste."
          }
        />
      ) : (
        <div className="px-4 pb-6">
          <ContactListMobile contacts={filtered} onCall={onCall} onSelect={onSelect} />
        </div>
      )}
    </div>
  );
}
