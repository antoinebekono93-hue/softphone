"use client";

import { useTelnyx } from "@/contexts/TelnyxContext";
import { IncomingCall } from "./IncomingCall";

export function GlobalIncomingCall() {
  const { callState, callDirection, incomingCallerId, answerCall, rejectCall } = useTelnyx();

  if (callState !== "ringing" || callDirection !== "inbound" || !incomingCallerId) {
    return null;
  }

  return (
    <IncomingCall
      callerNumber={incomingCallerId}
      onAccept={answerCall}
      onReject={rejectCall}
    />
  );
}
