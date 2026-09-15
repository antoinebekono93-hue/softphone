"use client";

import { useAppCall } from "@/contexts/AppCallContext";
import { StatusDot } from "@/components/ui/status-dot";
import { StatusBadge } from "@/components/ui/status-badge";
import { Phone, PhoneOff } from "lucide-react";

/**
 * Overlay global des appels APP_TO_APP entrants. Affiché sur toute
 * l'application lorsque l'utilisateur reçoit un appel en interne.
 */
export function GlobalAppIncomingCall() {
  const { incomingAppCall, appCallStatus, acceptAppCall, declineAppCall } = useAppCall();

  if (!incomingAppCall || appCallStatus !== "RINGING") {
    return null;
  }

  const displayName =
    incomingAppCall.callerName ||
    incomingAppCall.callerUsername ||
    incomingAppCall.callerExtension ||
    "Collègue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl glass-panel bg-[var(--bg-glass)] p-6 sm:p-10 flex flex-col items-center relative animate-in zoom-in-95 duration-300 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-[var(--success)]/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="flex items-center gap-2 text-[var(--success)] font-medium text-sm tracking-widest uppercase mb-8">
          <StatusDot tone="info" pulse />
          <span>Appel entrant interne</span>
          <StatusBadge status="RINGING" />
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full border border-[var(--success)]/40 animate-signal-ring" />
          <div className="absolute inset-0 rounded-full border border-[var(--success)]/20 animate-signal-ring" style={{ animationDelay: "0.5s" }} />
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[var(--success)] to-[var(--telecom)] flex items-center justify-center shadow-[0_0_30px_color-mix(in_oklch,var(--success)_40%,transparent)] relative z-10">
            <span className="text-4xl font-bold text-white">
              {(displayName.charAt(0) || "?").toUpperCase()}
            </span>
          </div>
        </div>

        <div className="text-3xl font-light text-[var(--text-primary)] mb-1 text-center">
          {displayName}
        </div>
        <div className="text-[var(--text-secondary)] mb-10 text-lg">
          {incomingAppCall.callerUsername ? `@${incomingAppCall.callerUsername}` : "via l'annuaire interne"}
        </div>

        <div className="flex w-full justify-center gap-10 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={declineAppCall}
              className="w-16 h-16 rounded-full bg-[var(--danger)] hover:opacity-90 flex items-center justify-center shadow-[0_0_20px_color-mix(in_oklch,var(--danger)_30%,transparent)] transition-all active:scale-95"
              aria-label="Refuser"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <span className="text-sm font-medium text-[var(--text-secondary)]">Refuser</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={acceptAppCall}
              className="w-16 h-16 rounded-full bg-[var(--success)] hover:opacity-90 flex items-center justify-center shadow-[0_0_20px_color-mix(in_oklch,var(--success)_30%,transparent)] transition-all active:scale-95"
              aria-label="Accepter"
            >
              <Phone className="w-7 h-7 text-white" />
            </button>
            <span className="text-sm font-medium text-[var(--text-secondary)]">Accepter</span>
          </div>
        </div>
      </div>
    </div>
  );
}
