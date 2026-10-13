"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Pause, Play, Voicemail } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";
import { EmptyStateMobile } from "./EmptyStateMobile";
import { ScreenTitle } from "./ScreenTitle";
import {
  callDurationLabel,
  contactName,
  initials,
  matchContact,
  recentTimestampLabel,
  type PhoneContact,
  type PhoneVoicemail,
} from "./phone-utils";

function VoicemailRow({
  voicemail,
  contacts,
  playingId,
  onMarkPlaying,
}: {
  voicemail: PhoneVoicemail;
  contacts: PhoneContact[];
  playingId: string | null;
  onMarkPlaying: (id: string | null) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contact = matchContact(contacts, voicemail.fromNumber);
  const name = contact ? contactName(contact) : formatPhoneNumber(voicemail.fromNumber ?? "");
  const duration = callDurationLabel({ id: voicemail.id, duration: voicemail.duration });
  const isPlaying = playingId === voicemail.id;

  useEffect(() => {
    const element = audioRef.current;
    if (element && !isPlaying && !element.paused) element.pause();
  }, [isPlaying]);

  const toggle = () => {
    const element = audioRef.current;
    if (!element) return;
    if (element.paused) {
      void element
        .play()
        .then(() => onMarkPlaying(voicemail.id))
        .catch(() => undefined);
    } else {
      element.pause();
      onMarkPlaying(null);
    }
  };

  return (
    <li className="flex gap-3 border-b border-[var(--border-subtle)] px-4 py-3 last:border-b-0">
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

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[17px] text-[var(--text-primary)]">{name}</span>
          <span className="shrink-0 text-[13px] tabular-nums text-[var(--text-secondary)]">
            {recentTimestampLabel(voicemail.startedAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-white transition-transform active:scale-95"
            aria-label={isPlaying ? "Pause" : "Écouter le message"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <span className="text-[13px] tabular-nums text-[var(--text-secondary)]">
            {duration ?? "Message vocal"}
          </span>
        </div>
        {voicemail.transcriptionText?.trim() && (
          <p
            className="mt-1.5 text-[14px] leading-snug text-[var(--text-secondary)]"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {voicemail.transcriptionText}
          </p>
        )}
        <audio
          ref={audioRef}
          src={voicemail.audioUrl}
          preload="none"
          onEnded={() => onMarkPlaying(null)}
        />
      </div>
    </li>
  );
}

/**
 * Onglet Messagerie : boîte vocale réelle (/api/voicemails) avec lecture audio
 * et transcription, plus un accès à la messagerie complète (SMS / WhatsApp).
 */
export function MobileMessagesView({
  voicemails,
  contacts,
  loading,
}: {
  voicemails: PhoneVoicemail[];
  contacts: PhoneContact[];
  loading: boolean;
}) {
  const [playingId, setPlayingId] = useState<string | null>(null);

  return (
    <div className="flex min-h-full flex-col">
      <ScreenTitle
        title="Messagerie"
        action={
          <Link
            href="/dashboard/inbox"
            className="mb-1 grid h-9 w-9 place-items-center rounded-full text-[var(--brand)] transition-colors active:bg-[var(--bg-surface-hover)]"
            aria-label="Ouvrir la messagerie complète"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </Link>
        }
      />

      <p className="px-4 pb-2 text-[13px] text-[var(--text-secondary)]">Messagerie vocale</p>

      {loading && voicemails.length === 0 ? (
        <p className="px-4 py-10 text-center text-[14px] text-[var(--text-secondary)]">Chargement…</p>
      ) : voicemails.length === 0 ? (
        <EmptyStateMobile
          icon={Voicemail}
          title="Aucun message vocal"
          description="Les messages laissés sur votre ligne Buster Call apparaîtront ici."
        />
      ) : (
        <ul className="mx-4 mb-4 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          {voicemails.map((voicemail) => (
            <VoicemailRow
              key={voicemail.id}
              voicemail={voicemail}
              contacts={contacts}
              playingId={playingId}
              onMarkPlaying={setPlayingId}
            />
          ))}
        </ul>
      )}

      <Link
        href="/dashboard/inbox"
        className="mx-4 mb-6 flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-3 text-[15px] font-medium text-[var(--brand)]"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Ouvrir la messagerie (SMS, WhatsApp)
      </Link>
    </div>
  );
}
