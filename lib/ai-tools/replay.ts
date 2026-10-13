import type { AIToolExecutionResult } from './types';

export const AI_TOOL_REPLAY_TTL_MS = 10 * 60_000;

/**
 * Idempotency cache keyed by the caller-supplied idempotency key (typically the
 * Telnyx tool-call / event id). Duplicate deliveries of the same tool call
 * return the first result instead of re-running the handler.
 */
export interface AIToolReplayStore {
  get(key: string): AIToolExecutionResult | undefined;
  set(key: string, result: AIToolExecutionResult, ttlMs?: number): void;
}

interface Entry {
  result: AIToolExecutionResult;
  expiresAt: number;
}

export function createInMemoryReplayStore(
  now: () => number = Date.now,
  maxEntries = 5000
): AIToolReplayStore {
  const entries = new Map<string, Entry>();

  function prune(at: number): void {
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= at) entries.delete(key);
    }
  }

  return {
    get(key: string): AIToolExecutionResult | undefined {
      const at = now();
      prune(at);
      return entries.get(key)?.result;
    },
    set(key: string, result: AIToolExecutionResult, ttlMs = AI_TOOL_REPLAY_TTL_MS): void {
      const at = now();
      prune(at);
      if (entries.size >= maxEntries) {
        const oldest = entries.keys().next().value;
        if (oldest !== undefined) entries.delete(oldest);
      }
      entries.set(key, { result, expiresAt: at + ttlMs });
    },
  };
}
