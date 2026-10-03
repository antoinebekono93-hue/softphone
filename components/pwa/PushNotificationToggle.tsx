"use client";

import { useWebPush } from "@/hooks/useWebPush";
import { Bell, BellOff } from "lucide-react";

export function PushNotificationToggle({ isCollapsed }: { isCollapsed?: boolean }) {
  const { isSupported, permission, isSubscribed, subscribe, unsubscribe } = useWebPush();

  if (!isSupported) return null;

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
        isSubscribed 
          ? "text-[var(--brand)] bg-[var(--brand)]/10 hover:bg-[var(--brand)]/20" 
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
      } ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? (isSubscribed ? "Notifications activées" : "Activer les notifications") : undefined}
    >
      {isSubscribed ? (
        <Bell className="w-5 h-5 shrink-0" />
      ) : (
        <BellOff className="w-5 h-5 shrink-0" />
      )}
      {!isCollapsed && (
        <span className="font-medium truncate">
          {isSubscribed ? "Notifications activées" : "Activer les notifications"}
        </span>
      )}
    </button>
  );
}
