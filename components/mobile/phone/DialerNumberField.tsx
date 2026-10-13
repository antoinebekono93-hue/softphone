"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Delete } from "lucide-react";
import { formatDialerDisplay } from "./phone-utils";

export interface DialCountry {
  code: string;
  iso: string;
  label: string;
  flag: string;
}

export const COUNTRIES: DialCountry[] = [
  { code: "+1", iso: "US", label: "États-Unis / Canada", flag: "🇺🇸" },
  { code: "+33", iso: "FR", label: "France", flag: "🇫🇷" },
  { code: "+237", iso: "CM", label: "Cameroun", flag: "🇨🇲" },
  { code: "+44", iso: "GB", label: "Royaume-Uni", flag: "🇬🇧" },
  { code: "+32", iso: "BE", label: "Belgique", flag: "🇧🇪" },
  { code: "+41", iso: "CH", label: "Suisse", flag: "🇨🇭" },
  { code: "+225", iso: "CI", label: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+221", iso: "SN", label: "Sénégal", flag: "🇸🇳" },
  { code: "+223", iso: "ML", label: "Mali", flag: "🇲🇱" },
  { code: "+212", iso: "MA", label: "Maroc", flag: "🇲🇦" },
  { code: "+216", iso: "TN", label: "Tunisie", flag: "🇹🇳" },
  { code: "+49", iso: "DE", label: "Allemagne", flag: "🇩🇪" },
  { code: "+34", iso: "ES", label: "Espagne", flag: "🇪🇸" },
  { code: "+39", iso: "IT", label: "Italie", flag: "🇮🇹" },
];

export function countryByCode(code: string): DialCountry {
  return COUNTRIES.find((country) => country.code === code) ?? COUNTRIES[0];
}

/**
 * Champ de numéro type iPhone : sélecteur pays discret à gauche, numéro
 * formaté au centre (lecture seule : le clavier maison est la seule saisie,
 * ce qui évite tout double caractère), effacement à droite.
 */
export function DialerNumberField({
  value,
  defaultIso,
  countryCode,
  onCountryChange,
  onBackspace,
  disabled = false,
}: {
  value: string;
  defaultIso: string;
  countryCode: string;
  onCountryChange: (code: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const international = value.startsWith("+");
  const display = formatDialerDisplay(value, defaultIso);
  const current = countryByCode(countryCode);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative flex min-h-[56px] items-center justify-center px-2">
        {!international && (
          <div className="absolute left-3 z-20" ref={rootRef}>
            <button
              type="button"
              onClick={() => !disabled && setOpen((prev) => !prev)}
              disabled={disabled}
              className="flex items-center gap-1 rounded-full px-2 py-1.5 text-[15px] font-medium text-[var(--text-primary)] transition-colors active:bg-[var(--bg-surface-hover)] disabled:opacity-50"
              aria-label={`Pays : ${current.label} (${current.code})`}
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              <span className="text-lg leading-none">{current.flag}</span>
              <span>{current.code}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-secondary)]" aria-hidden="true" />
            </button>

            {open && (
              <div
                role="listbox"
                aria-label="Code pays"
                className="absolute left-0 top-full z-30 mt-2 w-60 overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-1 shadow-[var(--shadow-hover)]"
                style={{ maxHeight: "min(60vh, 320px)" }}
              >
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    role="option"
                    aria-selected={country.code === countryCode}
                    onClick={() => {
                      onCountryChange(country.code);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-[var(--bg-surface-hover)]"
                  >
                    <span className="text-lg leading-none">{country.flag}</span>
                    <span className="flex-1 truncate text-[15px] text-[var(--text-primary)]">
                      {country.label}
                    </span>
                    <span className="text-[13px] text-[var(--text-secondary)]">{country.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mx-16 min-w-0 text-center" aria-live="polite">
          {value ? (
            <span className="block truncate text-[32px] font-normal tracking-tight text-[var(--text-primary)]">
              {display}
            </span>
          ) : (
            <span className="block truncate text-[20px] font-normal text-[var(--text-muted)]">
              Saisissez un numéro
            </span>
          )}
        </div>

        {value.length > 0 && !disabled && (
          <button
            type="button"
            onClick={onBackspace}
            className="absolute right-3 grid h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] transition-colors active:bg-[var(--bg-surface-hover)]"
            aria-label="Effacer le dernier chiffre"
          >
            <Delete className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
