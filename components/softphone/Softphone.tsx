"use client";

import { useState, useEffect } from "react";
import { useTelnyx } from "@/contexts/TelnyxContext";
import { Dialpad } from "./Dialpad";
import { CallControls } from "./CallControls";
import { IncomingCall } from "./IncomingCall";
import { AudioVisualizer } from "./AudioVisualizer";
import { formatPhoneNumber } from "@/lib/utils";

export function Softphone() {
  const {
    isRegistered,
    registrationError,
    callState,
    incomingCallerId,
    remoteStream,
    makeCall,
    answerCall,
    rejectCall,
    hangupCall,
    muteMicrophone,
    sendDTMF,
  } = useTelnyx();

  const [showKeypad, setShowKeypad] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === "active") {
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    muteMicrophone(newMutedState);
  };

  const isCallActive = callState === "active";

  return (
    <div className="relative w-full max-w-md mx-auto h-[750px] max-h-[90vh] glass-panel bg-[var(--bg-surface-solid)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center justify-center p-6 pb-2 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isRegistered
                ? "bg-emerald-500"
                : registrationError
                ? "bg-rose-500"
                : "bg-amber-500 animate-pulse"
            }`}
          />
          <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            {isRegistered
              ? "Telnyx Online"
              : registrationError
              ? registrationError
              : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full px-6">
        {callState === "idle" || callState === "ringing" && !incomingCallerId ? (
          <Dialpad
            onCall={makeCall}
            disabled={!isRegistered || callState === "ringing"}
          />
        ) : (
          <div className="flex flex-col items-center w-full h-full justify-between py-8">
            {/* Call Info Header */}
            <div className="text-center w-full mb-8">
              <div className="text-sm font-medium text-[var(--text-secondary)] mb-2 tracking-widest uppercase animate-pulse">
                {callState === "ringing" ? "Calling..." : "Active Call"}
              </div>
              <div className="text-3xl font-semibold text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap">
                {formatPhoneNumber(incomingCallerId || "Unknown")}
              </div>
            </div>

            {/* Central Area: Visualizer or Keypad */}
            <div className="flex-1 flex items-center justify-center w-full mb-8">
              {showKeypad ? (
                <div className="scale-90 origin-center w-full">
                  <Dialpad
                    onDigitPress={sendDTMF}
                    onCall={() => {}} // Disabled during call
                    disabled={false}
                  />
                </div>
              ) : (
                <AudioVisualizer isActive={isCallActive} stream={remoteStream} /> 
              )}
            </div>

            {/* Controls */}
            <CallControls
              isMuted={isMuted}
              callDuration={callDuration}
              onMute={handleToggleMute}
              onKeypad={() => setShowKeypad(!showKeypad)}
              onHangUp={hangupCall}
              showKeypad={showKeypad}
            />
          </div>
        )}
      </div>

      {/* Incoming Call Overlay */}
      {callState === "ringing" && incomingCallerId && (
        <IncomingCall
          callerNumber={incomingCallerId}
          onAccept={answerCall}
          onReject={rejectCall}
        />
      )}
    </div>
  );
}
