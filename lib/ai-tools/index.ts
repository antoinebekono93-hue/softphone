export type {
  AIToolDeps,
  AIToolExecutionContext,
  AIToolExecutionResult,
  AIToolJSONSchema,
  AIToolPermission,
  AIToolRiskLevel,
  AuthorizedAssistant,
} from './types';
export type { AIToolErrorCode, AIToolErrorDetails } from './errors';
export { AIToolError, toSafeErrorCode, toSafeErrorDetails } from './errors';
export type { AIToolDefinition } from './tool-definition';
export {
  AI_TOOL_DEFINITIONS,
  AI_TOOL_ENABLED_RISK_LEVELS,
  buildToolDefinitionsForPermissions,
  getAIToolDefinition,
  isDefinitionEnabled,
  listEnabledToolNames,
  listRegisteredToolNames,
} from './registry';
export {
  APPOINTMENT_WRITE_TOOLS,
  LEAD_WRITE_TOOLS,
  SMS_WRITE_TOOLS,
  grantedPermissionsFor,
  permissionsSatisfied,
  READ_ONLY_PERMISSIONS,
} from './allowlist';
export { resolveAuthorizedAssistant } from './context';
export {
  executeAIToolCall,
  type ExecuteAIToolCallInput,
} from './execute';
export { createDefaultAIToolDeps, getDefaultAIToolDeps } from './deps';
export {
  buildTelnyxToolDefinitionsForEmployee,
  buildTelnyxToolDefinitionsFromPermissions,
  DEFAULT_AI_TOOL_WEBHOOK_PATH,
  type TelnyxWebhookTool,
  type BuildTelnyxToolDefinitionsOptions,
} from './telnyx-definitions';
export {
  verifyTelnyxWebhookSignature,
  deriveTelnyxAIToolReplayKey,
  TELNYX_SIGNATURE_HEADER,
  TELNYX_TIMESTAMP_HEADER,
  TELNYX_WEBHOOK_MAX_SKEW_SECONDS,
  type TelnyxSignatureRejection,
  type TelnyxSignatureVerdict,
} from './webhook/signature';
export {
  parseSignedAIToolWebhookBody,
  type SignedAIToolWebhookBody,
  type SignedBodyVerdict,
} from './webhook/parse';
export {
  createInMemoryTelnyxAIToolReplayClaimer,
  type TelnyxAIToolReplayClaim,
  type TelnyxAIToolReplayClaimer,
} from './webhook/replay-claims';
export {
  handleTelnyxAIToolWebhook,
  type TelnyxAIToolWebhookDeps,
  type TelnyxAIToolWebhookInput,
  type TelnyxAIToolWebhookResponse,
} from './webhook/handler';
export { FUTURE_AI_TOOLS, type FutureAIToolDefinition } from './future-tools';
export {
  createInMemoryReplayStore,
  AI_TOOL_REPLAY_TTL_MS,
  type AIToolReplayStore,
} from './replay';
export {
  createAIToolRateLimiter,
  type AIToolRateLimiter,
  type AIToolRateLimitDecision,
  type AIToolRateLimitInput,
} from './rate-limit';
export {
  createConsoleEventSink,
  createMemoryEventSink,
  type AIToolEvent,
  type AIToolEventName,
  type AIToolEventSink,
  type AIToolMemoryEventSink,
} from './observability';
export type {
  AIToolDataAccess,
  AIEmployeeIdentityRecord,
  ContactRecord,
  OpportunityRecord,
  ContactSearchQuery,
  OpportunitySearchQuery,
} from './data-access';
export {
  buildAppointmentIdempotencyKey,
  createAppointmentInTransaction,
  executeAppointmentCreate,
  type AppointmentCreateExecutor,
  type AppointmentRecord,
  type AppointmentTransaction,
  type AppointmentWriter,
  type BusinessHoursQuery,
  type BusinessHoursSets,
  type CreateAppointmentInput,
  type CreateAppointmentOutcome,
  type OverlapQuery,
  type RetryPolicy,
} from './appointments';
export {
  evaluateBusinessHours,
  findNextAvailableWindows,
  minutesToHm,
  parseHm,
  resolveBusinessHours,
  validateBusinessHoursConfig,
  type BusinessHoursConfigRejection,
  type BusinessHoursConfigValidation,
  type BusinessHoursEvaluation,
  type BusinessHoursReason,
  type BusinessHoursSource,
  type BusinessHoursWindowRecord,
  type NormalizedBusinessHour,
  type ResolvedBusinessHours,
} from './business-hours';
export { createAppointmentTool } from './handlers/appointments';
export {
  getZonedParts,
  isValidIanaTimeZone,
  zonedLocalToUtc,
  type ZonedDateTimeParts,
} from './time';
export { createLeadTool, updateLeadTool } from './handlers/leads';
export {
  appendNote,
  buildLeadIdempotencyKey,
  resolveLeadByPhone,
  type CreateLeadInput,
  type CreateLeadOutcome,
  type LeadIdentity,
  type LeadRecord,
  type LeadResolution,
  type LeadWriter,
  type UpdateLeadInput,
  type UpdateLeadOutcome,
} from './leads';
export { sendSmsTool } from './handlers/messages';
export {
  buildSmsIdempotencyKey,
  SMS_MAX_BODY_LENGTH,
  SmsChargeError,
  SmsProviderError,
  type PersistOutboundSmsInput,
  type ReservedSmsCharge,
  type SmsClaimOutcome,
  type SmsMessageRecord,
  type SmsProviderSendInput,
  type SmsProviderSendResult,
  type SmsRecipientRecord,
  type SmsSenderPort,
  type SmsSenderRecord,
  type SmsWriter,
} from './sms';
export type { SmsMessageDTO, SmsSendResultDTO } from './dto';
