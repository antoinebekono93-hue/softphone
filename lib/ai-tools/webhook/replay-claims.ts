/**
 * Claim d'idempotence du webhook tool. En production il est assuré par la table
 * `WebhookEvent` existante (provider TELNYX) — jamais une seconde table. Les
 * tests injectent un claimer purement en mémoire, sans base de données.
 */

export type TelnyxAIToolReplayClaim =
  | 'NEW'
  | 'DUPLICATE';

export interface TelnyxAIToolReplayClaimer {
  claim(eventId: string): Promise<TelnyxAIToolReplayClaim>;
}

export function createInMemoryTelnyxAIToolReplayClaimer(): TelnyxAIToolReplayClaimer {
  const seen = new Set<string>();
  return {
    async claim(eventId: string): Promise<TelnyxAIToolReplayClaim> {
      if (seen.has(eventId)) return 'DUPLICATE';
      seen.add(eventId);
      return 'NEW';
    },
  };
}