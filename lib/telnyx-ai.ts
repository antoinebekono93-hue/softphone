import Telnyx from 'telnyx';
import { prisma } from '@/lib/prisma';
import { getConfiguredTelnyxClient } from '@/lib/telnyx';

type TelnyxClient = InstanceType<typeof Telnyx>;
type AssistantResource = TelnyxClient['ai']['assistants'];
type Actions = TelnyxClient['calls']['actions'];

export type AssistantCreateParams = Parameters<AssistantResource['create']>[0];
export type AssistantUpdateParams = Parameters<AssistantResource['update']>[1];
export type Assistant = Awaited<ReturnType<AssistantResource['create']>>;
export type StartAIAssistantParams = Parameters<Actions['startAIAssistant']>[1];
export type StopAIAssistantParams = Parameters<Actions['stopAIAssistant']>[1];

export type AiVoiceProvider = 'LEGACY' | 'TELNYX';

export const AI_VOICE_PROVIDER = {
  LEGACY: 'LEGACY',
  TELNYX: 'TELNYX',
} as const satisfies Record<AiVoiceProvider, AiVoiceProvider>;

export function isTelnyxVoiceEnabled(employee: { voiceProvider?: string | null }): boolean {
  return (employee.voiceProvider ?? AI_VOICE_PROVIDER.LEGACY).toUpperCase() === AI_VOICE_PROVIDER.TELNYX;
}

function assertServerOnly() {
  if (typeof window !== 'undefined') {
    throw new Error('[telnyx-ai] This module is server-only and must never run in the browser.');
  }
}

async function getClient(): Promise<TelnyxClient> {
  assertServerOnly();
  return (await getConfiguredTelnyxClient()) as TelnyxClient;
}

export interface EmployeeAssistantSource {
  name: string;
  systemPrompt: string;
  greeting?: string | null;
  voiceId?: string | null;
  language?: string | null;
}

export interface AssistantBuildOptions {
  model?: string;
  voice?: string;
  voiceApiKeyRef?: string;
  toolIds?: string[];
  dynamicVariables?: Record<string, unknown>;
  dynamicVariablesWebhookUrl?: string;
  noiseSuppression?: 'krisp' | 'deepfilternet' | 'disabled';
  description?: string;
}

const NATIVE_VOICE_PREFIXES = [
  'Telnyx.',
  'ElevenLabs.',
  'AWS.',
  'Azure.',
  'Inworld.',
  'xAI.',
  'Soniox.',
];

function normalizeVoice(voiceId: string | null | undefined, override?: string): string | undefined {
  if (override) return override;
  if (!voiceId) return undefined;
  return NATIVE_VOICE_PREFIXES.some((prefix) => voiceId.startsWith(prefix)) ? voiceId : undefined;
}

export function buildAssistantParamsFromEmployee(
  employee: EmployeeAssistantSource,
  options: AssistantBuildOptions = {},
): AssistantCreateParams {
  const params: AssistantCreateParams = {
    name: employee.name,
    instructions: employee.systemPrompt,
  };

  if (employee.greeting) params.greeting = employee.greeting;
  if (options.description) params.description = options.description;
  if (options.model) params.model = options.model;

  const voice = normalizeVoice(employee.voiceId, options.voice);
  if (voice) {
    params.voice_settings = options.voiceApiKeyRef
      ? { voice, api_key_ref: options.voiceApiKeyRef }
      : { voice };
  }

  if (employee.language) {
    params.transcription = { language: employee.language };
  }

  if (options.toolIds && options.toolIds.length > 0) {
    params.tool_ids = options.toolIds;
  }

  if (options.dynamicVariables) {
    params.dynamic_variables = options.dynamicVariables;
  }
  if (options.dynamicVariablesWebhookUrl) {
    params.dynamic_variables_webhook_url = options.dynamicVariablesWebhookUrl;
  }

  if (options.noiseSuppression) {
    params.telephony_settings = { noise_suppression: options.noiseSuppression };
  }

  return params;
}

export async function createAssistant(params: AssistantCreateParams): Promise<Assistant> {
  const client = await getClient();
  return client.ai.assistants.create(params);
}

export async function retrieveAssistant(assistantId: string): Promise<Assistant> {
  const client = await getClient();
  return client.ai.assistants.retrieve(assistantId);
}

export async function updateAssistant(
  assistantId: string,
  params: AssistantUpdateParams,
): Promise<Assistant> {
  const client = await getClient();
  return client.ai.assistants.update(assistantId, params);
}

