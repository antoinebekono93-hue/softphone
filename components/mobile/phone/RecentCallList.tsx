"use client";

import { Info, PhoneIncoming, PhoneMissed, PhoneOutgoing } from "lucide-react";
import {
  callDirectionOf,
  callDisplayName,
  callDurationLabel,
  callKindLabel,
  counterpartyNumber,
  initials,
  isMissedCall,
  recentTimestampLabel,
  type PhoneCall,
  type PhoneContact,
} from "./phone-utils";

function CallKindIcon({ call }: { call: PhoneCall }) {
  if (isMissedCall(call)) {
    return <PhoneMissed className="h-3.5 w-3.5 text-[var(--danger)]" aria-hidden="true" />;
  }
  if (callDirectionOf(call) === "inbound") {
    return <PhoneIncoming className="h-3.5 w-3.5 text-[var(--success)]" aria-hidden="true" />;
  }
  return <PhoneOutgoing className="h-3.5 w-3.5 text-[var(--text-secondary)]" aria-hidden="true" />;
}

/**
 * Liste d'appels récents type iPhone : avatar/initiales, nom ou numéro,
 * type d'appel, horodatage, bouton info. Les appels manqués passent en rouge.
 */
export function RecentCallList({
  calls,
  contacts,
  onCall,
  onInfo,
}: {
  calls: PhoneCall[];
  contacts: PhoneContact[];
  onCall: (number: string) => void;
  onInfo: (call: PhoneCall) => void;
}) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      {calls.map((call) => {
        const name = callDisplayName(call, contacts);
        const missed = isMissedCall(call);
        const number = counterpartyNumber(call);
        const duration = callDurationLabel(call);
        const subtitle = [callKindLabel(call), duration].filter(Boolean).join(" · ");
        return (
          <li
            key={call.id}
            className="flex items-center border-b border-[var(--border-subtle)] last:border-b-0"
          >
            <button
              type="button"
              onClick={() => number && onCall(number)}
              className="bc-cell flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left"
              aria-label={`Rappeler ${name}`}
            >
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
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[17px] ${missed ? "text-[var(--danger)]" : "text-[var(--text-primary)]"}`}
                >
                  {name}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[13px] text-[var(--text-secondary)]">
                  <CallKindIcon call={call} />
                  <span className="truncate">{subtitle}</span>
                </span>
              </span>
            </button>

            <div className="flex shrink-0 items-center gap-1 pr-2">
              <span className="text-[13px] tabular-nums text-[var(--text-secondary)]">
                {recentTimestampLabel(call.startedAt)}
              </span>
              <button
                type="button"
                onClick={() => onInfo(call)}
                className="grid h-11 w-11 place-items-center rounded-full text-[var(--brand)] transition-colors active:bg-[var(--bg-surface-hover)]"
                aria-label={`Informations sur l'appel de ${name}`}
              >
                <Info className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
