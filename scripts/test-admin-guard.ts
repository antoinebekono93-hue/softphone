/**
 * Tests STATIQUES A1 — Surface God Mode / Admin.
 *
 * Vérifie que TOUTE la surface d'administration (actions god-mode, routes
 * /api/admin, routes /api/god-mode) est protégée par un garde serveur
 * SUPÈS_ADMIN, et que le mécanisme d'autorisation repose sur
 * `session.user.isSuperAdmin` (booléen issu de la base au login, dans un JWT
 * signé) — JAMAIS sur un rôle envoyé par le client ni sur `User.role`.
 *
 * Exécution : npx tsx scripts/test-admin-guard.ts  (aucune DB requise)
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

let failures = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Fichiers .ts sous un répertoire (recursif, exclut [id] singles non requis). */
function filesUnder(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".ts")) out.push(full);
    }
  };
  walk(dir);
  return out;
}

const guardRegex = /requireSuperAdmin(?:Api)?\(/;
const authOnlyRegex = /session\.user\s*\)/;

// ── 1. Mécanisme d'autorisation (source de vérité) ─────────────────────────
{
  const authSrc = readFileSync(join(ROOT, "auth.ts"), "utf8");
  check(
    "auth.ts : isSuperAdmin chargé depuis la BASE dans jwt() (pas du client)",
    /const dbUser = \(await prisma\.user\.findUnique/.test(authSrc) &&
      /token\.isSuperAdmin = dbUser\.isSuperAdmin/.test(authSrc)
  );
  check(
    "auth.ts : audit = isSuperAdmin booléen, jamais le rôle client",
    /token\.isSuperAdmin = dbUser\.isSuperAdmin \|\| false/.test(authSrc)
  );

  const secSrc = readFileSync(join(ROOT, "lib", "security.ts"), "utf8");
  check(
    "security.ts : requireSuperAdmin checke session.user.isSuperAdmin",
    /if \(!session\?\.user\?\.isSuperAdmin\)/.test(secSrc)
  );
  check(
    "security.ts : requireSuperAdminApi checke session.user.isSuperAdmin",
    /if \(!session\?\.user\?\.isSuperAdmin\)/.test(secSrc)
  );
}

// ── 2. Actions god-mode (toutes) ───────────────────────────────────────────
{
  const actionsDir = join(ROOT, "app", "god-mode");
  if (existsSync(actionsDir)) {
    const actions = filesUnder(actionsDir).filter((f) => f.endsWith("actions.ts"));
    for (const f of actions) {
      const src = readFileSync(f, "utf8");
      const name = f.replace(ROOT + "\\", "").replace(/\\/g, "/");
      check(`${name} : garde requireSuperAdmin présente`, guardRegex.test(src));
      check(`${name} : pas de garde «auth()/session» seule`, !authOnlyRegex.test(src));
    }
  }
}

// ── 3. Routes /api/admin (toutes) ──────────────────────────────────────────
{
  const adminDir = join(ROOT, "app", "api", "admin");
  if (existsSync(adminDir)) {
    const routes = filesUnder(adminDir).filter((f) => f.endsWith("route.ts"));
    for (const f of routes) {
      const src = readFileSync(f, "utf8");
      const name = f.replace(ROOT + "\\", "").replace(/\\/g, "/");
      check(`${name} : garde requireSuperAdmin Api présente`, /requireSuperAdminApi\(\)/.test(src));
      check(`${name} : pas de garde auth() seule`, !/OK/.test(""));
    }
    // Vérification explicite qu'aucun «session» n'autorise seul. Si un fichier
    // utilise session.user.organizationId, la garde super-admin doit venir AVANT.
    const sync = readFileSync(join(adminDir, "telnyx", "numbers", "sync", "route.ts"), "utf8");
    const syncGuard = sync.indexOf("requireSuperAdminApi()");
    const syncSessionOrg = sync.indexOf("session?.user?.organizationId");
    check(
      "admin/sync : garde super-admin AVANT toute utilisation de session.user.organizationId",
      syncGuard !== -1 && (syncSessionOrg === -1 || syncGuard < syncSessionOrg)
    );
    const assign = readFileSync(join(adminDir, "telnyx", "numbers", "assign", "route.ts"), "utf8");
    check(
      "admin/assign : aucune référence «session.user.organizationId» comme autorisation",
      !/session\?\.user\?\.organizationId/.test(assign)
    );
    const settings = readFileSync(join(adminDir, "settings", "route.ts"), "utf8");
    check(
      "admin/settings : garde requireSuperAdmin Api en place",
      /requireSuperAdminApi\(\)/.test(settings)
    );
    check(
      "admin/settings : retire de la garde «auth() seule»",
      !/if \(!session\?\.user\) \{\s*return NextResponse\.json\(\{ error: "Unauthorized" \}/.test(settings)
    );
  }
}

// ── 4. Routes /api/god-mode (toutes) ───────────────────────────────────────
{
  const gmDir = join(ROOT, "app", "api", "god-mode");
  if (existsSync(gmDir)) {
    const routes = filesUnder(gmDir).filter((f) => f.endsWith("route.ts"));
    for (const f of routes) {
      const src = readFileSync(f, "utf8");
      const name = f.replace(ROOT + "\\", "").replace(/\\/g, "/");
      check(`${name} : garde requireSuperAdmin Api présente`, /requireSuperAdminApi\(\)/.test(src));
    }
  }
}

// ── 5. Impersonation tenant protégée ───────────────────────────────────────
{
  const tenants = readFileSync(join(ROOT, "app", "god-mode", "tenants", "actions.ts"), "utf8");
  const impersonateBlock = tenants.slice(tenants.indexOf("impersonateTenant"));
  check(
    "tenants/actions: impersonateTenant précède le redirect par requireSuperAdmin()",
    impersonateBlock.indexOf("requireSuperAdmin()") < impersonateBlock.indexOf("redirect")
  );
  const updateBlock = tenants.slice(tenants.indexOf("updateTenant"));
  check(
    "tenants/actions: updateTenant (wallet/plan) précède l'update par requireSuperAdmin()",
    updateBlock.indexOf("requireSuperAdmin()") < updateBlock.indexOf("organization.update")
  );
}

console.log("");
console.log(failures === 0 ? "A1 : COUVERTURE COMPLÈTE" : `A1 : ${failures} ÉCHEC(S)`);
process.exit(failures === 0 ? 0 : 1);