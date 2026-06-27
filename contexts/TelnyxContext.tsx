"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
// @ts-ignore
import { TelnyxRTC } from "@telnyx/webrtc";

type CallState = "idle" | "ringing" | "active" | "held" | "error";

interface TelnyxContextValue {
  isRegistered: boolean;
  registrationError: string | null;
  callState: CallState;
  activeCallId: string | null;
  incomingCallerId: string | null;
  remoteStream: MediaStream | null;
  makeCall: (destination: string) => void;
  answerCall: () => void;
  rejectCall: () => void;
  hangupCall: () => void;
  muteMicrophone: (muted: boolean) => void;
  sendDTMF: (digit: string) => void;
}

const TelnyxContext = createContext<TelnyxContextValue | undefined>(undefined);

export const useTelnyx = () => {
  const context = useContext(TelnyxContext);
  if (!context) {
    throw new Error("useTelnyx must be used within a TelnyxProvider");
  }
  return context;
};

export const TelnyxProvider = ({ children }: { children: React.ReactNode }) => {
  const clientRef = useRef<any>(null);
  const currentCallRef = useRef<any>(null);

  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [callState, setCallState] = useState<CallState>("idle");
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [incomingCallerId, setIncomingCallerId] = useState<string | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const initTelnyx = async () => {
      try {
        // Demander d'abord la permission microphone (important pour Chrome)
        try {
           await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
           console.warn("Microphone permission not granted yet or denied", e);
        }

        // Fetch token from our new secure backend route
        const response = await fetch('/api/telnyx/token');
        if (!response.ok) {
           try {
             const errData = await response.json();
             setRegistrationError(errData.error || "Erreur serveur (Token)");
           } catch (e) {
             setRegistrationError("Erreur serveur (Token)");
           }
           return;
        }
        
        const data = await response.json();
        const token = data.token;
        
        // Initialize Telnyx WebRTC Client
        clientRef.current = new TelnyxRTC({
          login_token: token,
          remoteElement: "telnyx-remote-audio", // The ID of our <audio> element
        } as any);

        clientRef.current.on("telnyx.ready", () => {
          setIsRegistered(true);
          console.log("Telnyx WebRTC Ready");
        });

        clientRef.current.on("telnyx.error", (err: any) => {
          setRegistrationError(err.message || "Connection failed");
        });

        clientRef.current.on("telnyx.notification", (notification: any) => {
          const call = notification.call;
          if (!call) return;

          switch (notification.type) {
            case "callUpdate":
              if (call.state === "ringing") {
                setCallState("ringing");
                setIncomingCallerId(call.options.remoteCallerName || call.options.remoteCallerNumber);
                currentCallRef.current = call;
              } else if (call.state === "active") {
                setCallState("active");
                setActiveCallId(call.id);
                // Set the remote stream so AudioVisualizer can use it
                if (call.remoteStream) {
                   setRemoteStream(call.remoteStream);
                }
              } else if (call.state === "destroy") {
                setCallState("idle");
                setActiveCallId(null);
                setIncomingCallerId(null);
                setRemoteStream(null);
                currentCallRef.current = null;
              }
              break;
            default:
              break;
          }
        });

        // Connect to Telnyx WebRTC
        clientRef.current.connect();
      } catch (err) {
        console.error("Failed to initialize Telnyx:", err);
        setRegistrationError("Connection failed");
      }
    };

    initTelnyx();

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  const makeCall = (destination: string) => {
    if (!clientRef.current || !isRegistered) return;
    try {
      const call = clientRef.current.newCall({
        destinationNumber: destination,
        audio: true,
        video: false,
      });
      currentCallRef.current = call;
      setCallState("ringing");
    } catch (err) {
      console.error("Failed to make call", err);
    }
  };

  const answerCall = () => {
    if (currentCallRef.current && callState === "ringing") {
      currentCallRef.current.answer();
    }
  };

  const rejectCall = () => {
    if (currentCallRef.current && callState === "ringing") {
      currentCallRef.current.reject();
    }
  };

  const hangupCall = () => {
    if (currentCallRef.current) {
      currentCallRef.current.hangup();
    }
  };

  const muteMicrophone = (muted: boolean) => {
    if (currentCallRef.current) {
      if (muted) {
        currentCallRef.current.muteAudio();
      } else {
        currentCallRef.current.unmuteAudio();
      }
    }
  };

  const sendDTMF = (digit: string) => {
    if (currentCallRef.current && callState === "active") {
      currentCallRef.current.dtmf(digit);
    }
  };

  return (
    <TelnyxContext.Provider value={{
      isRegistered,
      registrationError,
      callState,
      activeCallId,
      incomingCallerId,
      remoteStream,
      makeCall,
      answerCall,
      rejectCall,
      hangupCall,
      muteMicrophone,
      sendDTMF,
    }}>
      {/* Hidden audio element required for Telnyx to attach the remote stream */}
      <audio id="telnyx-remote-audio" autoPlay className="hidden" />
      {children}
    </TelnyxContext.Provider>
  );
};
