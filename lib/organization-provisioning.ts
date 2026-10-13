import { prisma } from "@/lib/prisma";

export function slugifyOrganizationName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return base || "organization";
}

export async function generateUniqueOrgSlug(name: string): Promise<string> {
  const baseSlug = slugifyOrganizationName(name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Single source of truth for account provisioning.
 *
 * Both the email/password registration action and the Google OAuth first
 * sign-in go through this function so a brand-new user always ends up with the
 * same shape: an organization (TRIALING) and an ADMIN user attached to it.
 */
export async function provisionOrganizationWithAdmin(args: {
  orgName: string;
  email: string;
  passwordHash?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  const slug = await generateUniqueOrgSlug(args.orgName);

  return prisma.organization.create({
    data: {
      name: args.orgName,
      slug,
      planStatus: "TRIALING",
      users: {
        create: {
          email: args.email,
          passwordHash: args.passwordHash ?? null,
          name: args.name ?? null,
          image: args.image ?? null,
          role: "ADMIN",
        },
      },
    },
    include: { users: true },
  });
}
