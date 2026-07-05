"use client";

import { useState, useCallback, useEffect } from "react";
import { formatPhoneNumber } from "@/lib/utils";

interface DialpadProps {
  onDigitPress?: (digit: string) => void;
  onCall: (number: string) => void;
  disabled?: boolean;
}

const KEYS = [
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

export function Dialpad({ onDigitPress, onCall, disabled }: DialpadProps) {
  const [number, setNumber] = useState("");
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handlePress = useCallback(
    (digit: string) => {
      if (disabled) return;
      if (navigator.vibrate) navigator.vibrate(50);
      setNumber((prev) => prev + digit);
      onDigitPress?.(digit);
    },
    [disabled, onDigitPress]
  );

  const handlePointerDown = useCallback((key: string) => {
    if (disabled) return;
    if (key === "0") {
      const timer = setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate(50);
        setNumber((prev) => prev + "+");
        setPressTimer(null);
      }, 500); // 500ms long press
      setPressTimer(timer);
    }
  }, [disabled]);

  const handlePointerUp = useCallback((key: string) => {
    if (disabled) return;
    if (key === "0") {
      if (pressTimer) {
        // If timer is still active, it wasn't a long press. Clear timer and add '0'.
        clearTimeout(pressTimer);
        setPressTimer(null);
        handlePress("0");
      }
    } else {
      handlePress(key);
    }
  }, [disabled, handlePress, pressTimer]);

  const handlePointerLeave = useCallback(() => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }, [pressTimer]);

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    setNumber((prev) => prev.slice(0, -1));
  }, [disabled]);

  const handleCall = useCallback(() => {
    if (disabled || !number) return;
    onCall(number);
  }, [disabled, number, onCall]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const key = e.key;
      
      if (/^[0-9*#]$/.test(key)) {
        handlePress(key);
      } else if (key === "Backspace") {
        handleBackspace();
      } else if (key === "Enter") {
        handleCall();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, handlePress, handleBackspace, handleCall]);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Display */}
      <div className="w-full flex items-center justify-between mb-8 h-16 px-4">
        <input
          type="text"
          value={number}
          onChange={(e) => {
            if (disabled) return;
            const val = e.target.value.replace(/[^0-9*#+]/g, '');
            setNumber(val);
          }}
          placeholder=""
          disabled={disabled}
          className="w-full bg-transparent border-none shadow-none text-4xl font-medium text-center flex-1 tracking-wider text-[var(--text-primary)] focus:outline-none focus:ring-0 min-w-0 placeholder-[var(--text-secondary)] placeholder-opacity-30"
        />
        {number && (
          <button
            onClick={handleBackspace}
            className="p-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Backspace"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
              <line x1="18" y1="9" x2="12" y2="15"></line>
              <line x1="12" y1="9" x2="18" y2="15"></line>
            </svg>
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8 w-full px-6">
        {KEYS.map((key) => (
          <button
            key={key.digit}
            onPointerDown={() => handlePointerDown(key.digit)}
            onPointerUp={() => handlePointerUp(key.digit)}
            onPointerLeave={handlePointerLeave}
            onContextMenu={(e) => e.preventDefault()} // Prevent context menu on long press
            disabled={disabled}
            className="bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-surface-hover)] border-none text-[var(--text-primary)] relative flex flex-col items-center justify-center w-20 h-20 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-auto shadow-[0_2px_10px_rgba(0,0,0,0.05)] active:scale-95"
            style={{ WebkitUserSelect: 'none', touchAction: 'manipulation' }}
          >
            <span className="text-3xl font-medium">
              {key.digit}
            </span>
            <span className="text-[10px] font-medium tracking-[0.1em] mt-0.5 min-h-[15px] opacity-70">
              {key.letters}
            </span>
          </button>
        ))}
      </div>

      {/* Call Button */}
      <button
        onClick={handleCall}
        disabled={disabled || !number}
        className="bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white w-20 h-20 rounded-full flex items-center justify-center transition-all disabled:bg-[var(--text-secondary)] disabled:opacity-50"
        aria-label="Call"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      </button>
    </div>
  );
}
