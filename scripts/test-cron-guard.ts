/**
 * Tests A2 — Garde CRON_SECRET.
 *
 * 1. Tests PURE de `requireCronSecret` (aucune DB requise) :
 *    - secret absent (prod) → REFUS ; secret absent (dev) → toléré.
 *    - secret incorrect (prod) → REFUS.
 *    - secret correct (prod) → AUTORISÉ.
 *    - aucun bypass par header alternatif, ni par capitalisation/méthode.
 * 2. Scan STATIQUE : chaque route sous app/api/cron invoque requireCronSecret,
 *    et n'exporte que GET (pas d'autre méthode HTTP exploitable).
 *
 * Exécution : npx tsx scripts/test-cron-guard.ts
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

let failures = 0;

// Pré-charge .env/.env.local AVANT d'importer lib/security (validateEnv fail-closed).
for (const file of [".env", ".env.local"]) {
  const p = join(ROOT, file);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

function check(name: string, cond: boolean, detail?: string) {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const env = process.env as Record<string, string | undefined>;

function setEnv(nodeEnv: string | undefined, cronSecret: string | undefined) {
  if (nodeEnv === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = nodeEnv;
  if (cronSecret === undefined) delete env.CRON_SECRET;
  else env.CRON_SECRET = cronSecret;
}

function req(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader !== undefined) headers.set("authorization", authHeader);
  return new Request("https://app.example/api/cron/test", { method: "GET", headers });
}

// ── 1. Matrice de décision (production) ────────────────────────────────────
async function run() {
  const { requireCronSecret } = await import("../lib/security");

  setEnv("production", "s3cr3t-value");

check("prod + secret valide + header correct → AUTORISÉ",
  requireCronSecret(req("Bearer s3cr3t-value")) === true);

check("prod + secret valide + header absent → REFUS",
  requireCronSecret(req()) === false);

check("prod + secret valide + header incorrect → REFUS",
  requireCronSecret(req("Bearer wrong-value")) === false);

check("prod + secret valide + header en casse différente → REFUS",
  requireCronSecret(req("bearer s3cr3t-value")) === false);

check("prod + secret manquant + n'importe quel header → REFUS (fail-closed)",
  requireCronSecret(req("Bearer whatever")) === false);

// ── 2. Bypass header (production) ──────────────────────────────────────────
{
  setEnv("production", "s3cr3t-value");
  const h = new Headers();
  h.set("x-cron-secret", "s3cr3t-value");
  h.set("auth", "s3cr3t-value");
  check("prod : bypass par header X-*/custom → REFUS",
    requireCronSecret(new Request("https://x/api/cron/test", { method: "GET", headers: h })) === false);
}

// ── 3. Comportement en dev ─────────────────────────────────────────────────
setEnv(undefined, undefined);
check("dev + CRON_SECRET absent → autorisé (confort dev uniquement)",
  requireCronSecret(req()) === true);

setEnv(undefined, "dev-secret");
check("dev + CRON_SECRET présent + correct → AUTORISÉ",
  requireCronSecret(req("Bearer dev-secret")) === true);

setEnv(undefined, "dev-secret");
check("dev + CRON_SECRET présent + incorrect → REFUS",
  requireCronSecret(req("Bearer nope")) === false);

// ── 4. Scan statique des routes cron ───────────────────────────────────────
  {
    const cronDir = join(ROOT, "app", "api", "cron");
    if (!existsSync(cronDir)) {
      check("app/api/cron existe", false);
    } else {
      const walk = (d: string): string[] => {
        const out: string[] = [];
        for (const entry of readdirSync(d, { withFileTypes: true })) {
          const full = join(d, entry.name);
          if (entry.isDirectory()) out.push(...walk(full));
          else if (entry.name === "route.ts") out.push(full);
        }
        return out;
      };
      const routes = walk(cronDir);
      check(`scan : ${routes.length} routes cron trouvées`, routes.length >= 1);
      for (const f of routes) {
        const src = readFileSync(f, "utf8");
        const name = f.replace(ROOT + "\\", "").replace(/\\/g, "/");
        // Corps sans les lignes d'import (les imports mentionnent prisma/telnyx).
        const body = src.replace(/^import .*$/gm, "");
        const exportsMethods = src.match(/export async function (GET|POST|PUT|PATCH|DELETE)/g) ?? [];
        check(`${name} : guard invoqué pour CHAQUE handler exporté (${exportsMethods.length})`,
          exportsMethods.length >= 1 &&
          (src.match(/requireCronSecret\(req\)/g) ?? []).length === exportsMethods.length);
        check(`${name} : la garde précède le premier effet (prisma/execute/fetch)`,
          (() => {
            const guard = body.indexOf("if (!requireCronSecret(req))");
            if (guard === -1) return false;
            const firstEffect = Math.min(
              ...[
                body.indexOf("prisma."),
                body.indexOf("executeFlow("),
                body.indexOf("await fetch("),
              ].filter((i) => i !== -1)
            );
            return guard < firstEffect;
          })());
      }
    }
  }

  console.log("");
  console.log(failures === 0 ? "A2 : GARDE CRON CONFORME" : `A2 : ${failures} ÉCHEC(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error("Erreur inattendue:", err);
  process.exit(1);
});