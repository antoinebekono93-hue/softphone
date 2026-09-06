import { spawn, execSync, type ChildProcess } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { launchUserDataBrowser, Page, CDPSession } from "./cdp";

const BASE_URL = "http://localhost:3000";
const PROFILES = join("C:/Users/Antoine/AppData/Local/Temp/opencode", "e2e-profiles");
const SHOTS = join("C:/Users/Antoine/AppData/Local/Temp/opencode", "e2e-shots");

const USERS = {
  alice: { email: "e2e.alice@test.local", password: "E2E-Pass-2026!", username: "alice.e2e", ext: "4001" },
  bob: { email: "e2e.bob@test.local", password: "E2E-Pass-2026!", username: "bob.e2e", ext: "4002" },
};

const SEL = {
  callInput: 'input[placeholder="ex. alice, 101, alice@acme.com"]',
  callBtn: 'button[aria-label="Appeler"]',
  accept: 'button[aria-label="Accepter"]',
  reject: 'button[aria-label="Refuser"]',
  hangup: 'button[aria-label="Raccrocher"]',
};

const results: Array<{ name: string; ok: boolean; detail: string }> = [];
let dev: ChildProcess | null = null;
const browsers: ChildProcess[] = [];

function result(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}: ${detail}`);
}

function killTree(pid: number) {
  try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" }); } catch {}
}

async function waitHttp(url: string, timeoutMs = 90000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { const r = await fetch(url, { redirect: "manual" }); if (r.status && r.status < 500) return; } catch {}
    await sleep(1000);
  }
  throw new Error(`timeout HTTP ${url}`);
}

async function startServer(): Promise<ChildProcess> {
  const base = "C:/Users/Antoine/AppData/Local/Temp/opencode";
  const out = join(base, "e2e-server.stdout.log");
  const err = join(base, "e2e-server.stderr.log");
  const proc = spawn("node", ["node_modules/next/dist/bin/next", "start", "--port", "3000"], {
    cwd: "C:/Users/Antoine/3D Objects/github/2",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  if (proc.stdout) proc.stdout.on("data", (d) => writeFileSync(out, d.toString(), { flag: "a" }));
  if (proc.stderr) proc.stderr.on("data", (d) => writeFileSync(err, d.toString(), { flag: "a" }));
  await waitHttp(`${BASE_URL}/login`);
  return proc;
}

async function waitConsoleRe(session: CDPSession, re: RegExp, timeoutMs: number, label: string): Promise<string[]> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const hits = session.consoleMessages.filter((m) => re.test(m.text));
    if (hits.length) return hits.map((h) => h.text);
    await sleep(300);
  }
  throw new Error(`timeout console: ${label}`);
}

interface Shell { name: string; page: Page; session: CDPSession; proc: ChildProcess }

async function loginShell(name: string, profile: string, email: string, password: string): Promise<Shell> {
  const { proc, wsUrl } = await launchUserDataBrowser(profile, { headless: true });
  browsers.push(proc);
  const session = new CDPSession(wsUrl);
  await session.open();
  const page = new Page(session);
  await page.init();
  await page.goto(`${BASE_URL}/login`);
  await page.loginViaFetch(email, password);
  const url = await page.url();
  if (!/\/dashboard/.test(url)) throw new Error(`login ${name} -> ${url}`);
  return { name, page, session, proc };
}

async function dumpSessions(alice: Shell, label: string) {
  try {
    const raw = (await alice.page.evalFn(
      `async function(){ const r = await fetch('/api/app-calls', { credentials: 'same-origin' }); const j = await r.json().catch(() => null); return j ? j.calls.map(c => ({ id: c.id, status: c.status, caller: c.caller?.callUsername, callee: c.callee?.callUsername, calleeId: c.callee?.id, createdAt: c.createdAt })) || [] : null; }`,
      []
    )) as Array<{ id: string; status: string; caller: string; callee: string; calleeId: string; createdAt: string }> | null;
    console.log(`[SESSIONS ${label}] ${JSON.stringify(raw?.slice(0, 3))}`);
    return raw;
  } catch (e: any) {
    console.log(`[SESSIONS ${label}] ERR ${String(e.message).slice(0,120)}`);
    return null;
  }
}

async function main() {
  const startedAt = Date.now();
  try {
    rmSync(PROFILES, { recursive: true, force: true });
    rmSync(SHOTS, { recursive: true, force: true });
    dev = await startServer();
    result("prod-server", true, "next start répond");

    const alice = await loginShell("alice", join(PROFILES, "alice"), USERS.alice.email, USERS.alice.password);
    const bob = await loginShell("bob", join(PROFILES, "bob"), USERS.bob.email, USERS.bob.password);
    result("login-alice+login-bob", true, "2 identités distinctes connectées");

    // Bob navigates on the fully-client Softphone page to avoid the /dashboard Server-Component render errors
    await bob.page.goto("/dashboard/softphone");
    await bob.page.waitForSelector("button", 20000);
    const bobToggled = await bob.page.evalFn(
      `function(){ const el=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Interne'); if(!el) return false; el.click(); return true; }`,
      []
    );
    if (!bobToggled) throw new Error("bob toggle Interne introuvable");
    await bob.page.waitForSelector(SEL.callInput, 20000);

    try {
      await waitConsoleRe(alice.session, /pusherSubscriptionSucceeded/, 30000, "alice pusher ready");
      await waitConsoleRe(bob.session, /pusherSubscriptionSucceeded/, 30000, "bob pusher ready");
      result("pusher-channels-ready", true, "canaux privé-user souscrits sur alice ET bob (cluster réel)");
      await sleep(5000);
    } catch (e: any) {
      for (const label of ["alice", "bob"]) {
        const sp = label === "alice" ? alice : bob;
        const authReqs = sp.session.networkResponses.filter((r) => r.url.includes("/api/pusher/auth"));
        const wsLogs = sp.session.consoleMessages.filter((m) => /\[WebRTC\]|\[AppCall\]/.test(m.text)).slice(-6);
        console.log(`[DIAG ${label}] authResponses=${JSON.stringify(authReqs.map((r) => ({ s: r.status, u: r.url.slice(0, 90) })))}`);
        console.log(`[DIAG ${label}] webRTCLogs=${JSON.stringify(wsLogs.map((m) => m.text))}`);
      }
      result("pusher-channels-ready", false, `souscription Pusher incomplète: ${e.message}`);
    }

    // Wait for DB stability before the call (avoids P1001 resolve failures)
    let dbReady = false;
    for (let i = 0; i < 15; i++) {
      try {
        const r = await alice.page.evalFn(
          `async function(){ const res = await fetch('/api/app-calls', { credentials: 'same-origin' }); return res.status; }`,
          []
        );
        if (typeof r === "number" && r < 500) { dbReady = true; break; }
      } catch {}
      await sleep(2000);
    }
    if (!dbReady) {
      // last-resort check
      const s = await alice.page.evalFn(`async function(){ const r = await fetch('/api/app-calls', {credentials:'same-origin'}); return r.status; }`, []).catch(() => 500);
      if (typeof s === "number" && s >= 500) throw new Error("DB not stable before call (status " + s + ")");
      dbReady = true;
    }
    result("db-stable", true, "DB reachable before call");

    await alice.page.goto("/dashboard/softphone");
    await alice.page.waitForSelector("button", 20000);
    const toggled = await alice.page.evalFn(
      `function(){ const el = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Interne'); if (!el) return false; el.click(); return true; }`,
      []
    );
    if (!toggled) throw new Error("toggle Interne introuvable");
    await alice.page.waitForSelector(SEL.callInput, 20000);
    await alice.page.waitForSelector(SEL.callBtn, 20000);
    const panelText = await alice.page.textContent("body");
    result("softphone-renders", /Appel interne \(App-to-App\)/.test(panelText ?? ""), "/dashboard/softphone affiche AppCallPanel");

    await alice.page.typeText(SEL.callInput, USERS.bob.username);
    await sleep(500);
    // Ensure target is really set in React state
    const targetOk = await alice.page.evalFn(
      `function(){ const i=document.querySelector('input[placeholder="ex. alice, 101, alice@acme.com"]'); return i ? i.value === 'bob.e2e' : false; }`,
      []
    );
    if (!targetOk) {
      await alice.page.evalFn(
        `function(sel,v){ const el=document.querySelector(sel); if(!el) return false; const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return el.value===v; }`,
        [SEL.callInput, USERS.bob.username]
      );
    }
    // Click via JS + native realClick for reliability
    await alice.page.evalFn(`function(){ const b=document.querySelector('button[aria-label="Appeler"]'); if(b) b.click(); }`, []);
    await alice.page.realClick(SEL.callBtn);
    await sleep(3000);
    const btnState = await alice.page.evalFn(
      `function(){ const b=document.querySelector('button[aria-label="Appeler"]'); if(!b) return "gone"; return { disabled:b.disabled, aria:b.getAttribute('aria-label') }; }`,
      []
    );
    console.log(`DEBUG btnState: ${JSON.stringify(btnState)}`);

    // ---- server-side evidence (always) ----
    await dumpSessions(alice, "T0 (just after call)");

    try {
      await waitConsoleRe(alice.session, /event=callOffering/, 15000, "alice OFFERING");
      result("alice-offering", true, "console [WebRTC][STATE] event=callOffering");
    } catch (e: any) {
      const aliceState = alice.session.consoleMessages.filter((m) => /\[WebRTC\]\[STATE\]/.test(m.text)).slice(-8).map((m) => m.text);
      const aliceErrors = alice.session.consoleMessages.filter((m) => m.level === "error").slice(-5).map((m) => m.text);
      console.log(`DEBUG alice [WebRTC][STATE] logs: ${JSON.stringify(aliceState)}`);
      console.log(`DEBUG alice ERRORS: ${JSON.stringify(aliceErrors)}`);
      result("alice-offering", false, String(e.message));
    }

    let bobSawRing = false;
    try {
      await waitConsoleRe(bob.session, /event=callRinging/, 15000, "bob RINGING");
      result("bob-ringing", true, "console Bob event=callRinging");
      bobSawRing = true;
    } catch (e: any) {
      const bobState = bob.session.consoleMessages.filter((m) => /\[WebRTC\]\[STATE\]|\[AppCall\]/.test(m.text)).slice(-8).map((m) => m.text);
      const bobErrors = bob.session.consoleMessages.filter((m) => m.level === "error").slice(-5).map((m) => m.text);
      console.log(`DEBUG bob [WebRTC]/[AppCall] logs: ${JSON.stringify(bobState)}`);
      console.log(`DEBUG bob ERRORS: ${JSON.stringify(bobErrors)}`);
      result("bob-ringing", false, String(e.message));
    }

    try {
      await bob.page.waitForSelector(SEL.accept, 15000);
      const bobBody = await bob.page.textContent("body");
      bobSawRing = /Appel interne entrant/.test(bobBody ?? "") && /alice\.e2e/.test(bobBody ?? "");
      result("callee-ring", bobSawRing, `Bob voit l'overlay global (heading + @alice.e2e)`);
    } catch (e: any) {
      const bobBody = await bob.page.textContent("body").catch(() => "(eval failed)");
      console.log(`DEBUG bob DOM (no ring) body[:400]: ${String(bobBody).slice(0, 400)}`);
      result("callee-ring", false, `Bob ne voit pas l'overlay: ${String(e.message).slice(0, 80)}`);
    }

    if (bobSawRing) {
      try {
        await bob.page.realClick(SEL.accept);
        await waitConsoleRe(bob.session, /event=callAccepting|event=callAnswering/, 20000, "bob accepting");
        result("callee-accept", true, "Bob a cliqué Accepter");
        await alice.page.waitForSelector(SEL.hangup, 45000);
        await waitConsoleRe(alice.session, /event=callConnected/, 45000, "alice connected");
        await waitConsoleRe(bob.session, /event=callConnected/, 45000, "bob connected");
        const connectedText = (await alice.page.textContent("body")) ?? "";
        result("call-connected-ui", /Appel interne en cours/.test(connectedText), "Alice : 'Appel interne en cours'");
        const ice = alice.session.consoleMessages.filter((m) => /connectionState=connected/.test(m.text));
        result("ice-connected", ice.length > 0, `Alice ICE connectionState=connected (${ice.length})`);
        await sleep(4000);
        const timerText = (await alice.page.textContent("body")) ?? "";
        result("call-timer", /\d+m \d+s/.test(timerText), `Timer actif`);
        await alice.page.screenshot(join(SHOTS, "alice-active.png"));
        await bob.page.screenshot(join(SHOTS, "bob-active.png"));
        await alice.page.realClick(SEL.hangup);
        try { await waitConsoleRe(alice.session, /event=callEnded/, 20000, "alice ended"); result("caller-hangup", true, "Alice raccroche"); } catch (e: any) { result("caller-hangup", false, String(e.message)); }
        try { await waitConsoleRe(bob.session, /event=callEndedByPeer/, 20000, "bob ended by peer"); result("callee-ended-by-peer", true, "Bob reçoit event=callEndedByPeer"); } catch (e: any) { result("callee-ended-by-peer", false, String(e.message)); }
        await alice.page.waitForSelector(SEL.callInput, 20000);
        result("caller-back-to-dialer", true, "Alice retombe sur l'écran de numérotation");
      } catch (e: any) {
        result("connect-flow", false, String(e.message));
      }
    }
    // ---- Pusher occupancy check (definitive: was bob subscribed, was the event published?) ----
    try {
      const bobChannel = `private-user-${USERS.bob.username}`;
      const bobInfo = await fetch(
        `https://api.pusherapp.com/channels/${encodeURIComponent(bobChannel)}/info?info=subscription_count`,
        { headers: { Authorization: "Basic " + Buffer.from(`${process.env.PUSHER_APP_ID ?? ""}:${process.env.PUSHER_SECRET ?? ""}`).toString("base64") } }
      ).then(r => r.json()).catch(() => null);
      console.log(`[PUSHER] bob channel occupancy: ${JSON.stringify(bobInfo)}`);
      if (bobInfo?.channel && typeof bobInfo.channel.subscription_count === "number") {
        result("pusher-bob-subscribed", bobInfo.channel.subscription_count >= 1,
          `bob channel ${bobChannel}: ${bobInfo.channel.subscription_count} subscriber(s)`);
      }
    } catch (e: any) {
      console.log(`[PUSHER] occupancy check failed: ${String(e.message).slice(0,120)}`);
    }
    // always verify server state
    await dumpSessions(alice, "T1 (final)");
  } catch (e: any) {
    result("setup-or-flow", false, String(e?.message || e));
  } finally {
    for (const b of browsers) killTree(b.pid ?? 0);
    if (dev) killTree(dev.pid ?? 0);
  }

  const failed = results.filter((r) => !r.ok).length;
  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  console.log(`\nAPP2APP SECTION 2: ${results.length - failed}/${results.length} PASS (${elapsed}s)`);
  process.exit(failed === 0 ? 0 : 1);
}

main();