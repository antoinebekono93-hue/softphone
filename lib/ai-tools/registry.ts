import {
  getContactTool,
  getCustomerByPhoneTool,
  searchContactsTool,
} from './handlers/contacts';
import {
  getOpportunityTool,
  searchCrmTool,
} from './handlers/opportunities';
import { createAppointmentTool } from './handlers/appointments';
import { permissionsSatisfied } from './allowlist';
import type { AIToolDefinition } from './tool-definition';
import type { AIToolPermission, AIToolRiskLevel } from './types';

/**
 * Risk levels that may run at all. WRITE tools are registered here but are
 * NEVER available implicitly: `buildToolDefinitionsForPermissions` still
 * requires the explicit permission (e.g. `appointments:write`), which only an
 * `AIEmployee.allowedWriteTools` grant produces. COMMUNICATION / FINANCIAL /
 * TRANSFER stay disabled until a later phase.
 */
export const AI_TOOL_ENABLED_RISK_LEVELS: readonly AIToolRiskLevel[] = [
  'READ_ONLY',
  'WRITE',
];

export const AI_TOOL_DEFINITIONS: readonly AIToolDefinition[] = [
  getCustomerByPhoneTool,
  searchContactsTool,
  getContactTool,
  searchCrmTool,
  getOpportunityTool,
  createAppointmentTool,
];

const definitionsByName = new Map<string, AIToolDefinition>(
  AI_TOOL_DEFINITIONS.map((definition) => [definition.name, definition])
);

export function getAIToolDefinition(
  name: string
): AIToolDefinition | undefined {
  return definitionsByName.get(name);
}

export function listRegisteredToolNames(): string[] {
  return AI_TOOL_DEFINITIONS.map((definition) => definition.name);
}

export function isDefinitionEnabled(definition: AIToolDefinition): boolean {
  return (
    definition.enabled &&
    AI_TOOL_ENABLED_RISK_LEVELS.includes(definition.riskLevel)
  );
}

export function buildToolDefinitionsForPermissions(
  granted: readonly AIToolPermission[]
): AIToolDefinition[] {
  return AI_TOOL_DEFINITIONS.filter(
    (definition) =>
      isDefinitionEnabled(definition) &&
      permissionsSatisfied(definition.requiredPermissions, granted)
  );
}

export function listEnabledToolNames(): string[] {
  return AI_TOOL_DEFINITIONS.filter(isDefinitionEnabled).map(
    (definition) => definition.name
  );
}
