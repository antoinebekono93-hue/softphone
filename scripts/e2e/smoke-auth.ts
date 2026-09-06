import { spawn, type ChildProcess } from "node:child_process";
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { launchUserDataBrowser, Page, CDPSession } from "./cdp";

const BASE_URL = "http://localhost:3000";
const PROFILES = join("C:/Users/Antoine/AppData/Local/Temp/opencode", "e2e-profiles");

const CREDS = [
  { name: "alice", email: "e2e.alice@test.local", password: "E2E-Pass-2026!", profile: join(PROFILES, "alice") },
  { name: "bob", email: "e2e.bob@test.local", password: "E2E-Pass-2026!", profile: join(PROFILES, "bob") },
];

let dev: ChildProcess | null = null;
let browsers: ChildProcess[] = [];

function killTree(pid: number) {
  try {
    execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
  } catch {}
}

async function waitHttp(url: string, timeoutMs = 90000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { redirect: "manual" });
      if (r.status && r.status < 500) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error(`timeout HTTP ${url}`);
}

async function startServer(): Promise<ChildProcess> {
  const proc = spawn(
    "node",
    ["node_modules/next/dist/bin/next", "start", "--port", "3000"],
    { cwd: "C:/Users/Antoine/3D Objects/github/2", stdio: "ignore", windowsHide: true }
  );
  await waitHttp(`${BASE_URL}/login`);
  return proc;
}

async function main() {
  const results: Array<{ name: string; ok: boolean; detail: string }> = [];
  const shellProfiles: { name: string; page: Page; session: CDPSession; proc: ChildProcess }[] = [];

  try {
    rmSync(PROFILES, { recursive: true, force: true });
    dev = await startServer();
    results.push({ name: "prod-server", ok: true, detail: "next start répond sur /login" });

    for (const cred of CREDS) {
      const { proc, wsUrl } = await launchUserDataBrowser(cred.profile, { headless: true });
      browsers.push(proc);
      const session = new CDPSession(wsUrl);
      await session.open();
      const page = new Page(session);
      await page.init();
      await page.goto(`${BASE_URL}/login`);
      await page.loginViaFetch(cred.email, cred.password);
      const path = await page.url();
      const ok = /\/dashboard(\?.*)?$/.test(path);
      const consoleErrors = session.consoleMessages.length;
      results.push({
        name: `login-${cred.name}`,
        ok,
        detail: `url=${path} consoleErrors=${consoleErrors}`,
      });
      shellProfiles.push({ name: cred.name, page, session, proc });
      await sleep(2000);
    }

    const ids: Array<string | null> = [];
    for (const sp of shellProfiles) {
      const id = await sp.page.evalFn(
        `async function(){ const s = await fetch('/api/auth/session').then(r => r.json()).catch(() => null); return s && s.user ? s.user.id : null; }`,
        []
      );
      ids.push(id as string | null);
    }
    const sameIdentity = ids.length === 2 && !!ids[0] && !!ids[1] && ids[0] === ids[1];
    results.push({
      name: "isolation-2-profils",
      ok: !sameIdentity && ids.length === 2 && !!ids[0] && !!ids[1],
      detail: `alice.id=${ids[0]} bob.id=${ids[1]} (doivent différer)`,
    });

    for (const sp of shellProfiles) {
      const errors = sp.session.pageErrors.slice(0, 5);
      results.push({
        name: `page-errors-${sp.name}`,
        ok: errors.length === 0,
        detail: errors.length ? errors.join(" | ") : "aucune",
      });
    }
  } catch (e: any) {
    results.push({ name: "setup", ok: false, detail: String(e?.message || e) });
  } finally {
    for (const b of browsers) killTree(b.pid ?? 0);
    if (dev) killTree(dev.pid ?? 0);
  }

  let failed = 0;
  for (const r of results) {
    const tag = r.ok ? "PASS" : "FAIL";
    if (!r.ok) failed++;
    console.log(`[${tag}] ${r.name}: ${r.detail}`);
  }
  console.log(failed === 0 ? "SMOKE OK" : `SMOKE FAILED (${failed} échec(s))`);
  process.exit(failed === 0 ? 0 : 1);
}

main();