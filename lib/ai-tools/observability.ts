import type { AIToolErrorCode } from './errors';

export type AIToolEventName =
  | 'AI_TOOL_REQUESTED'
  | 'AI_TOOL_AUTHORIZED'
  | 'AI_TOOL_DENIED'
  | 'AI_TOOL_SUCCEEDED'
  | 'AI_TOOL_FAILED'
  | 'AI_TOOL_WEBHOOK_RECEIVED'
  | 'AI_TOOL_WEBHOOK_SIGNATURE_VALID'
  | 'AI_TOOL_WEBHOOK_SIGNATURE_INVALID'
  | 'AI_TOOL_WEBHOOK_REPLAY_REJECTED'
  | 'AI_TOOL_WEBHOOK_AUTHORIZED'
  | 'AI_APPOINTMENT_REQUESTED'
  | 'AI_APPOINTMENT_AUTHORIZED'
  | 'AI_APPOINTMENT_BUSINESS_HOURS_CHECK'
  | 'AI_APPOINTMENT_OUTSIDE_HOURS'
  | 'AI_APPOINTMENT_CREATED'
  | 'AI_APPOINTMENT_CONFLICT'
  | 'AI_APPOINTMENT_FAILED'
  | 'AI_LEAD_CREATE_REQUESTED'
  | 'AI_LEAD_CREATED'
  | 'AI_LEAD_CREATE_DUPLICATE'
  | 'AI_LEAD_CREATE_FAILED'
  | 'AI_LEAD_UPDATE_REQUESTED'
  | 'AI_LEAD_UPDATED'
  | 'AI_LEAD_UPDATE_NOT_FOUND'
  | 'AI_LEAD_UPDATE_AMBIGUOUS'
  | 'AI_LEAD_UPDATE_FAILED'
  | 'AI_SMS_SEND_REQUESTED'
  | 'AI_SMS_SEND_AUTHORIZED'
  | 'AI_SMS_SEND_BLOCKED_OPT_OUT'
  | 'AI_SMS_SEND_STARTED'
  | 'AI_SMS_SEND_ACCEPTED'
  | 'AI_SMS_SEND_FAILED'
  | 'AI_SMS_SEND_REPLAY';

/**
 * Observability payload. It intentionally carries identifiers only: no contact
 * records, prompts, message content, PII or audio ever reach the event sink.
 */
export interface AIToolEvent {
  name: AIToolEventName;
  toolName: string;
  assistantId: string;
  employeeId?: string;
  organizationId?: string;
  conversationId?: string;
  requestId: string;
  durationMs?: number;
  errorCode?: AIToolErrorCode;
  /** Coarse rejection reason (e.g. signature skew); never raw payload/secrets. */
  reason?: string;
}

export interface AIToolEventSink {
  emit(event: AIToolEvent): void;
}

export function createConsoleEventSink(): AIToolEventSink {
  return {
    emit(event: AIToolEvent): void {
      console.info(`[ai-tool] ${JSON.stringify(event)}`);
    },
  };
}

export interface AIToolMemoryEventSink extends AIToolEventSink {
  events: AIToolEvent[];
}

export function createMemoryEventSink(): AIToolMemoryEventSink {
  const events: AIToolEvent[] = [];
  return {
    events,
    emit(event: AIToolEvent): void {
      events.push(event);
    },
  };
}
