import { randomUUID } from 'node:crypto';
import { prismaAppointmentWriter } from '../appointment-writer-prisma';
import { prismaAIToolDataAccess } from './data-access-prisma';
import { createConsoleEventSink } from './observability';
import { createAIToolRateLimiter } from './rate-limit';
import { createInMemoryReplayStore } from './replay';
import type { AIToolDeps } from './types';

let defaultDeps: AIToolDeps | null = null;

/**
 * Runtime dependencies wired for production. Kept as a single process-level
 * instance so the rate limiter and replay cache persist across tool calls.
 * Tests never import this module; they build pure dependencies directly.
 */
export function getDefaultAIToolDeps(): AIToolDeps {
  if (!defaultDeps) {
    defaultDeps = {
      db: prismaAIToolDataAccess,
      rateLimiter: createAIToolRateLimiter(),
      // Stricter budget for write tools: appointments are costlier and
      // irreversible. Read tools keep the default limiter above.
      writeRateLimiter: createAIToolRateLimiter({
        assistant: { max: 5, windowMs: 60_000 },
        organization: { max: 20, windowMs: 60_000 },
        conversation: { max: 3, windowMs: 60_000 },
      }),
      replayStore: createInMemoryReplayStore(),
      events: createConsoleEventSink(),
      now: () => Date.now(),
      generateRequestId: () => randomUUID(),
      appointments: prismaAppointmentWriter,
    };
  }
  return defaultDeps;
}

export function createDefaultAIToolDeps(
  overrides: Partial<AIToolDeps> = {}
): AIToolDeps {
  return { ...getDefaultAIToolDeps(), ...overrides };
}
