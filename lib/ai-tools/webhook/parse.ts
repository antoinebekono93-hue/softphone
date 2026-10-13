/**
 * Contrat strict du body signé du webhook tool.
 *
 * Telnyx envoie un objet d'arguments PLAT (body_parameters du schéma), sans
 * identifiant d'assistant ni nom d'outil. Pour satisfaire l'isolation
 * d'identité, la configuration de l'outil injecte via `preset_body_fields` des
 * littéraux statiques signés : `assistant_id` (telnyxAssistantId de
 * l'employé) et `tool` (nom exact de la définition). Tous deux sont donc
 * vérifiés par la signature Ed25519 et ne peuvent pas être falsifiés par le
 * LLM. Ce parseur n'accepte QUE cette forme ; tout champ étranger (dont
 * `organizationId`) est rejeté.
 */

export interface SignedAIToolWebhookBody {
  assistantId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  conversationId: string | null;
  callControlId: string | null;
  requestId: string | null;
}

export type SignedBodyVerdict =
  | { ok: true; value: SignedAIToolWebhookBody }
  | { ok: false; error: 'INVALID_REQUEST' | 'INVALID_ARGUMENTS' };

const MAX_ID_LENGTH = 120;
const MAX_ARGUMENT_COUNT = 32;

const ALLOWED_KEYS = new Set([
  'assistant_id',
  'tool',
  'arguments',
  'conversation_id',
  'call_control_id',
  'request_id',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRequiredId(
  value: unknown
): { ok: true; value: string } | { ok: false } {
  if (typeof value !== 'string') return { ok: false };
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_ID_LENGTH) return { ok: false };
  return { ok: true, value: trimmed };
}

function readOptionalId(
  value: unknown
): { ok: true; value: string | null } | { ok: false } {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false };
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_ID_LENGTH) return { ok: false };
  return { ok: true, value: trimmed };
}

/**
 * Parse strictement le body déjà vérifié. Ne fait JAMAIS
 * `const data: any = await request.json(); execute(data)` : chaque champ a un
 * type, une taille et une liste blanche de clés. La payload JSON est analysée
 * ici (après vérification sur les bytes bruts).
 */
export function parseSignedAIToolWebhookBody(
  rawBody: string
): SignedBodyVerdict {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { ok: false, error: 'INVALID_REQUEST' };
  }

  if (!isPlainObject(parsed)) return { ok: false, error: 'INVALID_REQUEST' };

  for (const key of Object.keys(parsed)) {
    if (!ALLOWED_KEYS.has(key)) return { ok: false, error: 'INVALID_REQUEST' };
  }

  const assistant = readRequiredId(parsed.assistant_id);
  if (!assistant.ok) return { ok: false, error: 'INVALID_REQUEST' };

  const tool = readRequiredId(parsed.tool);
  if (!tool.ok) return { ok: false, error: 'INVALID_REQUEST' };

  const rawArgs: unknown = parsed.arguments;
  if (!isPlainObject(rawArgs)) return { ok: false, error: 'INVALID_ARGUMENTS' };
  if (Object.keys(rawArgs).length > MAX_ARGUMENT_COUNT) {
    return { ok: false, error: 'INVALID_ARGUMENTS' };
  }

  const conversation = readOptionalId(parsed.conversation_id);
  if (!conversation.ok) return { ok: false, error: 'INVALID_REQUEST' };
  const callControl = readOptionalId(parsed.call_control_id);
  if (!callControl.ok) return { ok: false, error: 'INVALID_REQUEST' };
  const request = readOptionalId(parsed.request_id);
  if (!request.ok) return { ok: false, error: 'INVALID_REQUEST' };

  return {
    ok: true,
    value: {
      assistantId: assistant.value,
      toolName: tool.value,
      arguments: rawArgs,
      conversationId: conversation.value,
      callControlId: callControl.value,
      requestId: request.value,
    },
  };
}