import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaUrl = process.env.DATABASE_URL || "";

// Nhost uses PgBouncer for connection pooling
// Nhost direct: postgresql://user:pass@<host>.nhost.run/db
// Nhost PgBouncer: postgresql://user:pass@<host>.nhost.run:5432/db?pgbouncer=true
// Or use the pooler endpoint if available
if (prismaUrl && prismaUrl.includes('nhost.run') && !prismaUrl.includes('pgbouncer')) {
  // Add pgbouncer parameter for Nhost
  const separator = prismaUrl.includes("?") ? "&" : "?";
  prismaUrl += `${separator}pgbouncer=true`;
  console.log('[Prisma] Using Nhost PgBouncer connection pooler');
}

// Connection pool settings for serverless
if (prismaUrl) {
  const separator = prismaUrl.includes("?") ? "&" : "?";
  if (!prismaUrl.includes("connection_limit=")) {
    // Nhost PgBouncer handles pooling, but we set a reasonable limit
    prismaUrl += `${separator}connection_limit=20&pool_timeout=30`;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: prismaUrl,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
