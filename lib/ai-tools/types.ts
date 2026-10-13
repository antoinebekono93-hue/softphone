import type { AIToolErrorCode } from './errors';
import type { AIToolDataAccess } from './data-access';
import type { AIToolRateLimiter } from './rate-limit';
import type { AIToolReplayStore } from './replay';
import type { AIToolEventSink } from './observability';
import type { AppointmentWriter } from './appointments';

export type AIToolRiskLevel =
  | 'READ_ONLY'
  | 'WRITE'
  | 'COMMUNICATION'
  | 'FINANCIAL'
  | 'TRANSFER';

export type AIToolPermission =
  | 'contacts:read'
  | 'crm:read'
  | 'appointments:write';

export interface AuthorizedAssistant {
  assistantId: string;
  employeeId: string;
  organizationId: string;
  callLogId: string | null;
  telnyxConversationId: string | null;
}

export interface AIToolExecutionContext extends AuthorizedAssistant {
  toolName: string;
  requestId: string;
  /**
   * Stable Telnyx tool-call request id (body `request_id`) when provided.
   * Distinct from `requestId`, which is always a transport correlation id.
   */
  toolCallRequestId?: string | null;
  riskLevel: AIToolRiskLevel;
  requiredPermissions: readonly AIToolPermission[];
  allowedTools: readonly string[];
}

export interface AIToolJSONSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface AIToolExecutionSuccess<T = unknown> {
  ok: true;
  toolName: string;
  requestId: string;
  data: T;
}

export interface AIToolExecutionFailure {
  ok: false;
  toolName: string;
  requestId: string;
  error: { code: AIToolErrorCode };
}

export type AIToolExecutionResult<T = unknown> =
  | AIToolExecutionSuccess<T>
  | AIToolExecutionFailure;

export interface AIToolDeps {
  db: AIToolDataAccess;
  rateLimiter: AIToolRateLimiter;
  /**
   * Stricter limiter used only by non-read-only tools. Optional so that the
   * read-only test fixtures from earlier phases keep compiling; at runtime it
   * is always provided (see deps.ts). Falls back to `rateLimiter` when absent.
   */
  writeRateLimiter?: AIToolRateLimiter;
  replayStore: AIToolReplayStore;
  events: AIToolEventSink;
  now: () => number;
  generateRequestId: () => string;
  /**
   * Write port for appointment persistence. Only provided in production; when
   * absent a write tool fails closed with TEMPORARILY_UNAVAILABLE.
   */
  appointments?: AppointmentWriter;
}
