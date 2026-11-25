import { toLeadDTO, type LeadDTO } from '../dto';
import { AIToolError } from '../errors';
import type { AIToolEventName, AIToolEventSink } from '../observability';
import type { AIToolDefinition } from '../tool-definition';
import type { AIToolExecutionContext } from '../types';
import {
  readOptionalString,
  readPhone,
  rejectUnknownKeys,
} from '../validation';
import { resolveLeadByPhone } from '../leads';

const MAX_NAME = 200;
const MAX_COMPANY = 200;
const MAX_EMAIL = 320;
const MAX_NOTES = 2000;

const CREATE_ALLOWED_KEYS = ['phone', 'name', 'company', 'email', 'notes'] as const;
const UPDATE_ALLOWED_KEYS = [
  'contact_id',
  'phone',
  'name',
  'company',
  'email',
  'notes',
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emit(
  events: AIToolEventSink,
  name: AIToolEventName,
  context: AIToolExecutionContext,
  extra: { reason?: string } = {}
): void {
  events.emit({
    name,
    toolName: context.toolName,
    assistantId: context.assistantId,
    employeeId: context.employeeId,
    organizationId: context.organizationId,
    conversationId: context.telnyxConversationId ?? undefined,
    requestId: context.requestId,
    reason: extra.reason,
  });
}

function readEmail(
  args: Record<string, unknown>,
  key: string
): string | undefined {
  const raw = args[key];
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw !== 'string') {
    throw new AIToolError('INVALID_ARGUMENTS', `Invalid argument: ${key}`);
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_EMAIL) {
    throw new AIToolError('INVALID_ARGUMENTS', `Invalid argument: ${key}`);
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    throw new AIToolError('INVALID_ARGUMENTS', `Invalid argument: ${key}`);
  }
  return trimmed;
}

/**
 * `create_lead` (Phase 4B) : crée un lead (modèle canonique `Contact`) pour le
 * tenant de l'assistant authentifié. WRITE explicite uniquement ; jamais de
 * doublon (contrainte unique organisation+phone) ; aucun identifiant tenant
 * accepté en argument.
 */
export const createLeadTool: AIToolDefinition<LeadDTO> = {
  name: 'create_lead',
  description:
    "Create a new CRM lead for the caller once they have given at least a phone number and an identifying detail. Never invent data. If the lead already exists the tool reports it instead of creating a duplicate.",
  inputSchema: {
    type: 'object',
    properties: {
      phone: {
        type: 'string',
        description: 'Lead phone number in any common format (stored canonicalised).',
      },
      name: { type: 'string', description: 'Contact name.' },
      company: { type: 'string', description: 'Company name.' },
      email: { type: 'string', description: 'Email address.' },
      notes: {
        type: 'string',
        description: 'Short factual context explicitly provided by the caller.',
      },
    },
    required: ['phone'],
    additionalProperties: false,
  },
  riskLevel: 'WRITE',
  requiredPermissions: ['leads:write'],
  enabled: true,
  async handler(args, context, deps) {
    emit(deps.events, 'AI_LEAD_CREATE_REQUESTED', context);

    if (!deps.leads) {
      emit(deps.events, 'AI_LEAD_CREATE_FAILED', context, { reason: 'NO_WRITER' });
      throw new AIToolError('TEMPORARILY_UNAVAILABLE');
    }

    rejectUnknownKeys(args, CREATE_ALLOWED_KEYS);

    const phone = readPhone(args, 'phone');
    const name = readOptionalString(args, 'name', MAX_NAME);
    const company = readOptionalString(args, 'company', MAX_COMPANY);
    const email = readEmail(args, 'email');
    const notes = readOptionalString(args, 'notes', MAX_NOTES);

    if (!name && !company && !email && !notes) {
      emit(deps.events, 'AI_LEAD_CREATE_FAILED', context, { reason: 'EMPTY_LEAD' });
      throw new AIToolError('INVALID_ARGUMENTS', 'Empty lead');
    }

    const outcome = await deps.leads.createLead({
      organizationId: context.organizationId,
      name: name ?? null,
      company: company ?? null,
      email: email ?? null,
      phone: phone.canonical,
      notes: notes ?? null,
    });

    if (outcome.status === 'DUPLICATE') {
      emit(deps.events, 'AI_LEAD_CREATE_DUPLICATE', context, {
        reason: 'PHONE_EXISTS',
      });
      throw new AIToolError('LEAD_ALREADY_EXISTS', undefined, {
        leadId: outcome.lead.id,
      });
    }
    if (outcome.status === 'UNAVAILABLE') {
      emit(deps.events, 'AI_LEAD_CREATE_FAILED', context, {
        reason: 'WRITE_CONTENTION',
      });
      throw new AIToolError('TEMPORARILY_UNAVAILABLE');
    }

    emit(deps.events, 'AI_LEAD_CREATED', context);
    return toLeadDTO(outcome.lead);
  },
};

