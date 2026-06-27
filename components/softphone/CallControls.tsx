"use client";

import { formatDuration } from "@/lib/utils";

interface CallControlsProps {
  isMuted: boolean;
  callDuration: number;
  onMute: () => void;
  onKeypad: () => void;
  onHangUp: () => void;
  showKeypad?: boolean;
}

export function CallControls({
  isMuted,
  callDuration,
  onMute,
  onKeypad,
  onHangUp,
  showKeypad,
}: CallControlsProps) {
  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Timer */}
      <div className="text-[var(--text-secondary)] font-mono text-xl mb-12 tabular-nums">
        {formatDuration(callDuration)}
      </div>

      {/* Controls Grid */}
      <div className="flex items-center justify-center gap-8 mb-12">
        {/* Mute */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onMute}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm ${
              isMuted
                ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                : "bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
            }`}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMuted ? (
                <>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </>
              ) : (
                <>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </>
              )}
            </svg>
          </button>
          <span className="text-xs font-medium text-[var(--text-secondary)] mt-1">Mute</span>
        </div>

        {/* Keypad Toggle */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onKeypad}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm ${
              showKeypad
                ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                : "bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
            }`}
            aria-label="Keypad"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <line x1="15" y1="3" x2="15" y2="21"></line>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="3" y1="15" x2="21" y2="15"></line>
            </svg>
          </button>
          <span className="text-xs font-medium text-[var(--text-secondary)] mt-1">Keypad</span>
        </div>
      </div>

      {/* Hang Up Button */}
      <button
        onClick={onHangUp}
        className="bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-all"
        aria-label="Hang Up"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
          <line x1="23" y1="1" x2="1" y2="23"></line>
        </svg>
      </button>
    </div>
  );
}
