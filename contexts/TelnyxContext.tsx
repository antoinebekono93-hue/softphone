"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
// @ts-ignore
import { TelnyxRTC } from "@telnyx/webrtc";
import { toast } from "sonner";

type CallState = "idle" | "ringing" | "active" | "held" | "error";

interface TelnyxContextValue {
  isRegistered: boolean;
  registrationError: string | null;
  callState: CallState;
  callDirection: "inbound" | "outbound" | null;
  activeCallId: string | null;
  incomingCallerId: string | null;
  remoteStream: MediaStream | null;
  makeCall: (destination: string, callerId?: string) => void;
  answerCall: () => void;
  rejectCall: () => void;
  hangupCall: () => void;
  muteMicrophone: (muted: boolean) => void;
  sendDTMF: (digit: string) => void;
  debugLog: string;
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
  const [callDirection, setCallDirection] = useState<"inbound" | "outbound" | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [incomingCallerId, setIncomingCallerId] = useState<string | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [debugLog, setDebugLog] = useState<string>("");

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
          const logMsg = `${notification.type} -> ${call?.state}`;
          console.log("[Telnyx Notification]", logMsg);
          setDebugLog(prev => prev ? `${prev} | ${logMsg}` : logMsg);
          
          if (!call) return;

          switch (notification.type) {
            case "callUpdate":
              if (call.state === "ringing") {
                setCallState("ringing");
                setIncomingCallerId(call.options.remoteCallerName || call.options.remoteCallerNumber);
                // If we didn't initiate it, it's inbound
                // We know it's not our outbound call if currentCallRef doesn't match
                if (!currentCallRef.current || (currentCallRef.current.id !== call.id && currentCallRef.current.callId !== call.callId)) {
                  setCallDirection("inbound");
                  
                  // Attach direct listener to inbound call
                  call.on('destroy', () => {
                    console.log("Direct call.on('destroy') fired for inbound!");
                    setDebugLog(prev => prev ? `${prev} | inbound direct -> destroy` : `inbound direct -> destroy`);
                    setCallState("idle");
                    setCallDirection(null);
                    setActiveCallId(null);
                    setIncomingCallerId(null);
                    setRemoteStream(null);
                    currentCallRef.current = null;
                  });
                }
                currentCallRef.current = call;
              } else if (call.state === "active") {
                setCallState("active");
                setActiveCallId(call.id);
                // Set the remote stream so AudioVisualizer can use it
                if (call.remoteStream) {
                   setRemoteStream(call.remoteStream);
                }
              } else if (call.state === "destroy" || call.state === "hangup") {
                setCallState("idle");
                setCallDirection(null);
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

  const makeCall = async (destination: string, callerId?: string) => {
    if (!clientRef.current || !isRegistered) {
      toast.error("Le téléphone n'est pas encore connecté au réseau.");
      return;
    }
    
    // Check Microphone permissions explicitly before making the call
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.error("Microphone access denied:", err);
      toast.error("Veuillez autoriser l'accès au microphone dans votre navigateur pour passer des appels.");
      return;
    }

    try {
      let cleanDestination = destination.replace(/[^0-9+]/g, "");
      
      // Force E.164 formatting
      if (cleanDestination.length === 10 && !cleanDestination.startsWith("+")) {
        cleanDestination = "+1" + cleanDestination;
      } else if (cleanDestination.length > 10 && !cleanDestination.startsWith("+")) {
        cleanDestination = "+" + cleanDestination;
      }
      
      const call = clientRef.current.newCall({
        destinationNumber: cleanDestination,
        callerNumber: callerId, // Pass the selected Caller ID here
        audio: true,
        video: false,
      });

      // Listen to the call directly for reliable hangup detection
      call.on('destroy', () => {
        console.log("Direct call.on('destroy') fired!");
        setDebugLog(prev => prev ? `${prev} | direct -> destroy` : `direct -> destroy`);
        setCallState("idle");
        setCallDirection(null);
        setActiveCallId(null);
        setIncomingCallerId(null);
        setRemoteStream(null);
        currentCallRef.current = null;
      });

      currentCallRef.current = call;
      setIncomingCallerId(cleanDestination);
      setCallDirection("outbound");
      setCallState("ringing");
    } catch (err: any) {
      console.error("Failed to make call", err);
      setCallState("idle");
      toast.error("Erreur lors de l'appel. Vérifiez le format du numéro.");
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
      try {
        currentCallRef.current.hangup();
      } catch (e) {
        console.error("Error hanging up call:", e);
      }
    }
    
    // Safety fallback: if Telnyx fails to fire the destroy event within 3 seconds, force reset
    setTimeout(() => {
      if (currentCallRef.current) {
        console.warn("Telnyx didn't fire destroy event. Forcing UI reset to prevent stuck call.");
        setCallState("idle");
        setCallDirection(null);
        setActiveCallId(null);
        setIncomingCallerId(null);
        setRemoteStream(null);
        currentCallRef.current = null;
      }
    }, 3000);
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
      callDirection,
      activeCallId,
      incomingCallerId,
      remoteStream,
      makeCall,
      answerCall,
      rejectCall,
      hangupCall,
      muteMicrophone,
      sendDTMF,
      debugLog, // Expose debug log
    }}>
      {/* Hidden audio element required for Telnyx to attach the remote stream */}
      <audio id="telnyx-remote-audio" autoPlay className="hidden" />
      {children}
    </TelnyxContext.Provider>
  );
};
