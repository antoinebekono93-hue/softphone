import { toSafeErrorCode } from '../errors';
import { getAIToolDefinition, isDefinitionEnabled } from '../registry';
import type {
  AIToolExecutionFailure,
  AIToolExecutionResult,
} from '../types';
import type { AIToolEventSink } from '../observability';
import type { ExecuteAIToolCallInput } from '../execute';
import { parseSignedAIToolWebhookBody } from './parse';
import { deriveTelnyxAIToolReplayKey } from './signature';
import type { TelnyxSignatureVerdict } from './signature';
import type { TelnyxAIToolReplayClaimer } from './replay-claims';

export interface TelnyxAIToolWebhookInput {
  rawBody: string;
  headers: Record<string, string | undefined>;
}

export interface TelnyxAIToolWebhookDeps {
  verifySignature: typeof import('./signature').verifyTelnyxWebhookSignature;
  publicKeyProvider: () => Promise<string>;
  claim: TelnyxAIToolReplayClaimer['claim'];
  executeTool: (input: ExecuteAIToolCallInput) => Promise<AIToolExecutionResult>;
  events: AIToolEventSink;
  now: () => number;
  generateRequestId: () => string;
  maxBodyBytes?: number;
}

export interface TelnyxAIToolWebhookResponse {
  httpStatus: number;
  body: Record<string, unknown>;
}

const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

type FailureCode = AIToolExecutionFailure['error']['code'];

function httpError(
  httpStatus: number,
  error: string,
  body: Record<string, unknown> = {}
): TelnyxAIToolWebhookResponse {
  return { httpStatus, body: { error, ...body } };
}

/**
 * Pipeline unique du webhook tool Telnyx. Ordre de coût croissant : le body
 * brut passe par la taille, la vérification Ed25519 (fail-closed), le parse
 * strict, le claim d'idempotence, la résolution d'identité, la résolution
 * d'outil read-only, puis l'exécution (rate limit compris). Une requête à
 * signature invalide ne consomme AUCUNE ressource d'outil : elle est refusée
 * avant le claim et avant tout rate limiting.
 */
export async function handleTelnyxAIToolWebhook(
  input: TelnyxAIToolWebhookInput,
  deps: TelnyxAIToolWebhookDeps
): Promise<TelnyxAIToolWebhookResponse> {
  const requestId = deps.generateRequestId();
  const maxBodyBytes = deps.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;

  deps.events.emit({
    name: 'AI_TOOL_WEBHOOK_RECEIVED',
    toolName: '',
    assistantId: '',
    requestId,
  });

  if (Buffer.byteLength(input.rawBody, 'utf8') > maxBodyBytes) {
    return httpError(413, 'INVALID_REQUEST');
  }

  let publicKey: string;
  try {
    publicKey = await deps.publicKeyProvider();
  } catch {
    return httpError(503, 'TEMPORARILY_UNAVAILABLE');
  }

  const verdict: TelnyxSignatureVerdict = deps.verifySignature(
    input.rawBody,
    input.headers,
    publicKey,
    deps.now()
  );

  if (!verdict.ok) {
    deps.events.emit({
      name: 'AI_TOOL_WEBHOOK_SIGNATURE_INVALID',
      toolName: '',
      assistantId: '',
      requestId,
      reason: verdict.reason,
    });
    return httpError(401, 'UNAUTHORIZED');
  }

  deps.events.emit({
    name: 'AI_TOOL_WEBHOOK_SIGNATURE_VALID',
    toolName: '',
    assistantId: '',
    requestId,
  });

  const eventId = `ai-tool:${deriveTelnyxAIToolReplayKey(verdict.timestamp, input.rawBody)}`;

  let claim: 'NEW' | 'DUPLICATE';
  try {
    claim = await deps.claim(eventId);
  } catch {
    return httpError(503, 'TEMPORARILY_UNAVAILABLE');
  }

  if (claim === 'DUPLICATE') {
    deps.events.emit({
      name: 'AI_TOOL_WEBHOOK_REPLAY_REJECTED',
      toolName: '',
      assistantId: '',
      requestId,
    });
    return { httpStatus: 200, body: { ok: true, deduplicated: true } };
  }

  const parsed = parseSignedAIToolWebhookBody(input.rawBody);
  if (!parsed.ok) {
    return httpError(400, parsed.error);
  }
  const { assistantId, toolName, arguments: rawArguments, conversationId } = parsed.value;

  const definition = getAIToolDefinition(toolName);
  if (!definition) return httpError(404, 'NOT_FOUND');
  // Registered + enabled is the transport-level gate. The per-assistant write
  // authorization is enforced inside executeAIToolCall (allowlist), so a write
  // tool reaches the pipeline here but is denied there unless explicitly
  // granted. COMMUNICATION/FINANCIAL/TRANSFER are not enabled at all.
  if (!isDefinitionEnabled(definition)) {
    return httpError(403, 'TOOL_NOT_ALLOWED');
  }

  deps.events.emit({
    name: 'AI_TOOL_WEBHOOK_AUTHORIZED',
    toolName,
    assistantId,
    requestId,
    conversationId: conversationId ?? undefined,
  });

  let result: AIToolExecutionResult;
  try {
    result = await deps.executeTool({
      assistantId,
      toolName,
      rawArguments,
      requestId,
      toolCallRequestId: parsed.value.requestId,
      callLogId: null,
      telnyxConversationId: conversationId,
      expectedOrganizationId: null,
    });
  } catch (error) {
    deps.events.emit({
      name: 'AI_TOOL_FAILED',
      toolName,
      assistantId,
      requestId,
      errorCode: toSafeErrorCode(error),
    });
    return httpError(503, 'TEMPORARILY_UNAVAILABLE');
  }

  if (result.ok) {
    return { httpStatus: 200, body: { ok: true, result: result.data } };
  }

  const mapping: Record<FailureCode, number> = {
    NOT_FOUND: 404,
    NOT_ALLOWED: 403,
    INVALID_ARGUMENTS: 400,
    TEMPORARILY_UNAVAILABLE: 503,
    TIME_SLOT_UNAVAILABLE: 409,
    CUSTOMER_NOT_FOUND: 404,
  };
  return httpError(mapping[result.error.code] ?? 503, result.error.code);
}