import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { accountSessionClaims, accountSessionSelect } from "@/lib/account-session";
import { resolveOrProvisionOAuthUser, recordOAuthAccountLink } from "@/lib/oauth-provisioning";

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET!;
}

// Google is only registered when credentials are configured. This keeps the
// app fully functional (email/password) if Google is not set up yet, and avoids
// exposing a broken provider. Credentials belong in environment / provider
// configuration, never in client code.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleEnabled = Boolean(googleClientId && googleClientSecret);

// The only OAuth provider currently allowed. No other social provider is
// configured on purpose; they will be added later, one at a time.
const oauthAllowedProviders = new Set(["google"]);

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Support legacy SHA-256 hashes if they don't start with $2
  if (!hash.startsWith("$2")) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const legacyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return legacyHash === hash;
  }
  return bcrypt.compare(password, hash);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET!,
  trustHost: true,
  // NOTE: PrismaAdapter removed - incompatible with CredentialsProvider + JWT strategy
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
            // Minimal scopes: authentication only. No access to any Google
            // product API is requested.
            authorization: {
              params: { scope: "openid email profile" },
            },
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
callbacks: {
    async signIn({ account }) {
      // Only the Google OAuth provider is allowed. Any other social provider
      // is rejected even if later added by mistake. Credentials sign-in is
      // handled by its own provider.
      if (account && account.type !== "credentials") {
        return oauthAllowedProviders.has(account.provider);
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // First OAuth sign-in: `user.id` is the provider account id (Google sub),
      // NOT a Buster Call user id. Resolve/provision the Buster Call account by
      // email (same-email accounts are linked, never duplicated) and bind the
      // internal id to the JWT, then reuse the exact same claim refresh path.
      if (account && account.type !== "credentials") {
        const email = user?.email ?? (token.email as string | undefined);
        if (!email) return null;

        const resolved = await resolveOrProvisionOAuthUser({
          email,
          name: user?.name ?? (token.name as string | undefined) ?? null,
          image: user?.image ?? null,
        });

        if (account.provider && account.providerAccountId) {
          await recordOAuthAccountLink(
            resolved.userId,
            account.provider,
            account.providerAccountId
          );
        }

        const oauthUser = await prisma.user.findUnique({
          where: { id: resolved.userId },
          select: accountSessionSelect,
        });
        if (!oauthUser) return null;
        return { ...token, id: resolved.userId, ...accountSessionClaims(oauthUser) };
      }

      // INVARIANT D — identity vs mutable account state.
      // Identity (`id`) is immutable and stays in the signed JWT.
      // Mutable account state (role, isSuperAdmin, organization, plan,
      // planStatus) is re-read from the database on EVERY session resolution:
      // a 30-day JWT must not freeze a membership, a plan upgrade/downgrade or
      // an organization change until the next login. Claims are replaced, never
      // merged, so removing a plan or an organization clears the claim instead
      // of leaving a stale one behind.
      const userId = user?.id || token.id;
      if (!userId) return null;
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: accountSessionSelect,
      });
      if (!dbUser) return null;
      return { ...token, id: userId, ...accountSessionClaims(dbUser) };
    },
    async session({ session, token }) {
      // MOCK_AUTH est une backdoor d'admin (attribue isSuperAdmin=true à TOUS).
      // Interdit en production : sinon n'importe quelle connexion passe en super-admin.
      if (process.env.MOCK_AUTH === "true" && process.env.NODE_ENV !== "production") {
        session.user.id = "mock-id";
        session.user.role = "USER";
        session.user.organizationId = "cm1o6r8z00002131v3b9r9y2c";
        session.user.organizationName = "Mock Org";
        session.user.isSuperAdmin = true;
        return session;
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
        session.user.planStatus = token.planStatus as string;
        session.user.plan = token.plan as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Never hand the browser an external destination. Relative paths are
      // resolved against the app origin; absolute same-origin URLs are kept;
      // anything else falls back to the dashboard.
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch {
        // fall through to baseUrl
      }
      return baseUrl;
    },
  },
});

// Export the hash function for use in registration
export { hashPassword };
