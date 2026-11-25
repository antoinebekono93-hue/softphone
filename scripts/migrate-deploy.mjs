// Migration runner — explicite, borné, fail-closed.
//
// This script is NEVER invoked by `npm run build` (see package.json).
// It must be run intentionally: `npm run db:migrate:deploy`.
//
// Security/safety properties:
//  - Prefers a direct (non-pooled) connection: DIRECT_URL, else DATABASE_URL.
//  - FAILS CLOSED if only a pooled DATABASE_URL (pgbouncer) is available and
//    no DIRECT_URL is set: Prisma Migrate requires a non-pooled connection.
//  - Every Prisma process has a finite timeout and is killed on expiry.
//  - Retries are finite and only for transient outcomes (DB_UNREACHABLE/TIMEOUT).
//  - No credentials are ever printed.

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ATTEMPTS = 3;
const TIMEOUT_MS = 120_000;
const RETRY_DELAY_MS = 15_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const OUTCOME = {
  SUCCESS: "SUCCESS",
  DB_UNREACHABLE: "DB_UNREACHABLE",
  TIMEOUT: "TIMEOUT",
  PRISMA_ERROR: "PRISMA_ERROR",
  UNKNOWN_FAILURE: "UNKNOWN_FAILURE",
};

// Prisma codes that indicate the database could not be reached / was not usable.
const UNREACHABLE_CODES = new Set(["P1000", "P1001", "P1002", "P1003", "P1017"]);

// Heuristic: does this connection string look like a PgBouncer / pooled URL?
export function looksPooled(url) {
  if (!url || typeof url !== "string") return false;
  const s = url.toLowerCase();
  return (
    s.includes("pgbouncer=true") ||
    s.includes("pgbouncer%3dtrue") ||
    s.includes(":6543") ||
    s.includes("pooler")
  );
}

// Resolve the connection to use for migrations. Pure: takes an env object.
// Returns { ok: true, source, url } or { ok: false, reason, message, source? }.
export function resolveMigrationUrl(env = {}) {
  const direct = env.DIRECT_URL;
  const primary = env.DATABASE_URL;

  if (direct && direct.trim()) {
    return { ok: true, source: "DIRECT_URL", url: direct };
  }
  if (!primary || !primary.trim()) {
    return {
      ok: false,
      reason: "no_url",
      message:
        "Neither DIRECT_URL nor DATABASE_URL is set. Configure a direct (non-pooled) PostgreSQL connection before migrating.",
    };
  }
  if (looksPooled(primary)) {
    return {
      ok: false,
      reason: "pooled_requires_direct",
      source: "DATABASE_URL",
      message:
        "Migrate requires a direct (non-pooled) connection, but DATABASE_URL looks pooled (PgBouncer) and DIRECT_URL is not set. Set DIRECT_URL to the direct connection string.",
    };
  }
  return { ok: true, source: "DATABASE_URL", url: primary };
}

// Classify a finished/killed Prisma process. Pure.
export function classifyMigrationResult({ status, error, signal, output } = {}) {
  if ((error && error.code === "ETIMEDOUT") || signal === "SIGTERM" || signal === "SIGKILL") {
    return { outcome: OUTCOME.TIMEOUT, detail: "process interrompu (délai dépassé)" };
  }
  if (status === 0) {
    return { outcome: OUTCOME.SUCCESS, detail: "" };
  }
  const text = output || "";
  if (/Can't reach database server|Timed out fetching a new connection|Server has closed the connection/i.test(text)) {
    return { outcome: OUTCOME.DB_UNREACHABLE, detail: "base de données injoignable" };
  }
  const codeMatch = text.match(/\bP\d{4}\b/);
  if (codeMatch) {
    if (UNREACHABLE_CODES.has(codeMatch[0])) {
      return { outcome: OUTCOME.DB_UNREACHABLE, detail: `base injoignable (${codeMatch[0]})` };
    }
    return { outcome: OUTCOME.PRISMA_ERROR, detail: `erreur Prisma ${codeMatch[0]}` };
  }
  if (error) {
    return { outcome: OUTCOME.UNKNOWN_FAILURE, detail: error.message };
  }
  return { outcome: OUTCOME.UNKNOWN_FAILURE, detail: `code de sortie ${status ?? "?"}` };
}

function runOnce(url) {
  // Explicitly select the resolved connection for the child process only.
  // The schema's datasource reads env("DATABASE_URL"); environment values take
  // precedence over any .env file, so this is what Prisma migrate will use.
  const childEnv = { ...process.env, DATABASE_URL: url };
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    timeout: TIMEOUT_MS,
    killSignal: "SIGTERM",
    env: childEnv,
    encoding: "utf8",
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  return { output, ...classifyMigrationResult({ status: result.status, error: result.error, signal: result.signal, output }) };
}

async function main() {
  // Load .env locally (Vercel injects env vars and has no .env file).
  try {
    process.loadEnvFile?.();
  } catch {
    /* no .env present — rely on injected environment variables */
  }

  const resolved = resolveMigrationUrl(process.env);
  if (!resolved.ok) {
    console.error(`[migrate] ABORT: ${resolved.message}`);
    console.error("[migrate] Aucune migration n'a été appliquée.");
    process.exit(2);
  }

  console.log(
    `[migrate] Connexion migration: ${resolved.source} — timeout ${TIMEOUT_MS / 1000}s/essai, ${ATTEMPTS} essais max.`,
  );

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    console.log(`[migrate] Tentative ${attempt}/${ATTEMPTS}: prisma migrate deploy`);
    const r = runOnce(resolved.url);

    if (r.output.trim()) {
      process.stdout.write(r.output.endsWith("\n") ? r.output : `${r.output}\n`);
    }

    if (r.outcome === OUTCOME.SUCCESS) {
      console.log("[migrate] SUCCESS: migrations appliquées.");
      process.exit(0);
    }

    console.log(`[migrate] ${r.outcome}: ${r.detail}`);

    const retryable = r.outcome === OUTCOME.DB_UNREACHABLE || r.outcome === OUTCOME.TIMEOUT;
    if (!retryable) {
      console.error("[migrate] Échec non réessayable. Abandon.");
      process.exit(1);
    }
    if (attempt < ATTEMPTS) {
      console.log(`[migrate] Nouvelle tentative dans ${RETRY_DELAY_MS / 1000}s…`);
      await sleep(RETRY_DELAY_MS);
    }
  }

  console.error("[migrate] Échec après toutes les tentatives.");
  process.exit(1);
}

// Only run when executed directly (not when imported by tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
