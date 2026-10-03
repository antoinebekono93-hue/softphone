import { useEffect, useRef } from "react";
import { useTelnyx } from "@/contexts/TelnyxContext";
import { useAppCall } from "@/contexts/AppCallContext";

export function useRingtone() {
  const { callState, callDirection } = useTelnyx();
  const { appCallStatus } = useAppCall();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isRinging = (callState === "ringing" && callDirection === "inbound") || appCallStatus === "RINGING";

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio("/ringtone.mp3");
      audio.loop = true;
      audioRef.current = audio;
    }

    if (isRinging) {
      audioRef.current.play().catch((e) => {
        console.warn("Autoplay bloqué pour la sonnerie :", e);
      });
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isRinging]);
}
