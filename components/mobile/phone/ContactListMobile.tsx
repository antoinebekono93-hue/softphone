"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { alphabeticalKey, contactName, initials, type PhoneContact } from "./phone-utils";

function ContactAvatar({ name }: { name: string }) {
  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-semibold"
      style={{
        background: "color-mix(in oklch, var(--brand) 14%, var(--bg-surface))",
        color: "var(--brand)",
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

function ContactRow({
  contact,
  onCall,
  onSelect,
}: {
  contact: PhoneContact;
  onCall: (contact: PhoneContact) => void;
  onSelect?: (contact: PhoneContact) => void;
}) {
  const name = contactName(contact);
  const subtitle = contact.company?.trim() || contact.phone;
  return (
    <div className="flex items-center border-b border-[var(--border-subtle)] last:border-b-0">
      <button
        type="button"
        onClick={() => onCall(contact)}
        className="bc-cell flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left"
        aria-label={`Appeler ${name}`}
      >
        <ContactAvatar name={name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] text-[var(--text-primary)]">{name}</span>
          {subtitle && (
            <span className="block truncate text-[13px] text-[var(--text-secondary)]">{subtitle}</span>
          )}
        </span>
      </button>
      {onSelect && (
        <button
          type="button"
          onClick={() => onSelect(contact)}
          className="bc-cell grid w-12 shrink-0 place-items-center self-stretch text-[var(--text-muted)]"
          aria-label={`Détails de ${name}`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * Liste de contacts réutilisable : soit groupée alphabétiquement (A-Z avec
 * en-têtes collants type iOS), soit plate (favoris).
 */
export function ContactListMobile({
  contacts,
  onCall,
  onSelect,
  grouped = true,
}: {
  contacts: PhoneContact[];
  onCall: (contact: PhoneContact) => void;
  onSelect?: (contact: PhoneContact) => void;
  grouped?: boolean;
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
      <ul className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        {contacts.map((contact) => (
          <li key={contact.id}>
            <ContactRow contact={contact} onCall={onCall} onSelect={onSelect} />
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
          <ul className="overflow-hidden border-y border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            {group.map((contact) => (
              <li key={contact.id}>
                <ContactRow contact={contact} onCall={onCall} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
