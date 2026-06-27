"use client";

import { useState, useEffect, useCallback } from "react";

export interface CallRecord {
  id: string;
  type: "inbound" | "outbound" | "missed";
  number: string;
  duration: number; // seconds
  timestamp: number; // Unix ms
}

const STORAGE_KEY = "antigravity-call-history";
const MAX_RECORDS = 100;

export function useCallHistory() {
  const [history, setHistory] = useState<CallRecord[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      console.warn("[CallHistory] Failed to load from localStorage");
    }
  }, []);

  // Save to localStorage whenever history changes
  const persist = useCallback((records: CallRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      console.warn("[CallHistory] Failed to save to localStorage");
    }
  }, []);

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
    [persist]
  );

  const removeRecord = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    persist([]);
  }, [persist]);

  return {
    history,
    addRecord,
    removeRecord,
    clearHistory,
  };
}
