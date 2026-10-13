"use client";
import { AppCallProvider } from "@/contexts/AppCallContext";
import { TelnyxProvider } from "@/contexts/TelnyxContext";
import { GlobalIncomingCall } from "@/components/softphone/GlobalIncomingCall";
import { GlobalAppIncomingCall } from "@/components/softphone/GlobalAppIncomingCall";
import { GlobalRingtone } from "@/components/softphone/GlobalRingtone";

// Mounted once for the authenticated workspace; survives page/tab navigation.
export function CommunicationProvider({ children }: { children: React.ReactNode }) {
  return <AppCallProvider><TelnyxProvider>
    {children}
    <GlobalRingtone />
    <GlobalIncomingCall />
    <GlobalAppIncomingCall />
  </TelnyxProvider></AppCallProvider>;
}
