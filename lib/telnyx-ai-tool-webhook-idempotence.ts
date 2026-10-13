import { prisma } from '@/lib/prisma';
import type {
  TelnyxAIToolReplayClaim,
  TelnyxAIToolReplayClaimer,
} from '@/lib/ai-tools/webhook/replay-claims';

/**
 * Claim d'idempotence DURABLE du webhook tool, via la table `WebhookEvent`
 * existante (provider TELNYX) — jamais une seconde table. Une contrainte
 * unique P2002 signifie « déjà traité » ; le rejeu est alors absorbé
 * silencieusement. Cet adaptateur Prisma vit HORS de lib/ai-tools pour que le
 * noyau du registre/parseur reste, par construction, sans aucune écriture.
 */
export function createPrismaTelnyxAIToolReplayClaimer(
  provider = 'TELNYX',
  type = 'ai_tool_webhook'
): TelnyxAIToolReplayClaimer {
  return {
    async claim(eventId: string): Promise<TelnyxAIToolReplayClaim> {
      try {
        await prisma.webhookEvent.create({
          data: { provider, eventId, type },
        });
        return 'NEW';
      } catch (error) {
        if ((error as { code?: string } | null)?.code === 'P2002') {
          return 'DUPLICATE';
        }
        throw error;
      }
    },
  };
}