import type { AIToolJSONSchema, AIToolPermission, AIToolRiskLevel } from './types';

/**
 * Interfaces for tools that must NOT run in Phase 2. They are declared so the
 * registry and allowlist can be exercised against them, but they are never
 * registered, never allowlisted and have no working handler. Wiring any of
 * these requires a later, separately reviewed phase.
 */
export interface FutureAIToolDefinition {
  name: string;
  description: string;
  inputSchema: AIToolJSONSchema;
  riskLevel: AIToolRiskLevel;
  requiredPermissions: readonly AIToolPermission[];
  enabled: false;
  reason: string;
}

export const FUTURE_AI_TOOLS: readonly FutureAIToolDefinition[] = [
  {
    name: 'create_contact',
    description: 'Create a contact.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    riskLevel: 'WRITE',
    requiredPermissions: ['contacts:read'],
    enabled: false,
    reason: 'Phase 2 is read-only.',
  },
  {
    name: 'update_contact',
    description: 'Update a contact.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    riskLevel: 'WRITE',
    requiredPermissions: ['contacts:read'],
    enabled: false,
    reason: 'Phase 2 is read-only.',
  },
  {
    name: 'create_lead',
    description: 'Create a lead.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    riskLevel: 'WRITE',
    requiredPermissions: ['crm:read'],
    enabled: false,
    reason: 'No Lead model exists yet.',
  },
  {
    name: 'get_business_hours',
    description: 'Read business hours.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    riskLevel: 'READ_ONLY',
    requiredPermissions: ['crm:read'],
    enabled: false,
    reason: 'No BusinessHours model exists yet.',
  },
  {
    name: 'get_agent_availability',
    description: 'Read agent availability.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    riskLevel: 'READ_ONLY',
    requiredPermissions: ['crm:read'],
    enabled: false,
    reason: 'No availability model exists yet.',
  },
  {
    name: 'send_sms',
    description: 'Send an SMS.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    riskLevel: 'COMMUNICATION',
    requiredPermissions: ['contacts:read'],
    enabled: false,
    reason: 'Phase 2 is read-only.',
  },
  {
    name: 'send_whatsapp',
    description: 'Send a WhatsApp message.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    riskLevel: 'COMMUNICATION',
    requiredPermissions: ['contacts:read'],
    enabled: false,
    reason: 'Phase 2 is read-only.',
  },
  {
    name: 'transfer_to_human',
    description: 'Transfer the call to a human agent.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    riskLevel: 'TRANSFER',
    requiredPermissions: ['crm:read'],
    enabled: false,
    reason: 'Phase 2 is read-only.',
  },
];
