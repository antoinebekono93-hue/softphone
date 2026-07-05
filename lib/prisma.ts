import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaUrl = process.env.DATABASE_URL || "";

// Vercel / Neon Free Tier Postgres fixes
if (prismaUrl) {
  // Use connection limit 3 per serverless instance to allow some concurrency,
  // but wait up to 30 seconds for a connection if the pool is full.
  const separator = prismaUrl.includes("?") ? "&" : "?";
  if (!prismaUrl.includes("connection_limit=")) {
    prismaUrl += `${separator}connection_limit=3&pool_timeout=30`;
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
