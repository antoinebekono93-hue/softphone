import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { accountSessionSelect } from "@/lib/account-session";

/**
 * Single source of truth for "what is the CURRENT account context of this user?".
 *
 * Split of concerns:
 *  - `lib/account-session.ts` stays isomorphic and pure (claim shape, select,
 *    billing redirect policy) so the edge proxy can import it without pulling
 *    Prisma in.
 *  - this module owns the DB read and is server-only by usage.
 *
 * It is deliberately narrow (INVARIANT D): it never returns the whole user
 * record, and it never returns phone numbers. Sensitive operations must still
 * confirm the specific resource they touch — see `getOwnedPhoneNumbers`.
 */
export type CurrentAccountContext = {
  userId: string;
  organizationId: string | null;
  organizationName: string | null;
  plan: string | null;
  planStatus: string | null;
  role: string;
  isSuperAdmin: boolean;
};

/**
 * Read once per request (React `cache`) and always from the database, so a plan
 * upgrade, a downgrade or an organization change is visible on the very next
 * request instead of the next login.
 */
export const getCurrentAccountContext = cache(async (userId: string): Promise<CurrentAccountContext | null> => {
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: accountSessionSelect,
  });
  if (!account) return null;
  return {
    userId,
    organizationId: account.organizationId,
    organizationName: account.organization?.name ?? null,
    plan: account.organization?.pricingPlan?.name ?? null,
    planStatus: account.organization?.planStatus ?? null,
    role: account.role,
    isSuperAdmin: account.isSuperAdmin,
  };
});

/**
 * INVARIANT C — the caller-ID list of an account.
 *
 * Authority is the DB relation (`organizationId` AND `assignedUserId`), never a
 * client-side cache or a JWT claim. A stale browser holding a number it no
 * longer owns simply gets nothing back, and the call-routing backend refuses it
 * independently (see /api/telnyx/preauthorize).
 */
export const getOwnedPhoneNumbers = cache(async (userId: string, organizationId: string) =>
  prisma.phoneNumber.findMany({
    where: { organizationId, assignedUserId: userId, status: "ACTIVE" },
    select: { id: true, number: true, telnyxId: true },
    orderBy: { createdAt: "desc" },
  }),
);

/**
 * INVARIANT A — every number of the tenant, regardless of the current plan.
 *
 * The plan is only ever a capability gate (see `canUseNumberCapability`). It is
 * never part of the `where` clause, so buying before choosing a plan, then
 * changing plans, can never make a number vanish.
 */
export const getOrganizationPhoneNumbers = cache(async (organizationId: string) =>
  prisma.phoneNumber.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  }),
);