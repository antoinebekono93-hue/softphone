"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Phone } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useCallRouter } from "@/hooks/useCallRouter";
import { useTelnyx } from "@/contexts/TelnyxContext";
import { formatPhoneNumber } from "@/lib/utils";
import { usePhoneData } from "./usePhoneData";
import { MobileBottomTabBar, type PhoneTab } from "./MobileBottomTabBar";
import { MobileActiveCall } from "./MobileActiveCall";
import { MobileFavoritesView } from "./MobileFavoritesView";
import { MobileRecentsView } from "./MobileRecentsView";
import { MobileContactsView } from "./MobileContactsView";
import { MobileDialerView } from "./MobileDialerView";
import { MobileMessagesView } from "./MobileMessagesView";
import { contactName, isMissedCall, type PhoneContact } from "./phone-utils";

/**
 * Shell mobile de l'expérience « app Téléphone » Buster Call. Monté uniquement
 * sur mobile (`.bc-phone md:hidden`) en remplacement visuel de l'atelier
 * desktop. La logique métier (routage, WebRTC, PSTN, historique, voicemail)
 * reste strictement celle des contextes et API existants.
 */
export function MobilePhoneShell() {
  const [tab, setTab] = useState<PhoneTab>("dialer");
  const [selectedContact, setSelectedContact] = useState<PhoneContact | null>(null);
  const { contacts, calls, voicemails, loading } = usePhoneData();
  const { routeCall } = useCallRouter();
  const { callState } = useTelnyx();

  const badges = useMemo<Partial<Record<PhoneTab, number>>>(
    () => ({
      recents: calls.filter(isMissedCall).length,
      messages: voicemails.length,
    }),
    [calls, voicemails],
  );

  const callNumber = (number: string) => {
    if (!number) return;
    void routeCall(number);
  };

  const callContact = (contact: PhoneContact) => callNumber(contact.phone);

  return (
    <div className="bc-phone bc-light md:hidden">
      <div className="flex items-center justify-end px-3" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Link
          href="/dashboard/inbox"
          className="grid h-10 w-10 place-items-center rounded-full text-[var(--text-muted)] transition-colors active:bg-[var(--bg-surface-hover)]"
          aria-label="Revenir à l'application"
        >
          <LayoutGrid className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      <main key={tab} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {tab === "favorites" && (
          <MobileFavoritesView
            contacts={contacts}
            onCall={callContact}
            onSelect={setSelectedContact}
          />
        )}
        {tab === "recents" && (
          <MobileRecentsView
            calls={calls}
            contacts={contacts}
            loading={loading}
            onCall={callNumber}
          />
        )}
        {tab === "contacts" && (
          <MobileContactsView
            contacts={contacts}
            loading={loading}
            onCall={callContact}
            onSelect={setSelectedContact}
          />
        )}
        {tab === "dialer" && (
          <MobileDialerView onCall={callNumber} disabled={callState === "ringing"} />
        )}
        {tab === "messages" && (
          <MobileMessagesView voicemails={voicemails} contacts={contacts} loading={loading} />
        )}
      </main>

      <MobileBottomTabBar active={tab} onChange={setTab} badges={badges} />

      <MobileActiveCall />

      <Modal
        open={selectedContact !== null}
        onClose={() => setSelectedContact(null)}
        title={selectedContact ? contactName(selectedContact) : ""}
        description={selectedContact ? formatPhoneNumber(selectedContact.phone) : undefined}
        className="bc-light"
        footer={
          selectedContact ? (
            <>
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="rounded-full px-4 py-2 text-[15px] font-medium text-[var(--text-secondary)]"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  const contact = selectedContact;
                  setSelectedContact(null);
                  callContact(contact);
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
        {selectedContact && (
          <dl className="space-y-3 text-[15px]">
            {selectedContact.company && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-secondary)]">Entreprise</dt>
                <dd className="truncate text-[var(--text-primary)]">{selectedContact.company}</dd>
              </div>
            )}
            {selectedContact.email && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-secondary)]">Email</dt>
                <dd className="truncate text-[var(--text-primary)]">{selectedContact.email}</dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--text-secondary)]">Statut</dt>
              <dd className="text-[var(--text-primary)]">
                {selectedContact.isVip ? "Client VIP" : "Contact"}
              </dd>
            </div>
            {typeof selectedContact.purchaseCount === "number" && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-secondary)]">Achats</dt>
                <dd className="text-[var(--text-primary)]">{selectedContact.purchaseCount}</dd>
              </div>
            )}
            {selectedContact.groups && selectedContact.groups.length > 0 && (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-[var(--text-secondary)]">Groupes</dt>
                <dd className="text-right text-[var(--text-primary)]">
                  {selectedContact.groups.map((group) => group.name).join(", ")}
                </dd>
              </div>
            )}
          </dl>
        )}
      </Modal>
    </div>
  );
}
