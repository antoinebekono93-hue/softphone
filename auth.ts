import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET || "f62a4b8cd9a714e897b2354c86e0fc21568b209a3c94d12b";
}

// We use a simple hash comparison for demo purposes.
// In production, consider using bcrypt or argon2.
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "f62a4b8cd9a714e897b2354c86e0fc21568b209a3c94d12b",
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;

        // Fetch organization info
        const dbUser = (await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            role: true,
            isSuperAdmin: true,
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
                planStatus: true,
              },
            },
          },
        })) as any;

        if (dbUser) {
          token.role = dbUser.role;
          token.isSuperAdmin = dbUser.isSuperAdmin || false;
          token.organizationId = dbUser.organizationId;
          token.organizationName = dbUser.organization?.name;
          token.planStatus = dbUser.organization?.planStatus;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (process.env.MOCK_AUTH === "true") {
        session.user.id = "mock-id";
        session.user.role = "USER";
        session.user.organizationId = "mock-org-id";
        session.user.organizationName = "Mock Org";
        session.user.isSuperAdmin = true;
        return session;
      }
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as any;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.organizationId = token.organizationId as string | undefined;
        session.user.organizationName = token.organizationName as string | undefined;
        session.user.plan = token.plan as string | undefined;
        session.user.planStatus = token.planStatus as string | undefined;
      }
      return session;
    },
  },
});

// Export the hash function for use in registration
export { hashPassword };
