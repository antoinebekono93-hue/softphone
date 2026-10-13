"use client";

import { MobilePhoneShell } from "@/components/mobile/phone/MobilePhoneShell";
import { useIsDesktop } from "@/components/mobile/phone/useIsDesktop";
import { SoftphoneWorkspace } from "./SoftphoneWorkspace";

// Mounts exactly one phone experience: the desktop workspace OR the mobile
// shell, never both. This removes the duplicated data fetches / listeners /
// caller-ID polling that came from keeping the desktop tree hidden-but-mounted.
// Call engines and the ringtone stay global (CommunicationProvider), so the
// active call and audio survive the switch.
export function SoftphoneExperience() {
  const isDesktop = useIsDesktop();

  if (isDesktop === null) return null;

  if (isDesktop) {
    return (
      <div className="flex-1 min-h-0 flex">
        <SoftphoneWorkspace />
      </div>
    );
  }

  return <MobilePhoneShell />;
}
