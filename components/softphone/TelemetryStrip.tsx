"use client";

import { useTelnyx } from "@/contexts/TelnyxContext";
import { useAppCall } from "@/contexts/AppCallContext";
import { StatusDot } from "@/components/ui/status-dot";
import {
  APP_STATUS_TEXT,
  PSTN_STATUS_TEXT,
  appPulse,
  appTone,
  pstnPulse,
  pstnTone,
} from "./status-labels";

export function TelemetryStrip() {
  const { callState, callDirection } = useTelnyx();
  const { appCallStatus } = useAppCall();

  const directionLabel =
    callDirection === "inbound" ? "Entrant" : callDirection === "outbound" ? "Sortant" : "—";

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-glass)] px-3 py-1.5 font-mono text-[10px] tracking-wide text-[var(--text-secondary)]">
      <span className="flex items-center gap-1.5">
        <StatusDot tone={pstnTone(callState)} pulse={pstnPulse(callState)} />
        <span>PSTN {PSTN_STATUS_TEXT[callState]} ({callState})</span>
      </span>
      <span className="opacity-40">/</span>
      <span className="flex items-center gap-1.5">
        <StatusDot tone={appTone(appCallStatus)} pulse={appPulse(appCallStatus)} />
        <span>APP {APP_STATUS_TEXT[appCallStatus]} ({appCallStatus})</span>
      </span>
      <span className="opacity-40">/</span>
      <span className="flex items-center gap-1.5">
        <span>DIR {directionLabel}</span>
      </span>
    </div>
  );
}