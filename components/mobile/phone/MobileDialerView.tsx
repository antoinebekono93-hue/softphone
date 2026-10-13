"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Phone, UserPlus, Users } from "lucide-react";
import { useAppCall } from "@/contexts/AppCallContext";
import { DialerKeypad } from "./DialerKeypad";
import { DialerNumberField, countryByCode } from "./DialerNumberField";
import { EmptyStateMobile } from "./EmptyStateMobile";

type Mode = "pstn" | "app";

/**
 * Onglet Clavier : composition numérique type iPhone (champ + clavier rond +
 * bouton d'appel vert) et bascule « Interne » vers l'annuaire d'équipe pour
 * préserver les appels App-to-App. Le routage réel reste assuré par le serveur
 * via `onCall` (useCallRouter) — aucune logique métier dupliquée ici.
 */
export function MobileDialerView({
  onCall,
  disabled = false,
}: {
  onCall: (number: string) => void;
  disabled?: boolean;
}) {
  const { directory, refreshDirectory } = useAppCall();
  const [number, setNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [mode, setMode] = useState<Mode>("pstn");
  const [target, setTarget] = useState("");

  useEffect(() => {
    void refreshDirectory();
  }, [refreshDirectory]);

  const iso = countryByCode(countryCode).iso;

  const append = useCallback((digit: string) => {
    setNumber((prev) => prev + digit);
  }, []);

  const backspace = useCallback(() => {
    setNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleCall = useCallback(() => {
    const raw = number.trim();
    if (!raw || disabled) return;
    let finalNumber = raw;
    if (!finalNumber.startsWith("+")) {
      const isExplicitInternational = /^00\d+$/.test(finalNumber) || /^237\d{9}$/.test(finalNumber);
      if (!isExplicitInternational) {
        if (finalNumber.startsWith("0")) finalNumber = finalNumber.substring(1);
        finalNumber = countryCode + finalNumber;
      }
    }
    onCall(finalNumber);
  }, [number, countryCode, disabled, onCall]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (mode !== "pstn" || disabled) return;
      const active = document.activeElement as HTMLElement | null;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active?.isContentEditable
      ) {
        return;
      }
      if (/^[0-9*#]$/.test(event.key)) {
        append(event.key);
      } else if (event.key === "Backspace") {
        backspace();
      } else if (event.key === "Enter") {
        handleCall();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, disabled, append, backspace, handleCall]);

  return (
    <div className="flex min-h-full flex-col px-4 pb-5 pt-2">
      <p className="pb-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
        Buster Call
      </p>

      <div
        role="tablist"
        aria-label="Type d'appel"
        className="mx-auto mb-1 flex rounded-[10px] bg-[var(--bg-surface-hover)] p-0.5"
      >
        {([
          ["pstn", "Externe"],
          ["app", "Interne"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={`rounded-lg px-6 py-1.5 text-[14px] font-medium transition-colors ${
              mode === value
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-panel)]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "pstn" ? (
        <>
          <DialerNumberField
            value={number}
            defaultIso={iso}
            countryCode={countryCode}
            onCountryChange={setCountryCode}
            onBackspace={backspace}
            disabled={disabled}
          />

          <div className="flex flex-1 items-center justify-center py-2">
            <DialerKeypad onDigit={append} disabled={disabled} />
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCall}
              disabled={disabled || number.length === 0}
              className="grid h-[72px] w-[72px] place-items-center rounded-full bg-[var(--success)] text-white shadow-[0_10px_24px_-8px_color-mix(in_oklch,var(--success)_70%,transparent)] transition-transform active:scale-95 disabled:bg-[var(--bg-surface-hover)] disabled:text-[var(--text-muted)] disabled:shadow-none"
              aria-label="Appeler"
            >
              <Phone className="h-8 w-8" aria-hidden="true" />
            </button>
            <Link
              href="/dashboard/contacts"
              className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--brand)]"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Ajouter un contact
            </Link>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col pt-3">
          <div className="flex items-center gap-2 rounded-[10px] bg-[var(--bg-surface-hover)] px-3">
            <input
              type="text"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && target.trim()) {
                  onCall(target.trim());
                  setTarget("");
                }
              }}
              placeholder="Nom d'utilisateur, extension ou email"
              className="bc-field min-w-0 flex-1 bg-transparent py-2.5 text-[16px]"
              aria-label="Identifiant interne à appeler"
            />
            <button
              type="button"
              onClick={() => {
                if (!target.trim()) return;
                onCall(target.trim());
                setTarget("");
              }}
              disabled={!target.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--success)] text-white disabled:opacity-40"
              aria-label="Appeler ce collègue"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-4 px-1 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Annuaire de l’équipe
          </p>
          {directory.length === 0 ? (
            <EmptyStateMobile
              icon={Users}
              title="Aucun collègue joignable"
              description="Les membres de votre organisation disposant d'un identifiant d'appel apparaîtront ici."
            />
          ) : (
            <ul className="mt-2 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              {directory.map((user) => {
                const dial = user.callUsername || user.callExtension || user.email || "";
                const label = user.name || user.callUsername || "Collègue";
                const subtitle = [
                  user.callUsername ? `@${user.callUsername}` : null,
                  user.callExtension ? `ext ${user.callExtension}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li
                    key={user.id}
                    className="flex items-center border-b border-[var(--border-subtle)] last:border-b-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col px-4 py-2.5">
                      <span className="truncate text-[17px] text-[var(--text-primary)]">{label}</span>
                      {subtitle && (
                        <span className="truncate text-[13px] text-[var(--text-secondary)]">{subtitle}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => dial && onCall(dial)}
                      disabled={!dial}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--success)] transition-colors active:bg-[var(--bg-surface-hover)] disabled:opacity-40"
                      aria-label={`Appeler ${label}`}
                    >
                      <Phone className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
