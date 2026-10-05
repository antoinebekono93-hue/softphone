"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { clearOfflineSnapshots, clearPrivateLocalStorage, hasPrivateLocalData } from "@/lib/offline-store";

const OWNER_KEY = "antigravity-storage-owner";

// A temporary network or server failure must never be mistaken for a sign-out:
// drafts, call history and offline snapshots are only discarded once the server
// explicitly confirms that no session exists.

export function PrivateStorageBoundary() {
  const { data: session, status } = useSession();
  const scope = session?.user?.id && session.user.organizationId
    ? session.user.organizationId + ":" + session.user.id : null;
  useEffect(() => {
    if (status === "loading") return;
    const controller = new AbortController();
    let cancelled = false;

    function purge() {
      clearPrivateLocalStorage();
      window.dispatchEvent(new Event("antigravity-private-cleared"));
      void clearOfflineSnapshots();
      try { localStorage.removeItem(OWNER_KEY); } catch { /* Optional storage. */ }
    }

    if (scope) {
      try {
        const previous = localStorage.getItem(OWNER_KEY);
        if (previous && previous !== scope) purge();
        localStorage.setItem(OWNER_KEY, scope);
      } catch { /* Optional storage. */ }
      localStorage.removeItem("antigravity-call-history");
      return () => { cancelled = true; controller.abort(); };
    }

    // No session yet: keep everything until the answer is definitive. Offline the
    // server cannot be asked, so the previous owner's data stays untouched.
    if (!navigator.onLine || !hasPrivateLocalData()) {
      return () => { cancelled = true; controller.abort(); };
    }
    void (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store", signal: controller.signal });
        if (cancelled || !res.ok) return;
        const data: { user?: unknown } | null = await res.json().catch(() => null);
        if (cancelled || !data || data.user) return;
        purge();
      } catch { /* Unreachable server: local data is preserved. */ }
    })();
    return () => { cancelled = true; controller.abort(); };
  }, [scope, status]);
  return null;
}