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
  const durationLabel = duration ?? "Message vocal";
  const hasTranscription = !!voicemail.transcriptionText?.trim();

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
    <li className="flex items-start gap-3 px-4 py-2 min-h-[80px] md:min-h-[92px]">
      <span
        className="grid h-12 w-12 md:h-14 md:w-14 shrink-0 place-items-center rounded-full text-[15px] font-semibold mt-1"
        style={{
          background: "color-mix(in oklch, var(--brand) 14%, var(--bg-surface))",
          color: "var(--brand)",
        }}
        aria-hidden="true"
      >
        {initials(name)}
      </span>

      <div className="min-w-0 flex-1 border-b border-[var(--border-subtle)] pb-2 pt-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[16px] md:text-[17px] font-semibold text-[var(--text-primary)]" title={name}>
            {name}
          </span>
          <span className="shrink-0 text-[12px] md:text-[13px] tabular-nums text-[var(--text-secondary)]">
            {recentTimestampLabel(voicemail.startedAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[13px] md:text-[14px] text-[var(--text-secondary)]">
            Message vocal · {durationLabel}
          </span>
        </div>
        {hasTranscription && (
          <p
            className="mt-1 text-[13px] md:text-[14px] leading-snug text-[var(--text-secondary)]"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
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

      <button
        type="button"
        onClick={toggle}
        className="mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-white transition-transform active:scale-95"
        aria-label={isPlaying ? "Mettre en pause le message vocal" : "Lire le message vocal"}
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Play className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
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
            className="mb-1 grid h-11 w-11 place-items-center rounded-full text-[var(--brand)] transition-colors active:bg-[var(--bg-surface-hover)]"
            aria-label="Ouvrir la messagerie complète (SMS, WhatsApp)"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </Link>
        }
      />

      <p className="px-4 pb-2 text-[13px] text-[var(--text-secondary)]">Messagerie vocale</p>

      {loading && voicemails.length === 0 ? (
        <ul className="mb-4">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2 min-h-[80px] md:min-h-[92px] animate-pulse">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-[var(--bg-surface-hover)] shrink-0" />
              <div className="flex-1 border-b border-[var(--border-subtle)] pb-3">
                <div className="flex justify-between gap-2">
                  <div className="h-4 w-1/3 bg-[var(--bg-surface-hover)] rounded" />
                  <div className="h-3 w-12 bg-[var(--bg-surface-hover)] rounded" />
                </div>
                <div className="mt-2 h-3 w-2/3 bg-[var(--bg-surface-hover)] rounded" />
              </div>
              <div className="h-11 w-11 rounded-full bg-[var(--bg-surface-hover)] shrink-0" />
            </li>
          ))}
        </ul>
      ) : voicemails.length === 0 ? (
        <EmptyStateMobile
          icon={Voicemail}
          title="Aucun message vocal"
          description="Vos messages vocaux apparaîtront ici."
        />
      ) : (
        <ul className="mb-4">
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
        className="mx-4 mb-6 flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-3 text-[15px] font-medium text-[var(--brand)] min-h-[44px]"
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        Ouvrir la messagerie (SMS, WhatsApp)
      </Link>
    </div>
  );
}
