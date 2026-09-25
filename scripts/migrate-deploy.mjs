import { spawnSync } from "node:child_process";

const ATTEMPTS = 4;
const RETRY_DELAY_MS = 20_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  console.log(`[migrate] Tentative ${attempt}/${ATTEMPTS} : prisma migrate deploy`);
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) {
    console.error(`[migrate] Erreur de lancement : ${result.error.message}`);
  } else if (result.status === 0) {
    console.log("[migrate] Migrations appliquées.");
    process.exit(0);
  }
  if (attempt < ATTEMPTS) {
    console.log(`[migrate] Échec (code ${result.status ?? "?"}), nouvelle tentative dans ${RETRY_DELAY_MS / 1000}s…`);
    await sleep(RETRY_DELAY_MS);
  }
}

console.error("[migrate] Échec après plusieurs tentatives (pool de base saturé ou verrou DDL).");
process.exit(1);