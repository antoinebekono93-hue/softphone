import { AIToolError } from './errors';
import { grantedPermissionsFor } from './allowlist';
import type { AIToolDataAccess } from './data-access';
import type { AIToolPermission, AuthorizedAssistant } from './types';

export interface ResolveAssistantInput {
  assistantId: string;
  callLogId?: string | null;
  telnyxConversationId?: string | null;
  /**
   * Optional tenant hint (e.g. from a signed webhook or the org the call was
   * placed under). If present, a mismatch is rejected. It is never trusted as
   * the source of the tenant identity: that always comes from the DB row.
   */
  expectedOrganizationId?: string | null;
}

export interface ResolvedAssistant {
  identity: AuthorizedAssistant;
  grantedPermissions: readonly AIToolPermission[];
}

/**
 * Server-side identity guard. Telnyx is never authoritative: the assistant id
 * is resolved to a real AIEmployee row, and the tenant, provider and active
 * status all come from that row. On any failure the function throws an
 * AIToolError and returns nothing.
 */
export async function resolveAuthorizedAssistant(
  input: ResolveAssistantInput,
  db: AIToolDataAccess
): Promise<ResolvedAssistant> {
  const assistantId = typeof input.assistantId === 'string' ? input.assistantId.trim() : '';
  if (!assistantId) throw new AIToolError('NOT_ALLOWED');

  const employee = await db.findEmployeeByAssistantId(assistantId);
  if (!employee) throw new AIToolError('NOT_FOUND');

  if ((employee.voiceProvider ?? 'LEGACY').toUpperCase() !== 'TELNYX') {
    throw new AIToolError('NOT_ALLOWED');
  }
  if (!employee.isActive) throw new AIToolError('NOT_ALLOWED');

  if (
    input.expectedOrganizationId &&
    input.expectedOrganizationId !== employee.organizationId
  ) {
    throw new AIToolError('NOT_ALLOWED');
  }

  const grantedPermissions = grantedPermissionsFor(employee);
  if (grantedPermissions.length === 0) throw new AIToolError('NOT_ALLOWED');

  return {
    identity: {
      assistantId,
      employeeId: employee.id,
      organizationId: employee.organizationId,
      callLogId: input.callLogId ?? null,
      telnyxConversationId: input.telnyxConversationId ?? null,
    },
    grantedPermissions,
  };
}