export async function deleteAssistant(assistantId: string): Promise<void> {
  const client = await getClient();
  await client.ai.assistants.delete(assistantId);
}

export async function listAssistants() {
  const client = await getClient();
  return client.ai.assistants.list();
}

async function loadEmployeeForOrg(organizationId: string, employeeId: string) {
  const employee = await prisma.aIEmployee.findFirst({
    where: { id: employeeId, organizationId },
  });
  if (!employee) {
    throw new Error('[telnyx-ai] AI employee not found for organization');
  }
  return employee;
}

export interface ProvisionAssistantForEmployeeInput {
  organizationId: string;
  employeeId: string;
  options?: AssistantBuildOptions;
}

export async function provisionAssistantForEmployee({
  organizationId,
  employeeId,
  options,
}: ProvisionAssistantForEmployeeInput): Promise<string> {
  const employee = await loadEmployeeForOrg(organizationId, employeeId);

  if (employee.telnyxAssistantId) {
    return employee.telnyxAssistantId;
  }

  const params = buildAssistantParamsFromEmployee(employee, options);
  const assistant = await createAssistant(params);

  await prisma.aIEmployee.update({
    where: { id: employee.id },
    data: { telnyxAssistantId: assistant.id },
  });

  return assistant.id;
}

export interface SyncAssistantForEmployeeInput {
  organizationId: string;
  employeeId: string;
  options?: AssistantBuildOptions;
}

export async function syncAssistantForEmployee({
  organizationId,
  employeeId,
  options,
}: SyncAssistantForEmployeeInput): Promise<Assistant> {
  const employee = await loadEmployeeForOrg(organizationId, employeeId);

  const params = buildAssistantParamsFromEmployee(employee, options);

  if (!employee.telnyxAssistantId) {
    const created = await createAssistant(params);
    await prisma.aIEmployee.update({
      where: { id: employee.id },
      data: { telnyxAssistantId: created.id },
    });
    return created;
  }

  return updateAssistant(employee.telnyxAssistantId, params);
}

export async function removeAssistantForEmployee({
  organizationId,
  employeeId,
}: {
  organizationId: string;
  employeeId: string;
}): Promise<void> {
  const employee = await loadEmployeeForOrg(organizationId, employeeId);
  if (!employee.telnyxAssistantId) return;

  await deleteAssistant(employee.telnyxAssistantId);
  await prisma.aIEmployee.update({
    where: { id: employee.id },
    data: { telnyxAssistantId: null },
  });
}

export async function getAssistantForEmployee({
  organizationId,
  employeeId,
}: {
  organizationId: string;
  employeeId: string;
}): Promise<Assistant | null> {
  const employee = await loadEmployeeForOrg(organizationId, employeeId);
  if (!employee.telnyxAssistantId) return null;
  return retrieveAssistant(employee.telnyxAssistantId);
}

export interface StartAssistantOnCallInput {
  callControlId: string;
  assistantId: string;
  dynamicVariables?: Record<string, string | number | boolean>;
  greeting?: string;
  instructions?: string;
  sendMessageHistoryUpdates?: boolean;
  clientState?: string;
  commandId?: string;
}

export async function startAssistantOnCall({
  callControlId,
  assistantId,
  dynamicVariables,
  greeting,
  instructions,
  sendMessageHistoryUpdates = true,
  clientState,
  commandId,
}: StartAssistantOnCallInput) {
  const client = await getClient();

  const assistant: NonNullable<StartAIAssistantParams['assistant']> = { id: assistantId };
  if (dynamicVariables) assistant.dynamic_variables = dynamicVariables;
  if (greeting) assistant.greeting = greeting;
  if (instructions) assistant.instructions = instructions;

  const params: StartAIAssistantParams = {
    assistant,
    send_message_history_updates: sendMessageHistoryUpdates,
  };
  if (clientState) params.client_state = clientState;
  if (commandId) params.command_id = commandId;

  return client.calls.actions.startAIAssistant(callControlId, params);
}

export async function stopAssistantOnCall({
  callControlId,
  commandId,
}: {
  callControlId: string;
  commandId?: string;
}) {
  const client = await getClient();
  const params: StopAIAssistantParams = {};
  if (commandId) params.command_id = commandId;
  return client.calls.actions.stopAIAssistant(callControlId, params);
}
