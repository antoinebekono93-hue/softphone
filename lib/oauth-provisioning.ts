import { prisma } from "@/lib/prisma";
import { provisionOrganizationWithAdmin } from "@/lib/organization-provisioning";

function deriveOrganizationName(name: string | null | undefined, email: string): string {
  const displayName = name?.trim();
  if (displayName) return `${displayName} Organization`;
  const localPart = email.split("@")[0]?.trim();
  return localPart ? `${localPart} Organization` : "My Organization";
}

/**
 * Resolve the Buster Call user behind a Google (OAuth) identity.
 *
 * Same-email behaviour (documented in NHOST_GOOGLE_AUTH_IMPLEMENTATION_REPORT.md):
 *  - If a user with the same email already exists, we LINK to it instead of
 *    creating a duplicate. The existing identity (password hash, role,
 *    organization) is preserved; only missing profile fields are filled.
 *  - Otherwise a brand-new organization + ADMIN user is provisioned through the
 *    exact same path as email/password registration.
 */
export async function resolveOrProvisionOAuthUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<{ userId: string; created: boolean }> {
  const email = params.email.trim();
  if (!email) {
    throw new Error("OAuth provider did not return an email address");
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (existing) {
    const needsProfileFill =
      (Boolean(params.name) && !existing.name) ||
      (Boolean(params.image) && !existing.image) ||
      !existing.emailVerified;

    if (needsProfileFill) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: existing.name ?? params.name ?? null,
          image: existing.image ?? params.image ?? null,
          emailVerified: existing.emailVerified ?? new Date(),
        },
      });
    }

    return { userId: existing.id, created: false };
  }

  const org = await provisionOrganizationWithAdmin({
    orgName: deriveOrganizationName(params.name, email),
    email,
    name: params.name ?? null,
    image: params.image ?? null,
  });

  const created = org.users[0];
  return { userId: created.id, created: true };
}

/**
 * Record that an OAuth provider is connected to a Buster Call user, so the
 * account settings page can display "Connected / Not connected".
 *
 * No OAuth access/refresh tokens are stored: Google is used for authentication
 * only (never for Gmail/Drive/Calendar/Contacts/YouTube API access).
 */
export async function recordOAuthAccountLink(
  userId: string,
  provider: string,
  providerAccountId: string
): Promise<void> {
  if (!provider || !providerAccountId) return;

  await prisma.account.upsert({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    create: { userId, type: "oauth", provider, providerAccountId },
    update: { userId },
  });
}
