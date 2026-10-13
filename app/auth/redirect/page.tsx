import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInternalRedirect } from "@/lib/safe-redirect";

export const dynamic = "force-dynamic";

/**
 * Landing point after an OAuth round-trip.
 *
 * Reuses the existing account-session freshness logic instead of blindly
 * sending everyone to /dashboard:
 *  - no session            -> /login
 *  - no organization       -> /onboarding (bootstrap)
 *  - no phone number yet   -> /onboarding (same provisioning as email users)
 *  - otherwise             -> the sanitized internal `next` path
 *
 * The `next` value only ever comes from `sanitizeInternalRedirect`, so it can
 * never point to an external host.
 */
export default async function AuthRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destination = sanitizeInternalRedirect(next);

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
    return null;
  }

  let hasOrganization = false;
  let hasPhoneNumber = false;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true,
        organization: {
          select: { phoneNumbers: { select: { id: true }, take: 1 } },
        },
      },
    });
    hasOrganization = Boolean(user?.organizationId && user.organization);
    hasPhoneNumber = Boolean(user?.organization?.phoneNumbers?.length);
  } catch (e) {
    console.error("[AuthRedirect] Failed to resolve organization state:", e);
    // Fall through to onboarding: a fresh session that cannot be verified must
    // not silently land on a protected dashboard.
  }

  if (!hasOrganization || !hasPhoneNumber) {
    redirect("/onboarding");
  }

  redirect(destination);
}
