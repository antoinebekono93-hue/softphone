import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaUrl = process.env.DATABASE_URL || "";

// Vercel / Neon Free Tier Postgres fixes
if (prismaUrl) {
  // Force a connection limit of 1 per serverless instance to avoid exhausting Neon's global pool (15 max)
  // when multiple API routes are fetched concurrently on page load.
  const separator = prismaUrl.includes("?") ? "&" : "?";
  if (!prismaUrl.includes("connection_limit=")) {
    prismaUrl += `${separator}connection_limit=1`;
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
