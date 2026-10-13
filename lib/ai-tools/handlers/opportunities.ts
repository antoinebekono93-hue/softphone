import { AIToolError } from '../errors';
import { toOpportunityDTO, type OpportunityDTO } from '../dto';
import type { AIToolDefinition } from '../tool-definition';
import {
  readLimit,
  readOptionalString,
  readRequiredString,
  readSearchQuery,
  rejectUnknownKeys,
} from '../validation';

export interface CrmSearchResult {
  count: number;
  opportunities: OpportunityDTO[];
}

export const searchCrmTool: AIToolDefinition<CrmSearchResult> = {
  name: 'search_crm',
  description:
    'Search the current organization sales pipeline (opportunities) by name, optionally filtered by stage.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Opportunity name fragment.' },
      stage: { type: 'string', description: 'Optional pipeline stage.' },
      limit: { type: 'integer', minimum: 1, maximum: 10 },
    },
    required: ['query'],
    additionalProperties: false,
  },
  riskLevel: 'READ_ONLY',
  requiredPermissions: ['crm:read'],
  enabled: true,
  async handler(args, context, deps) {
    rejectUnknownKeys(args, ['query', 'stage', 'limit']);
    const query = readSearchQuery(args, 'query');
    const stage = readOptionalString(args, 'stage', 40);
    const limit = readLimit(args, 'limit');
    const records = await deps.db.searchOpportunities(context.organizationId, {
      query,
      limit,
      ...(stage ? { stage } : {}),
    });
    return {
      count: records.length,
      opportunities: records.map(toOpportunityDTO),
    };
  },
};

export const getOpportunityTool: AIToolDefinition<OpportunityDTO> = {
  name: 'get_opportunity',
  description: 'Fetch a single opportunity by its id, scoped to the current organization.',
  inputSchema: {
    type: 'object',
    properties: {
      opportunity_id: { type: 'string', description: 'Opportunity identifier.' },
    },
    required: ['opportunity_id'],
    additionalProperties: false,
  },
  riskLevel: 'READ_ONLY',
  requiredPermissions: ['crm:read'],
  enabled: true,
  async handler(args, context, deps) {
    rejectUnknownKeys(args, ['opportunity_id']);
    const opportunityId = readRequiredString(args, 'opportunity_id');
    const record = await deps.db.getOpportunity(
      context.organizationId,
      opportunityId
    );
    if (!record) throw new AIToolError('NOT_FOUND');
    return toOpportunityDTO(record);
  },
};
