"use client";

import { useEffect, useState } from "react";
import { useAppCall } from "@/contexts/AppCallContext";
import { useCallRouter } from "@/hooks/useCallRouter";
import { AudioVisualizer } from "./AudioVisualizer";
import { Phone, PhoneOff, Mic, MicOff, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Panneau d'appels internes APP_TO_APP : annuaire + saisie manuelle.
 * Intégré au softphone, distinct du dialer PSTN (Telnyx).
 */
export function AppCallPanel() {
  const {
    appCallStatus,
    outboundPeer,
    remoteStream,
    connected,
    appCallDuration,
    directory,
    refreshDirectory,
    makeAppCall,
    hangupAppCall,
    muteAppMic,
    audioPlayFailed,
    retryRemoteAudio,
  } = useAppCall();

  const { routeCall } = useCallRouter();

  const [target, setTarget] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    refreshDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inCall = appCallStatus === "OFFERING" || appCallStatus === "CONNECTING" || appCallStatus === "ACTIVE" || appCallStatus === "RINGING";

  const handleCall = async () => {
    if (!target.trim() || isCalling) return;
    setIsCalling(true);
    try {
      // Le serveur décide du type de routage (interne vs PSTN).
      await routeCall(target.trim());
    } finally {
      setIsCalling(false);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    muteAppMic(next);
  };

  // Vue "en appel"
  if (inCall) {
    const displayName = outboundPeer?.name || outboundPeer?.username || "Collegue";
    return (
      <div className="flex flex-col items-center justify-between w-full h-full py-6 gap-6">
        <div className="text-center">
          <div className="text-sm font-medium text-[var(--text-secondary)] mb-2 tracking-widest uppercase">
            {appCallStatus === "ACTIVE" || connected ? "Appel interne en cours" : "Appel interne..."}
          </div>
          <div className="text-3xl font-semibold text-[var(--text-primary)]">{displayName}</div>
        </div>

        <div className="relative flex-1 flex items-center justify-center w-full">
          <AudioVisualizer isActive={connected} stream={remoteStream} />
          {connected && audioPlayFailed && (
            <button
              onClick={retryRemoteAudio}
              className="absolute z-20 px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold shadow-lg"
            >
              Activer le son
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isMuted ? "bg-amber-500 text-white" : "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
            }`}
            aria-label="Muet"
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button
            onClick={hangupAppCall}
            className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-400 flex items-center justify-center shadow-lg active:scale-95"
            aria-label="Raccrocher"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
          <div className="w-14" />
        </div>
        <div className="text-xs text-[var(--text-secondary)]">
          {connected ? `${Math.floor(appCallDuration / 60)}m ${appCallDuration % 60}s` : ""}
        </div>
      </div>
    );
  }

  // Vue repos : annuaire + saisie
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
          Appel interne (App-to-App)
        </div>
        <div className="text-[11px] text-[var(--text-secondary)]">
          Composez un nom d&apos;utilisateur, une extension ou un email
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCall()}
          placeholder="ex. alice, 101, alice@acme.com"
          className="flex-1 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
        />
        <button
          onClick={handleCall}
          disabled={isCalling || !target.trim()}
          className="p-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-40 transition-colors"
          aria-label="Appeler"
        >
          {isCalling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5" />}
        </button>
      </div>

      <div className="text-[11px] uppercase font-bold text-[var(--text-secondary)] tracking-wider flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" /> Annuaire de l&apos;équipe
      </div>
      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
        {directory.length === 0 ? (
          <div className="text-xs text-[var(--text-secondary)] text-center py-4">
            Aucun collègue joignable en interne
          </div>
        ) : (
          directory.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-surface)] transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {u.name || u.callUsername}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {u.callUsername ? `@${u.callUsername}` : ""}
                  {u.callExtension ? ` • ext ${u.callExtension}` : ""}
                </span>
              </div>
              <button
                onClick={() => {
                  const dial = u.callUsername || u.callExtension || u.email || "";
                  if (dial) makeAppCall(dial);
                  else toast.error("Ce collègue n'a pas d'identifiant d'appel");
                }}
                className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors"
                aria-label={`Appeler ${u.name || u.callUsername}`}
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
