import { AIToolError } from '../errors';
import { toContactDTO, type ContactDTO } from '../dto';
import type { AIToolDefinition } from '../tool-definition';
import {
  readLimit,
  readPhone,
  readRequiredString,
  readSearchQuery,
  rejectUnknownKeys,
} from '../validation';

export interface ContactSearchResult {
  count: number;
  contacts: ContactDTO[];
}

export const getCustomerByPhoneTool: AIToolDefinition<ContactDTO> = {
  name: 'get_customer_by_phone',
  description:
    'Look up a single customer record by phone number. Returns limited profile fields only.',
  inputSchema: {
    type: 'object',
    properties: {
      phone: {
        type: 'string',
        description: 'Customer phone number in any common format.',
      },
    },
    required: ['phone'],
    additionalProperties: false,
  },
  riskLevel: 'READ_ONLY',
  requiredPermissions: ['contacts:read'],
  enabled: true,
  async handler(args, context, deps) {
    rejectUnknownKeys(args, ['phone']);
    const phone = readPhone(args, 'phone');
    const record = await deps.db.findContactByPhone(
      context.organizationId,
      phone.candidates
    );
    if (!record) throw new AIToolError('NOT_FOUND');
    return toContactDTO(record);
  },
};

export const searchContactsTool: AIToolDefinition<ContactSearchResult> = {
  name: 'search_contacts',
  description:
    'Search the current organization contacts by name, company or email. Returns a short list.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Name, company or email fragment.' },
      limit: { type: 'integer', minimum: 1, maximum: 10 },
    },
    required: ['query'],
    additionalProperties: false,
  },
  riskLevel: 'READ_ONLY',
  requiredPermissions: ['contacts:read'],
  enabled: true,
  async handler(args, context, deps) {
    rejectUnknownKeys(args, ['query', 'limit']);
    const query = readSearchQuery(args, 'query');
    const limit = readLimit(args, 'limit');
    const records = await deps.db.searchContacts(context.organizationId, {
      query,
      limit,
    });
    return { count: records.length, contacts: records.map(toContactDTO) };
  },
};

export const getContactTool: AIToolDefinition<ContactDTO> = {
  name: 'get_contact',
  description: 'Fetch a single contact by its id, scoped to the current organization.',
  inputSchema: {
    type: 'object',
    properties: {
      contact_id: { type: 'string', description: 'Contact identifier.' },
    },
    required: ['contact_id'],
    additionalProperties: false,
  },
  riskLevel: 'READ_ONLY',
  requiredPermissions: ['contacts:read'],
  enabled: true,
  async handler(args, context, deps) {
    rejectUnknownKeys(args, ['contact_id']);
    const contactId = readRequiredString(args, 'contact_id');
    const record = await deps.db.getContact(context.organizationId, contactId);
    if (!record) throw new AIToolError('NOT_FOUND');
    return toContactDTO(record);
  },
};
