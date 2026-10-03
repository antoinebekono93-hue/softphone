export const accountSessionSelect = {
  role: true,
  isSuperAdmin: true,
  organizationId: true,
  organization: {
    select: { name: true, planStatus: true, pricingPlan: { select: { name: true } } },
  },
} as const;

type Account = {
  role: string;
  isSuperAdmin: boolean;
  organizationId: string | null;
  organization: { name: string; planStatus: string; pricingPlan: { name: string } | null } | null;
};

/** Always replace old claims, including when membership or a plan was removed. */
export function accountSessionClaims(account: Account) {
  return {
    role: account.role,
    isSuperAdmin: account.isSuperAdmin,
    organizationId: account.organizationId ?? "",
    organizationName: account.organization?.name ?? "",
    plan: account.organization?.pricingPlan?.name ?? "",
    planStatus: account.organization?.planStatus ?? "",
  };
}

export function isBillingPath(pathname: string) {
  return pathname === "/dashboard/billing" || pathname.startsWith("/dashboard/billing/") ||
    pathname === "/dashboard/settings/billing" || pathname.startsWith("/dashboard/settings/billing/");
}

export function requiresBillingRedirect(pathname: string, planStatus: string | null | undefined) {
  return pathname.startsWith("/dashboard") && !isBillingPath(pathname) &&
    Boolean(planStatus && planStatus !== "ACTIVE" && planStatus !== "TRIALING");
}
