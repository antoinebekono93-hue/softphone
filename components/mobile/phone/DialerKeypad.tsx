"use client";

import { useCallback, useRef } from "react";

const KEYS: { digit: string; letters: string }[] = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

/**
 * Clavier numérique type app Téléphone iPhone : 3 colonnes, touches rondes
 * larges, chiffre + lettres. Le « 0 » déclenche « + » sur appui long.
 * Réutilisable pour la composition ET l'envoi de DTMF pendant un appel.
 */
export function DialerKeypad({
  onDigit,
  disabled = false,
}: {
  onDigit: (digit: string) => void;
  disabled?: boolean;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFiredRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (digit: string) => {
      if (disabled || digit !== "0") return;
      longFiredRef.current = false;
      clearTimer();
      timerRef.current = setTimeout(() => {
        longFiredRef.current = true;
        timerRef.current = null;
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
        onDigit("+");
      }, 480);
    },
    [disabled, onDigit, clearTimer],
  );

  const handleClick = useCallback(
    (digit: string) => {
      if (disabled) return;
      if (digit === "0") {
        if (longFiredRef.current) {
          longFiredRef.current = false;
          return;
        }
        clearTimer();
      }
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
      onDigit(digit);
    },
    [disabled, onDigit, clearTimer],
  );

  return (
    <div
      className="grid grid-cols-3 justify-items-center gap-x-7 gap-y-3 sm:gap-x-10"
      role="group"
      aria-label="Clavier numérique"
    >
      {KEYS.map((key) => (
        <button
          key={key.digit}
          type="button"
          className="bc-key"
          disabled={disabled}
          onPointerDown={() => handlePointerDown(key.digit)}
          onPointerUp={clearTimer}
          onPointerLeave={clearTimer}
          onContextMenu={(event) => event.preventDefault()}
          onClick={() => handleClick(key.digit)}
          aria-label={key.letters ? `${key.digit}, ${key.letters}` : key.digit}
        >
          <span className="text-[30px] font-normal leading-none tracking-tight">
            {key.digit}
          </span>
          <span className="mt-0.5 h-[11px] text-[10px] font-semibold tracking-[0.16em] text-[var(--text-secondary)]">
            {key.letters}
          </span>
        </button>
      ))}
    </div>
  );
}
