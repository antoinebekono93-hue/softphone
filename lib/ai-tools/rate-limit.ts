export interface AIToolRateLimitInput {
  assistantId: string;
  organizationId: string;
  conversationId?: string | null;
}

export interface AIToolRateLimitDecision {
  allowed: boolean;
  retryAfterMs: number;
}

export interface AIToolRateLimiter {
  check(input: AIToolRateLimitInput): AIToolRateLimitDecision;
}

interface ScopeConfig {
  max: number;
  windowMs: number;
}

export interface AIToolRateLimiterOptions {
  assistant?: ScopeConfig;
  organization?: ScopeConfig;
  conversation?: ScopeConfig;
  now?: () => number;
}

const DEFAULTS = {
  assistant: { max: 120, windowMs: 60_000 },
  organization: { max: 300, windowMs: 60_000 },
  conversation: { max: 60, windowMs: 60_000 },
};

/**
 * Deterministic sliding-window limiter scoped per assistant, organization and
 * conversation. It peeks every scope first and only records hits when the whole
 * request is allowed, so a denied call never partially consumes another scope.
 * Pure and in-memory: the caller injects it, keeping tests and the runtime free
 * of shared state.
 */
export function createAIToolRateLimiter(
  opts: AIToolRateLimiterOptions = {}
): AIToolRateLimiter {
  const now = opts.now ?? Date.now;
  const assistant = opts.assistant ?? DEFAULTS.assistant;
  const organization = opts.organization ?? DEFAULTS.organization;
  const conversation = opts.conversation ?? DEFAULTS.conversation;

  const buckets = new Map<string, number[]>();

  function recent(key: string, windowMs: number, at: number): number[] {
    const stamps = (buckets.get(key) ?? []).filter((t) => at - t < windowMs);
    buckets.set(key, stamps);
    return stamps;
  }

  function retryAfter(stamps: number[], windowMs: number, at: number): number {
    if (stamps.length === 0) return 0;
    return Math.max(0, windowMs - (at - stamps[0]));
  }

  return {
    check(input: AIToolRateLimitInput): AIToolRateLimitDecision {
      const at = now();
      const targets: Array<{ key: string; scope: ScopeConfig }> = [
        { key: `assistant:${input.assistantId}`, scope: assistant },
        { key: `organization:${input.organizationId}`, scope: organization },
      ];
      if (input.conversationId) {
        targets.push({
          key: `conversation:${input.conversationId}`,
          scope: conversation,
        });
      }

      const counted = targets.map((target) => ({
        target,
        stamps: recent(target.key, target.scope.windowMs, at),
      }));

      for (const { target, stamps } of counted) {
        if (stamps.length >= target.scope.max) {
          return {
            allowed: false,
            retryAfterMs: retryAfter(stamps, target.scope.windowMs, at),
          };
        }
      }

      for (const { target, stamps } of counted) {
        stamps.push(at);
        buckets.set(target.key, stamps);
      }

      return { allowed: true, retryAfterMs: 0 };
    },
  };
}
