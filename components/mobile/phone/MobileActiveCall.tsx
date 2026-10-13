"use client";

import { useEffect, useState } from "react";
import { Grid3x3, Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { useTelnyx } from "@/contexts/TelnyxContext";
import { useAppCall } from "@/contexts/AppCallContext";
import { formatPhoneNumber, formatDuration } from "@/lib/utils";
import { DialerKeypad } from "./DialerKeypad";
import { initials } from "./phone-utils";

const PSTN_LABEL: Record<string, string> = {
  ringing: "Appel en cours",
  connecting: "Connexion…",
  active: "En communication",
  held: "En attente",
  error: "Appel interrompu",
};

const APP_LABEL: Record<string, string> = {
  OFFERING: "Appel en cours",
  CONNECTING: "Connexion…",
  ACTIVE: "En communication",
  RINGING: "Sonnerie…",
};

/**
 * Écran d'appel actif mobile, plein cadre dans le shell « app Téléphone ».
 * N'agit que sur les contextes existants (Telnyx pour le PSTN, AppCall pour
 * l'interne) : aucun nouveau canal média, aucune logique métier dupliquée.
 * Les sonneries ENTRANTES restent gérées par les overlays globaux.
 */
export function MobileActiveCall() {
  const {
    callState,
    callDirection,
    incomingCallerId,
    muteMicrophone,
    hangupCall,
    sendDTMF,
    requestAudioUnlock,
    audioPlayFailed,
  } = useTelnyx();
  const {
    appCallStatus,
    outboundPeer,
    appCallDuration,
    hangupAppCall,
    muteAppMic,
    audioPlayFailed: appAudioFailed,
    retryRemoteAudio,
  } = useAppCall();

  const appActive =
    appCallStatus === "OFFERING" || appCallStatus === "CONNECTING" || appCallStatus === "ACTIVE";
  const pstnActive =
    callState !== "idle" && !(callState === "ringing" && callDirection === "inbound");
  const isApp = appActive;

  if (!appActive && !pstnActive) return null;

  const rawName = isApp
    ? outboundPeer?.name || outboundPeer?.username || "Collègue"
    : incomingCallerId || "Inconnu";
  const displayName = isApp ? rawName : formatPhoneNumber(rawName);
  const statusLabel = isApp ? APP_LABEL[appCallStatus] ?? "Appel" : PSTN_LABEL[callState] ?? "Appel";
  const unlockFailed = isApp ? appAudioFailed : audioPlayFailed;

  const handleToggleMute = (next: boolean) => {
    if (isApp) muteAppMic(next);
    else muteMicrophone(next);
  };

  const handleHangup = () => {
    if (isApp) hangupAppCall();
    else hangupCall();
  };

  const handleAudioUnlock = () => {
    if (isApp) retryRemoteAudio();
    else requestAudioUnlock();
  };

  return (
    <ActiveCallSurface
      isApp={isApp}
      displayName={displayName}
      statusLabel={statusLabel}
      timerActive={isApp ? appCallStatus === "ACTIVE" : callState === "active"}
      appElapsed={isApp ? appCallDuration : null}
      unlockFailed={unlockFailed}
      onToggleMute={handleToggleMute}
      onSendDigit={sendDTMF}
      onHangup={handleHangup}
      onAudioUnlock={handleAudioUnlock}
    />
  );
}

function ActiveCallSurface({
  isApp,
  displayName,
  statusLabel,
  timerActive,
  appElapsed,
  unlockFailed,
  onToggleMute,
  onSendDigit,
  onHangup,
  onAudioUnlock,
}: {
  isApp: boolean;
  displayName: string;
  statusLabel: string;
  timerActive: boolean;
  appElapsed: number | null;
  unlockFailed: boolean;
  onToggleMute: (muted: boolean) => void;
  onSendDigit: (digit: string) => void;
  onHangup: () => void;
  onAudioUnlock: () => void;
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!timerActive) return undefined;
    const timer = window.setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, [timerActive]);

  const seconds = appElapsed ?? elapsed;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[var(--bg-base)] px-6 pb-8 text-[var(--text-primary)]">
      <div className="flex flex-1 flex-col items-center overflow-y-auto pb-4 pt-[max(env(safe-area-inset-top),24px)] text-center">
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          {statusLabel}
        </p>

        <div className="mt-6 mb-4 grid h-28 w-28 place-items-center rounded-full bg-[var(--brand)] text-4xl font-semibold text-[var(--brand-foreground)]">
          {initials(displayName) || "?"}
        </div>

        <p className="text-[30px] font-semibold leading-tight tracking-tight">{displayName}</p>
        <p className="mt-1 tabular-nums text-[15px] text-[var(--text-secondary)]">
          {formatDuration(seconds)}
        </p>

        {showKeypad && !isApp && (
          <div className="mt-6">
            <DialerKeypad onDigit={onSendDigit} />
          </div>
        )}
      </div>

      {unlockFailed && (
        <button
          type="button"
          onClick={onAudioUnlock}
          className="mx-auto mb-5 flex items-center gap-2 rounded-full bg-[var(--warning)] px-4 py-2 text-[14px] font-semibold text-white"
        >
          <Volume2 className="h-4 w-4" aria-hidden="true" />
          Activer le son
        </button>
      )}

      <div className="flex items-start justify-center gap-8 pb-6">
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              onToggleMute(next);
            }}
            className={`grid h-16 w-16 place-items-center rounded-full transition-colors ${
              isMuted
                ? "bg-[var(--text-primary)] text-[var(--bg-base)]"
                : "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
            }`}
            aria-pressed={isMuted}
            aria-label={isMuted ? "Réactiver le micro" : "Couper le micro"}
          >
            {isMuted ? <MicOff className="h-6 w-6" aria-hidden="true" /> : <Mic className="h-6 w-6" aria-hidden="true" />}
          </button>
          <span className="text-[12px] text-[var(--text-secondary)]">Muet</span>
        </div>

        {!isApp && (
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowKeypad((prev) => !prev)}
              className={`grid h-16 w-16 place-items-center rounded-full transition-colors ${
                showKeypad
                  ? "bg-[var(--text-primary)] text-[var(--bg-base)]"
                  : "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
              }`}
              aria-pressed={showKeypad}
              aria-label="Clavier"
            >
              <Grid3x3 className="h-6 w-6" aria-hidden="true" />
            </button>
            <span className="text-[12px] text-[var(--text-secondary)]">Clavier</span>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onHangup}
          className="grid h-[72px] w-[72px] place-items-center rounded-full bg-[var(--danger)] text-white shadow-[0_10px_24px_-8px_color-mix(in_oklch,var(--danger)_70%,transparent)] transition-transform active:scale-95"
          aria-label="Raccrocher"
        >
          <PhoneOff className="h-8 w-8" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