/**
 * `update_lead` (Phase 4B) : met à jour un lead existant identifié par son id
 * (préféré) ou par téléphone, toujours scopé au tenant de l'assistant. Seuls
 * les champs explicitement fournis sont modifiés ; les notes sont AJOUTÉES.
 */
export const updateLeadTool: AIToolDefinition<LeadDTO> = {
  name: 'update_lead',
  description:
    'Update an existing CRM lead identified by its id or phone number. Only the fields explicitly provided are changed; notes are appended, never overwritten.',
  inputSchema: {
    type: 'object',
    properties: {
      contact_id: {
        type: 'string',
        description: 'Existing lead id (preferred identity).',
      },
      phone: {
        type: 'string',
        description: 'Phone used to resolve the lead when no id is given.',
      },
      name: { type: 'string', description: 'New contact name.' },
      company: { type: 'string', description: 'New company name.' },
      email: { type: 'string', description: 'New email address.' },
      notes: {
        type: 'string',
        description: 'Factual note appended to the existing notes.',
      },
    },
    required: [],
    additionalProperties: false,
  },
  riskLevel: 'WRITE',
  requiredPermissions: ['leads:write'],
  enabled: true,
  async handler(args, context, deps) {
    emit(deps.events, 'AI_LEAD_UPDATE_REQUESTED', context);

    if (!deps.leads) {
      emit(deps.events, 'AI_LEAD_UPDATE_FAILED', context, { reason: 'NO_WRITER' });
      throw new AIToolError('TEMPORARILY_UNAVAILABLE');
    }

    rejectUnknownKeys(args, UPDATE_ALLOWED_KEYS);

    const contactIdArg = readOptionalString(args, 'contact_id', 120);
    const phoneArg = args.phone;
    const hasPhone =
      phoneArg !== undefined && phoneArg !== null && phoneArg !== '';
    const name = readOptionalString(args, 'name', MAX_NAME);
    const company = readOptionalString(args, 'company', MAX_COMPANY);
    const email = readEmail(args, 'email');
    const notes = readOptionalString(args, 'notes', MAX_NOTES);

    if (!contactIdArg && !hasPhone) {
      emit(deps.events, 'AI_LEAD_UPDATE_FAILED', context, {
        reason: 'NO_IDENTITY',
      });
      throw new AIToolError('INVALID_ARGUMENTS', 'Missing lead identity');
    }

    if (
      name === undefined &&
      company === undefined &&
      email === undefined &&
      notes === undefined
    ) {
      emit(deps.events, 'AI_LEAD_UPDATE_FAILED', context, { reason: 'NO_FIELDS' });
      throw new AIToolError('INVALID_ARGUMENTS', 'No fields to update');
    }

    let leadId: string;
    if (contactIdArg) {
      const existing = await deps.leads.getLead(
        context.organizationId,
        contactIdArg
      );
      if (!existing) {
        emit(deps.events, 'AI_LEAD_UPDATE_NOT_FOUND', context, {
          reason: 'ID_NOT_FOUND',
        });
        throw new AIToolError('LEAD_NOT_FOUND');
      }
      leadId = existing.id;
    } else {
      const phone = readPhone(args, 'phone');
      const matches = await deps.leads.findContactsByPhone(
        context.organizationId,
        phone.candidates
      );
      const resolution = resolveLeadByPhone(matches);
      if (resolution.status === 'NOT_FOUND') {
        emit(deps.events, 'AI_LEAD_UPDATE_NOT_FOUND', context, {
          reason: 'PHONE_NOT_FOUND',
        });
        throw new AIToolError('LEAD_NOT_FOUND');
      }
      if (resolution.status === 'AMBIGUOUS') {
        emit(deps.events, 'AI_LEAD_UPDATE_AMBIGUOUS', context, {
          reason: 'MULTIPLE_MATCHES',
        });
        throw new AIToolError('LEAD_AMBIGUOUS', undefined, {
          matchCount: resolution.count,
        });
      }
      leadId = resolution.lead.id;
    }

    const outcome = await deps.leads.updateLead({
      organizationId: context.organizationId,
      contactId: leadId,
      ...(name !== undefined ? { name } : {}),
      ...(company !== undefined ? { company } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(notes !== undefined ? { notesAppend: notes } : {}),
    });

    if (outcome.status === 'NOT_FOUND') {
      emit(deps.events, 'AI_LEAD_UPDATE_NOT_FOUND', context, { reason: 'RACE_GONE' });
      throw new AIToolError('LEAD_NOT_FOUND');
    }
    if (outcome.status === 'UNAVAILABLE') {
      emit(deps.events, 'AI_LEAD_UPDATE_FAILED', context, {
        reason: 'WRITE_CONTENTION',
      });
      throw new AIToolError('TEMPORARILY_UNAVAILABLE');
    }

    emit(deps.events, 'AI_LEAD_UPDATED', context);
    return toLeadDTO(outcome.lead);
  },
};
