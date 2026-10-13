import { resolveAuthorizedAssistant } from './context';
import { toSafeErrorCode } from './errors';
import { buildToolDefinitionsForPermissions, getAIToolDefinition, isDefinitionEnabled } from './registry';
import type {
  AIToolDeps,
  AIToolExecutionFailure,
  AIToolExecutionResult,
  AIToolExecutionContext,
  AuthorizedAssistant,
} from './types';
import { asArgumentsObject, rejectUnknownKeys } from './validation';

export interface ExecuteAIToolCallInput {
  assistantId: string;
  toolName: string;
  rawArguments: unknown;
  requestId?: string;
  /** Stable Telnyx tool-call request id (body `request_id`) when available. */
  toolCallRequestId?: string | null;
  callLogId?: string | null;
  telnyxConversationId?: string | null;
  expectedOrganizationId?: string | null;
  idempotencyKey?: string | null;
}

type ErrorCode = AIToolExecutionFailure['error']['code'];

function failure(
  toolName: string,
  requestId: string,
  code: ErrorCode
): AIToolExecutionFailure {
  return { ok: false, toolName, requestId, error: { code } };
}

/**
 * Single entry point for a Telnyx AI tool call. Order of operations:
 * resolve identity -> resolve/allowlist definition -> risk gate -> replay ->
 * rate limit -> parse + unknown-key rejection -> execute -> observe.
 * Every failure is converted to the four-code contract; nothing raw escapes.
 */
export async function executeAIToolCall(
  input: ExecuteAIToolCallInput,
  deps: AIToolDeps
): Promise<AIToolExecutionResult> {
  const requestId =
    typeof input.requestId === 'string' && input.requestId.trim()
      ? input.requestId.trim()
      : deps.generateRequestId();
  const toolName =
    typeof input.toolName === 'string' ? input.toolName.trim() : '';
  const assistantId =
    typeof input.assistantId === 'string' ? input.assistantId.trim() : '';
  const startedAt = deps.now();

  deps.events.emit({
    name: 'AI_TOOL_REQUESTED',
    toolName,
    assistantId,
    requestId,
    conversationId: input.telnyxConversationId ?? undefined,
  });

  let identity: AuthorizedAssistant;
  let allowedTools: string[];
  try {
    const resolved = await resolveAuthorizedAssistant(
      {
        assistantId,
        callLogId: input.callLogId,
        telnyxConversationId: input.telnyxConversationId,
        expectedOrganizationId: input.expectedOrganizationId,
      },
      deps.db
    );
    identity = resolved.identity;
    allowedTools = buildToolDefinitionsForPermissions(
      resolved.grantedPermissions
    ).map((definition) => definition.name);
  } catch (error) {
    const code = toSafeErrorCode(error);
    deps.events.emit({
      name: 'AI_TOOL_DENIED',
      toolName,
      assistantId,
      requestId,
      errorCode: code,
      durationMs: deps.now() - startedAt,
    });
    return failure(toolName, requestId, code);
  }

  const base = {
    toolName,
    assistantId: identity.assistantId,
    employeeId: identity.employeeId,
    organizationId: identity.organizationId,
    conversationId: identity.telnyxConversationId ?? undefined,
    requestId,
  };

  const deny = (code: ErrorCode): AIToolExecutionFailure => {
    deps.events.emit({
      ...base,
      name: 'AI_TOOL_DENIED',
      errorCode: code,
      durationMs: deps.now() - startedAt,
    });
    return failure(toolName, requestId, code);
  };

  const definition = getAIToolDefinition(toolName);
  if (!definition || !isDefinitionEnabled(definition)) {
    return deny('NOT_ALLOWED');
  }
  // Authorization is fully encoded in `allowedTools`, derived from the granted
  // permissions: a write tool only appears once the assistant holds the
  // explicit write permission (never merely because it is registered).
  if (!allowedTools.includes(toolName)) return deny('NOT_ALLOWED');

  const replayKey =
    typeof input.idempotencyKey === 'string' && input.idempotencyKey.trim()
      ? input.idempotencyKey.trim()
      : null;
  if (replayKey) {
    const cached = deps.replayStore.get(replayKey);
    if (cached) return cached;
  }

  const limiter =
    definition.riskLevel === 'READ_ONLY'
      ? deps.rateLimiter
      : deps.writeRateLimiter ?? deps.rateLimiter;
  const decision = limiter.check({
    assistantId: identity.assistantId,
    organizationId: identity.organizationId,
    conversationId: identity.telnyxConversationId,
  });
  if (!decision.allowed) return deny('TEMPORARILY_UNAVAILABLE');

  let args: Record<string, unknown>;
  try {
    args = asArgumentsObject(input.rawArguments);
    rejectUnknownKeys(args, Object.keys(definition.inputSchema.properties));
  } catch (error) {
    const code = toSafeErrorCode(error);
    deps.events.emit({
      ...base,
      name: 'AI_TOOL_DENIED',
      errorCode: code,
      durationMs: deps.now() - startedAt,
    });
    return failure(toolName, requestId, code);
  }

  const context: AIToolExecutionContext = {
    ...identity,
    toolName,
    requestId,
    toolCallRequestId: input.toolCallRequestId ?? null,
    riskLevel: definition.riskLevel,
    requiredPermissions: definition.requiredPermissions,
    allowedTools,
  };

  deps.events.emit({ ...base, name: 'AI_TOOL_AUTHORIZED' });

  try {
    const data = await definition.handler(args, context, deps);
    const result: AIToolExecutionResult = {
      ok: true,
      toolName,
      requestId,
      data,
    };
    if (replayKey) deps.replayStore.set(replayKey, result);
    deps.events.emit({
      ...base,
      name: 'AI_TOOL_SUCCEEDED',
      durationMs: deps.now() - startedAt,
    });
    return result;
  } catch (error) {
    const code = toSafeErrorCode(error);
    deps.events.emit({
      ...base,
      name: 'AI_TOOL_FAILED',
      errorCode: code,
      durationMs: deps.now() - startedAt,
    });
    return failure(toolName, requestId, code);
  }
}
