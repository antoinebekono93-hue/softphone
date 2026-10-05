"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export interface CallRecord {
  id: string;
  type: "inbound" | "outbound" | "missed";
  number: string;
  duration: number; // seconds
  timestamp: number; // Unix ms
}

const STORAGE_PREFIX = "antigravity-private:call-history:";
const MAX_RECORDS = 100;

export function useCallHistory() {
  const { data: session } = useSession();
  const scope = session?.user?.id && session.user.organizationId ? session.user.organizationId + ":" + session.user.id : "";
  const storageKey = scope ? STORAGE_PREFIX + scope : "";
  const [state, setState] = useState<{ scope: string; records: CallRecord[] }>({ scope: "", records: [] });
  const history = state.scope === scope ? state.records : [];
  const setHistory = useCallback((update: CallRecord[] | ((previous: CallRecord[]) => CallRecord[])) => {
    setState(previous => ({ scope, records: typeof update === "function" ? update(previous.scope === scope ? previous.records : []) : update }));
  }, [scope]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = storageKey ? localStorage.getItem(storageKey) : null;
      setHistory([]);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setHistory(parsed.filter(record =>
          record && typeof record.id === "string" && typeof record.number === "string" &&
          ["inbound", "outbound", "missed"].includes(record.type) &&
          typeof record.timestamp === "number" && typeof record.duration === "number"
        ).slice(0, MAX_RECORDS));
      }
    } catch {
      console.warn("[CallHistory] Failed to load from localStorage");
    }
  }, [storageKey, setHistory]);

  // Save to localStorage whenever history changes
  const persist = useCallback((records: CallRecord[]) => {
    try {
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(records));
    } catch {
      console.warn("[CallHistory] Failed to save to localStorage");
    }
  }, [storageKey]);

  const addRecord = useCallback(
    (record: Omit<CallRecord, "id">) => {
      const newRecord: CallRecord = {
        ...record,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };

      setHistory((prev) => {
        const updated = [newRecord, ...prev].slice(0, MAX_RECORDS);
        persist(updated);
        return updated;
      });
    },
    [persist, setHistory]
  );

  const removeRecord = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist, setHistory]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    persist([]);
  }, [persist, setHistory]);

  return {
    history,
    addRecord,
    removeRecord,
    clearHistory,
  };
}
