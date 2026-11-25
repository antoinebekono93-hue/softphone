"use client";

import { useMemo, useState } from "react";
import { Clock, Phone, WifiOff } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { RecentCallList } from "./RecentCallList";
import { EmptyStateMobile } from "./EmptyStateMobile";
import { ScreenTitle } from "./ScreenTitle";
import { formatPhoneNumber } from "@/lib/utils";
import {
  callDisplayName,
  callDurationLabel,
  callKindLabel,
  counterpartyNumber,
  isMissedCall,
  recentTimestampLabel,
  type PhoneCall,
  type PhoneContact,
} from "./phone-utils";

const STATUS_FR: Record<string, string> = {
  COMPLETED: "Terminé",
  NO_ANSWER: "Sans réponse",
  MISSED: "Manqué",
  FAILED: "Échec",
  BUSY: "Occupé",
  CANCELLED: "Annulé",
  INITIATED: "En cours",
  RINGING: "Sonnerie",
};

type Filter = "all" | "missed";

/**
 * Onglet Récents : segmented control Tous / Manqués, liste d'appels propre,
 * bouton info ouvrant un détail d'appel. Données réelles de /api/calls.
 */
export function MobileRecentsView({
  calls,
  contacts,
  loading,
  error,
  onRetry,
  onCall,
}: {
  calls: PhoneCall[];
  contacts: PhoneContact[];
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  onCall: (number: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<PhoneCall | null>(null);

  const filtered = useMemo(
    () => (filter === "missed" ? calls.filter(isMissedCall) : calls),
    [calls, filter],
  );

  const selectedName = selected ? callDisplayName(selected, contacts) : "";

  return (
    <div className="flex min-h-full flex-col">
      <ScreenTitle title="Récents" />

      <div className="px-4 pb-3">
        <div
          role="tablist"
          aria-label="Filtrer les appels"
          className="flex rounded-[10px] bg-[var(--bg-surface-hover)] p-0.5"
        >
          {(["all", "missed"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={`flex-1 rounded-lg py-1.5 text-[14px] font-medium transition-colors ${
                filter === value
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-panel)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              {value === "all" ? "Tous" : "Manqués"}
            </button>
          ))}
        </div>
      </div>

      {loading && calls.length === 0 ? (
        <ul className="px-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="flex items-center gap-3 py-2 min-h-[72px] animate-pulse">
              <div className="h-12 w-12 shrink-0 rounded-full bg-[var(--bg-surface-hover)]" />
              <div className="flex-1">
                <div className="h-4 w-1/3 rounded bg-[var(--bg-surface-hover)]" />
                <div className="mt-2 h-3 w-1/4 rounded bg-[var(--bg-surface-hover)]" />
              </div>
            </li>
          ))}
        </ul>
      ) : error && calls.length === 0 ? (
        <EmptyStateMobile
          icon={WifiOff}
          title="Impossible de charger les appels récents"
          description="Vérifiez votre connexion puis réessayez."
          action={
            onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="min-h-11 rounded-full bg-[var(--brand)] px-6 text-[15px] font-semibold text-white"
              >
                Réessayer
              </button>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyStateMobile
          icon={filter === "missed" ? Phone : Clock}
          title={filter === "missed" ? "Aucun appel manqué" : "Aucun appel récent"}
          description={
            filter === "missed"
              ? "Vous n'avez aucun appel manqué. C'est une bonne nouvelle."
              : "Votre historique d'appels apparaîtra ici."
          }
        />
      ) : (
        <div className="pb-6">
          <RecentCallList calls={filtered} contacts={contacts} onCall={onCall} onInfo={setSelected} />
        </div>
      )}

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selectedName || "Appel"}
        description={selected ? formatPhoneNumber(counterpartyNumber(selected)) : undefined}
        className="bc-light"
        footer={
          selected ? (
            <>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full px-4 py-2 text-[15px] font-medium text-[var(--text-secondary)]"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  const number = counterpartyNumber(selected);
                  setSelected(null);
                  if (number) onCall(number);
                }}
                className="flex items-center gap-2 rounded-full bg-[var(--success)] px-5 py-2 text-[15px] font-semibold text-white"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Appeler
              </button>
            </>
          ) : null
        }
      >
        {selected && (
          <dl className="space-y-3 text-[15px]">
            <div className="flex items-center justify-between">
              <dt className="text-[var(--text-secondary)]">Type</dt>
              <dd className={isMissedCall(selected) ? "text-[var(--danger)]" : "text-[var(--text-primary)]"}>
                {callKindLabel(selected)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--text-secondary)]">Statut</dt>
              <dd className="text-[var(--text-primary)]">
                {STATUS_FR[String(selected.status ?? "").toUpperCase()] ?? selected.status ?? "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--text-secondary)]">Quand</dt>
              <dd className="text-[var(--text-primary)]">{recentTimestampLabel(selected.startedAt) || "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--text-secondary)]">Durée</dt>
              <dd className="text-[var(--text-primary)]">{callDurationLabel(selected) ?? "—"}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </div>
  );
}
