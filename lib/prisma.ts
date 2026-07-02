import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaUrl = process.env.DATABASE_URL || "";

// Vercel / Nhost Postgres fixes
if (prismaUrl) {
  // Force a low connection limit per serverless instance to avoid exhausting Nhost's 100 limit
  const separator = prismaUrl.includes("?") ? "&" : "?";
  if (!prismaUrl.includes("connection_limit=")) {
    prismaUrl += `${separator}connection_limit=2`;
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
