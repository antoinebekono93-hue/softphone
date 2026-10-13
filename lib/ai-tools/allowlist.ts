import type { AIToolPermission } from './types';

/**
 * Read-only permissions are granted to every active Telnyx assistant. Write
 * permissions are never implicit: they require a per-employee grant recorded in
 * `AIEmployee.allowedWriteTools`. The two families are deliberately not
 * collapsed, so a read-only assistant can never run a write tool even if a
 * future definition is registered.
 */
export const READ_ONLY_PERMISSIONS: readonly AIToolPermission[] = [
  'contacts:read',
  'crm:read',
];

/** Exact write-tool names that map to the `appointments:write` permission. */
export const APPOINTMENT_WRITE_TOOLS: readonly string[] = ['create_appointment'];

export interface AllowlistSubject {
  voiceProvider: string | null;
  isActive: boolean;
  /** Explicit per-employee write-tool grants. Empty/absent means none. */
  allowedWriteTools?: readonly string[];
}

export function grantedPermissionsFor(
  subject: AllowlistSubject
): readonly AIToolPermission[] {
  if (!subject.isActive) return [];
  if ((subject.voiceProvider ?? 'LEGACY').toUpperCase() !== 'TELNYX') return [];
  const granted: AIToolPermission[] = [...READ_ONLY_PERMISSIONS];
  const writeTools = subject.allowedWriteTools ?? [];
  if (writeTools.some((tool) => APPOINTMENT_WRITE_TOOLS.includes(tool))) {
    granted.push('appointments:write');
  }
  return granted;
}

export function permissionsSatisfied(
  required: readonly AIToolPermission[],
  granted: readonly AIToolPermission[]
): boolean {
  return required.every((permission) => granted.includes(permission));
}
