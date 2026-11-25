// Pure unit tests for scripts/migrate-deploy.mjs helpers.
// No database connection, no migration execution.
//
// Run: node scripts/test-migrate-deploy.mjs

import assert from "node:assert/strict";
import { OUTCOME, looksPooled, resolveMigrationUrl, classifyMigrationResult } from "./migrate-deploy.mjs";

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
}

console.log("[test] migrate-deploy helpers");

// --- looksPooled ---
check("looksPooled: pgbouncer=true", () => assert.equal(looksPooled("postgres://u@h:5432/db?pgbouncer=true"), true));
check("looksPooled: port 6543", () => assert.equal(looksPooled("postgres://u@h:6543/db"), true));
check("looksPooled: plain", () => assert.equal(looksPooled("postgres://u@h:5432/db?sslmode=require"), false));
check("looksPooled: empty", () => assert.equal(looksPooled(""), false));

// --- resolveMigrationUrl ---
check("resolve: DIRECT_URL preferred", () => {
  const r = resolveMigrationUrl({ DIRECT_URL: "postgres://direct", DATABASE_URL: "postgres://pooled?pgbouncer=true" });
  assert.equal(r.ok, true);
  assert.equal(r.source, "DIRECT_URL");
  assert.equal(r.url, "postgres://direct");
});
check("resolve: pooled DATABASE_URL alone fails closed", () => {
  const r = resolveMigrationUrl({ DATABASE_URL: "postgres://h:5432/db?pgbouncer=true" });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "pooled_requires_direct");
});
check("resolve: plain DATABASE_URL accepted", () => {
  const r = resolveMigrationUrl({ DATABASE_URL: "postgres://h:5432/db?sslmode=require" });
  assert.equal(r.ok, true);
  assert.equal(r.source, "DATABASE_URL");
});
check("resolve: nothing set fails", () => {
  const r = resolveMigrationUrl({});
  assert.equal(r.ok, false);
  assert.equal(r.reason, "no_url");
});
check("resolve: blank DIRECT_URL ignored", () => {
  const r = resolveMigrationUrl({ DIRECT_URL: "   ", DATABASE_URL: "postgres://h:5432/db?pgbouncer=true" });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "pooled_requires_direct");
});

// --- classifyMigrationResult ---
check("classify: success", () => {
  assert.equal(classifyMigrationResult({ status: 0 }).outcome, OUTCOME.SUCCESS);
});
check("classify: timeout (ETIMEDOUT)", () => {
  assert.equal(classifyMigrationResult({ error: { code: "ETIMEDOUT" }, signal: "SIGTERM" }).outcome, OUTCOME.TIMEOUT);
});
check("classify: timeout (SIGTERM)", () => {
  assert.equal(classifyMigrationResult({ status: null, signal: "SIGTERM" }).outcome, OUTCOME.TIMEOUT);
});
check("classify: P1001 unreachable", () => {
  assert.equal(
    classifyMigrationResult({ status: 1, output: "Error: P1001: Can't reach database server at host" }).outcome,
    OUTCOME.DB_UNREACHABLE,
  );
});
check("classify: generic Prisma error P3005", () => {
  assert.equal(
    classifyMigrationResult({ status: 1, output: "Error: P3005: The database schema is not empty" }).outcome,
    OUTCOME.PRISMA_ERROR,
  );
});
check("classify: unknown failure", () => {
  assert.equal(classifyMigrationResult({ status: 1, output: "boom" }).outcome, OUTCOME.UNKNOWN_FAILURE);
});

console.log(`\n[test] ${passed} assertions passed.`);
