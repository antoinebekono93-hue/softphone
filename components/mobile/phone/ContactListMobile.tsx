"use client";

import { useMemo } from "react";
import { ChevronRight, Star, User } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";
import { alphabeticalKey, contactName, initials, type PhoneContact } from "./phone-utils";

function ContactAvatar({ name, hasName }: { name: string; hasName: boolean }) {
  return (
    <span
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[16px] font-semibold"
      style={{
        background: "color-mix(in oklch, var(--brand) 14%, var(--bg-surface))",
        color: "var(--brand)",
      }}
      aria-hidden="true"
    >
      {hasName ? initials(name) : <User className="h-5 w-5" />}
    </span>
  );
}

function ContactRow({
  contact,
  onCall,
  onSelect,
  last,
  showFavoriteBadge = false,
}: {
  contact: PhoneContact;
  onCall: (contact: PhoneContact) => void;
  onSelect?: (contact: PhoneContact) => void;
  last?: boolean;
  showFavoriteBadge?: boolean;
}) {
  const hasName = Boolean(contact.name?.trim());
  const name = contactName(contact);
  const number = hasName && contact.phone ? formatPhoneNumber(contact.phone) : "";
  return (
    <div className="flex items-stretch bg-[var(--bg-surface)]">
      <button
        type="button"
        onClick={() => onCall(contact)}
        className="bc-cell flex min-h-[72px] min-w-0 flex-1 items-center gap-3 py-2 pl-4 text-left"
        aria-label={showFavoriteBadge ? `Appeler ${name} (contact favori)` : `Appeler ${name}`}
      >
        <ContactAvatar name={contact.name ?? ""} hasName={hasName} />
        <span
          className={`flex min-h-[72px] min-w-0 flex-1 flex-col justify-center ${
            last ? "" : "border-b border-[var(--border-subtle)]"
          }`}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[17px] font-semibold text-[var(--text-primary)]">
              {name}
            </span>
            {showFavoriteBadge && (
              <Star
                className="h-3.5 w-3.5 shrink-0 fill-[var(--warning)] text-[var(--warning)]"
                aria-hidden="true"
              />
            )}
          </span>
          {number && (
            <span className="mt-0.5 truncate text-[13px] text-[var(--text-secondary)]">
              {number}
            </span>
          )}
        </span>
      </button>
      {onSelect && (
        <button
          type="button"
          onClick={() => onSelect(contact)}
          className="bc-cell grid w-11 shrink-0 place-items-center self-stretch text-[var(--text-muted)]"
          aria-label={`Informations sur ${name}`}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * Liste de contacts réutilisable : soit groupée alphabétiquement (A-Z avec
 * en-têtes collants type iOS), soit plate (favoris). Rendu natif « app
 * Téléphone » : lignes plates, avatars circulaires, séparateurs insérés
 * après la zone avatar (via la colonne de texte), aucun habillage en carte.
 */
export function ContactListMobile({
  contacts,
  onCall,
  onSelect,
  grouped = true,
  showFavoriteBadge = false,
}: {
  contacts: PhoneContact[];
  onCall: (contact: PhoneContact) => void;
  onSelect?: (contact: PhoneContact) => void;
  grouped?: boolean;
  showFavoriteBadge?: boolean;
}) {
  const sections = useMemo(() => {
    if (!grouped) return null;
    const map = new Map<string, PhoneContact[]>();
    const sorted = [...contacts].sort((a, b) => contactName(a).localeCompare(contactName(b), "fr"));
    for (const contact of sorted) {
      const key = alphabeticalKey(contact);
      const bucket = map.get(key) ?? [];
      bucket.push(contact);
      map.set(key, bucket);
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [contacts, grouped]);

  if (!grouped || !sections) {
    return (
      <ul className="bg-[var(--bg-surface)]">
        {contacts.map((contact, index) => (
          <li key={contact.id}>
            <ContactRow
              contact={contact}
              onCall={onCall}
              onSelect={onSelect}
              last={index === contacts.length - 1}
              showFavoriteBadge={showFavoriteBadge}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      {sections.map(([letter, group]) => (
        <section key={letter}>
          <h3 className="sticky top-0 z-10 bg-[var(--bg-base)] px-4 py-1 text-[13px] font-semibold text-[var(--text-secondary)]">
            {letter}
          </h3>
          <ul className="bg-[var(--bg-surface)]">
            {group.map((contact, index) => (
              <li key={contact.id}>
                <ContactRow
                  contact={contact}
                  onCall={onCall}
                  onSelect={onSelect}
                  last={index === group.length - 1}
                  showFavoriteBadge={showFavoriteBadge}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
