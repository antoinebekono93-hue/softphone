import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getConfiguredTelnyxPublicKey } from '@/lib/telnyx';
import { executeAIToolCall, getDefaultAIToolDeps } from '@/lib/ai-tools';
import type { ExecuteAIToolCallInput } from '@/lib/ai-tools';
import { createConsoleEventSink } from '@/lib/ai-tools/observability';
import { handleTelnyxAIToolWebhook } from '@/lib/ai-tools/webhook/handler';
import { verifyTelnyxWebhookSignature } from '@/lib/ai-tools/webhook/signature';
import { createPrismaTelnyxAIToolReplayClaimer } from '@/lib/telnyx-ai-tool-webhook-idempotence';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POINT D'ENTRÉE UNIQUE du webhook tool Telnyx. Tous les outils sont déclarés
 * sur cette même URL (endpoint fixe : jamais une route par outil). Le nom de
 * l'outil et l'identité arrivent dans le body SIGNE (preset_body_fields) et
 * sont vérifiés avant toute exécution. Aucun secret dans l'URL.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers: Record<string, string | undefined> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const response = await handleTelnyxAIToolWebhook(
    { rawBody, headers },
    {
      verifySignature: verifyTelnyxWebhookSignature,
      publicKeyProvider: getConfiguredTelnyxPublicKey,
      claim: createPrismaTelnyxAIToolReplayClaimer().claim,
      executeTool: (input: ExecuteAIToolCallInput) =>
        executeAIToolCall(input, getDefaultAIToolDeps()),
      events: createConsoleEventSink(),
      now: () => Date.now(),
      generateRequestId: () => randomUUID(),
    }
  );

  return NextResponse.json(response.body, { status: response.httpStatus });
}