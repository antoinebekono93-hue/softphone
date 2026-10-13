import type {
  AIToolDeps,
  AIToolExecutionContext,
  AIToolJSONSchema,
  AIToolPermission,
  AIToolRiskLevel,
} from './types';

export interface AIToolDefinition<TResult = unknown> {
  name: string;
  description: string;
  inputSchema: AIToolJSONSchema;
  riskLevel: AIToolRiskLevel;
  requiredPermissions: readonly AIToolPermission[];
  enabled: boolean;
  handler: (
    args: Record<string, unknown>,
    context: AIToolExecutionContext,
    deps: AIToolDeps
  ) => Promise<TResult>;
}
