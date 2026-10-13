import { grantedPermissionsFor, type AllowlistSubject } from './allowlist';
import { buildToolDefinitionsForPermissions } from './registry';
import type { AIToolDefinition } from './tool-definition';
import type { AIToolJSONSchema, AIToolPermission } from './types';

/**
 * Déclaration d'un outil webhook pour Telnyx (projection de notre registre).
 * Tous les outils pointent vers UNE URL unique : `DEFAULT_AI_TOOL_WEBHOOK_PATH`.
 * Le nom de l'outil et l'assistant sont portés par `preset_body_fields`
 * (littéraux statiques INVISIBLES pour le LLM) afin que le endpoint puisse
 * résoudre outil + identité depuis le body SIGNÉ.
 */
export interface TelnyxWebhookTool {
  type: 'webhook';
  webhook: {
    name: string;
    description: string;
    url: string;
    method: 'POST';
    body_parameters: AIToolJSONSchema;
    preset_body_fields?: Record<string, string>;
    preset_query_params?: Record<string, string>;
    execution_mode?: 'sync' | 'async';
  };
}

export interface BuildTelnyxToolDefinitionsOptions {
  baseUrl: string;
  /** Chemin unique du webhook tool. Ne JAMAIS dériver une route par outil. */
  webhookPath?: string;
  /** Identifiant Telnyx de l'assistant, injecté en littéral signé. */
  assistantId?: string;
  /** Mode d'exécution. Phase 3 : read-only SYNC uniquement. */
  executionMode?: 'sync' | 'async';
}

export const DEFAULT_AI_TOOL_WEBHOOK_PATH = '/api/ai/tools/telnyx';

function webhookUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

function toTelnyxTool(
  definition: AIToolDefinition,
  options: BuildTelnyxToolDefinitionsOptions
): TelnyxWebhookTool {
  const preset: Record<string, string> = {};
  if (options.assistantId) preset.assistant_id = options.assistantId;
  preset.tool = definition.name;
  return {
    type: 'webhook',
    webhook: {
      name: definition.name,
      description: definition.description,
      url: webhookUrl(options.baseUrl, options.webhookPath ?? DEFAULT_AI_TOOL_WEBHOOK_PATH),
      method: 'POST',
      body_parameters: definition.inputSchema,
      preset_body_fields: preset,
      execution_mode: options.executionMode ?? 'sync',
    },
  };
}

export function buildTelnyxToolDefinitionsFromPermissions(
  granted: readonly AIToolPermission[],
  options: BuildTelnyxToolDefinitionsOptions
): TelnyxWebhookTool[] {
  return buildToolDefinitionsForPermissions(granted).map((definition) =>
    toTelnyxTool(definition, options)
  );
}

/**
 * Builds the Telnyx tool definitions an employee's assistant is allowed to use.
 * Read-only only in Phase 3 (single endpoint + preset body fields). This is a
 * pure builder: it never calls Telnyx and never provisions anything live.
 */
export function buildTelnyxToolDefinitionsForEmployee(
  employee: AllowlistSubject,
  options: BuildTelnyxToolDefinitionsOptions
): TelnyxWebhookTool[] {
  return buildTelnyxToolDefinitionsFromPermissions(
    grantedPermissionsFor(employee),
    options
  );
}