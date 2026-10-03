/**
 * Ownership rules for `PhoneNumber`.
 *
 * INVARIANT A — a number belongs to an organization/user independently of the
 *   current plan. Changing a plan must never delete, unassign or hide it.
 * INVARIANT B — `PricingPlan` gates capabilities, never ownership.
 * INVARIANT C — the only authority on ownership is the row's real DB relation.
 * INVARIANT E — a provider webhook (which may be late) must never silently
 *   cancel a newer explicit manual assignment made in God Mode.
 *
 * Every rule below is pure so it can be unit tested without a database.
 */

/** Ownership of an existing row, as persisted. */
export type NumberOwnership = {
  organizationId: string | null;
  assignedUserId: string | null;
};

/** Ownership claimed by a `NumberOrder` row. */
export type OrderOwnershipClaim = {
  organizationId: string;
  requestedUserId: string | null;
};

/** Keep ownership explicit; never carry a user across tenant boundaries. */
export function resolveNumberAssignee(
  memberIds: string[],
  currentUserId: string | null,
  requestedUserId: unknown,
): string | null {
  if (requestedUserId === null) return null;
  if (requestedUserId !== undefined) {
    if (typeof requestedUserId !== "string" || !memberIds.includes(requestedUserId)) {
      throw new Error("L’utilisateur doit appartenir à l’organisation sélectionnée.");
    }
    return requestedUserId;
  }
  if (currentUserId && memberIds.includes(currentUserId)) return currentUserId;
  return memberIds.length === 1 ? memberIds[0] : null;
}

/**
 * INVARIANT E — ownership claimed by a provider order.
 *
 * A number row can be created by the order (first insertion) or by an admin
 * sync / God Mode action. Once it exists, its ownership is authoritative: a
 * late or duplicated activation webhook for an order placed at T0 must not
 * restore the T0 requester over a manual assignment performed at T1, and must
 * not move the number to another tenant.
 *
 * Returns the ownership to persist: the order's claim for a brand new row, the
 * row's own ownership otherwise.
 */
export function resolveActivationOwnership(
  existing: NumberOwnership | null | undefined,
  order: OrderOwnershipClaim,
): NumberOwnership {
  if (existing) return { organizationId: existing.organizationId, assignedUserId: existing.assignedUserId };
  return { organizationId: order.organizationId, assignedUserId: order.requestedUserId };
}

/**
 * INVARIANT B — a plan controls rights, never ownership.
 *
 * Returns the ownership that survives a plan change: strictly unchanged, for
 * every transition including to and from a plan-less organization.
 */
export function resolveOwnershipAfterPlanChange(
  ownership: NumberOwnership | null | undefined,
): NumberOwnership | null {
  if (!ownership) return null;
  return { organizationId: ownership.organizationId, assignedUserId: ownership.assignedUserId };
}

/**
 * INVARIANT C / tenant isolation — a number is visible to a tenant only when
 * the row really belongs to that tenant. `assignedUserId` alone is never a
 * substitute for `organizationId`, and a user from another tenant never
 * matches.
 */
export function isNumberVisibleToAccount(
  number: NumberOwnership & { status?: string | null },
  account: { userId: string; organizationId: string | null },
  options: { requireActive?: boolean; ownOnly?: boolean } = {},
): boolean {
  if (!account.organizationId) return false;
  if (number.organizationId !== account.organizationId) return false;
  if (options.requireActive && number.status !== "ACTIVE") return false;
  if (options.ownOnly && number.assignedUserId !== account.userId) return false;
  return true;
}

/**
 * Legacy attribution cases (§19). Diagnostic only — the caller must never
 * infer a missing owner.
 *
 *  A — organizationId + assignedUserId present.
 *  B — organizationId present, assignedUserId null (shared / not attributed).
 *  C — assignedUserId present but organizationId missing (impossible in the
 *      current schema: the column is NOT NULL) → reported as inconsistent.
 *  D — assignedUserId belongs to a different organization than the row.
 */
export type LegacyAssignmentCase = "A" | "B" | "C" | "D" | "MISSING";

export function classifyNumberAssignment(
  number: NumberOwnership & { id?: string },
  assigneeOrganizationId: string | null | undefined,
): LegacyAssignmentCase {
  if (!number.organizationId && !number.assignedUserId) return "C";
  if (!number.organizationId) return "C";
  if (!number.assignedUserId) return "B";
  if (assigneeOrganizationId === null || assigneeOrganizationId === undefined) return "D";
  if (assigneeOrganizationId !== number.organizationId) return "D";
  return "A";
}