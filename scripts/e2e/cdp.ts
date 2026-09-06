import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import WebSocket from "ws";

export class CDPError extends Error {}

interface Pending {
  resolve: (v: any) => void;
  reject: (e: Error) => void;
}

export interface CDPEvent {
  method: string;
  params: any;
}

export class CDPSession {
  private ws: WebSocket;
  private nextId = 0;
  private pending = new Map<number, Pending>();
  private subscriptions = new Map<string, ((params: any) => void)[]>();
  events: CDPEvent[] = [];
  consoleMessages: Array<{ level: string; text: string }> = [];
  pageErrors: string[] = [];
  networkRequests: Array<{ method: string; url: string }> = [];
  networkResponses: Array<{ requestId: string; status: number; url: string }> = [];
  closed = false;

  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
  }

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws.once("open", () => resolve());
      this.ws.once("error", (e) => reject(e));
      this.ws.on("message", (data) => this.onMessage(String(data)));
    });
  }

  private onMessage(raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (typeof msg.id === "number") {
      const p = this.pending.get(msg.id);
      if (p) {
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new CDPError(msg.error.message));
        else p.resolve(msg.result);
      }
      return;
    }
    this.events.push({ method: msg.method, params: msg.params });
    if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params?.exceptionDetails?.exception?.description || msg.params?.exceptionDetails?.text || msg.params?.exceptionDetails?.exception?.value || "exception";
      this.pageErrors.push(String(d));
    }
    if (msg.method === "Runtime.consoleAPICalled") {
      const level = msg.params?.type || "log";
      const text = (msg.params?.args || []).map((a: any) => a?.value ?? a?.description ?? "").join(" ").slice(0, 400);
      if (level === "error" || level === "warning" || /\[WebRTC\]|\[AppCall\]|\[Media\]/i.test(text)) {
        this.consoleMessages.push({ level, text });
      }
    }
    if (msg.method === "Log.entryAdded") {
      if (msg.params?.entry?.level === "error") {
        this.consoleMessages.push({ level: "error", text: String(msg.params.entry.text).slice(0, 400) });
      }
    }
    if (msg.method === "Network.requestWillBeSent") {
      this.networkRequests.push({ method: msg.params?.request?.method, url: String(msg.params?.request?.url).slice(0, 160) });
    }
    if (msg.method === "Network.responseReceived") {
      this.networkResponses.push({ requestId: String(msg.params?.requestId), status: msg.params?.response?.status, url: String(msg.params?.response?.url).slice(0, 160) });
    }
    const subs = this.subscriptions.get(msg.method);
    if (subs) for (const cb of subs) cb(msg.params);
  }

  on(method: string, cb: (params: any) => void) {
    const list = this.subscriptions.get(method) ?? [];
    list.push(cb);
    this.subscriptions.set(method, list);
  }

  send(method: string, params: any = {}): Promise<any> {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.closed = true;
    try {
      this.ws.close();
    } catch {}
  }
}

export interface LaunchOptions {
  headless?: boolean;
  width?: number;
  height?: number;
  flags?: string[];
  port?: number;
}

export function resolveBrowser(): string {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].filter((p): p is string => Boolean(p));
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new CDPError("Aucun navigateur Chrome/Edge trouvé");
}

export let nextDebugPort = 9333;
export function allocDebugPort(): number {
  return nextDebugPort++;
}

export async function launchUserDataBrowser(
  profileDir: string,
  opts: LaunchOptions = {}
): Promise<{ proc: ChildProcess; port: number; wsUrl: string }> {
  mkdirSync(profileDir, { recursive: true });
  const browser = resolveBrowser();
  const port = opts.port ?? allocDebugPort();
  const args = [
    `--user-data-dir=${profileDir}`,
    `--remote-debugging-port=${port}`,
    `--remote-debugging-address=127.0.0.1`,
    "--no-first-run",
    "--no-default-browser-check",
    "--mute-audio",
    "--disable-background-networking",
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
    "--window-size=" + (opts.width ?? 1280) + "," + (opts.height ?? 900),
    "about:blank",
  ];
  if (opts.headless !== false) args.unshift("--headless=new");
  if (opts.flags) for (const f of opts.flags) args.push(f);

  const proc = spawn(browser, args, { stdio: "ignore", windowsHide: true });

  const deadline = Date.now() + 20000;
  let ready = false;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) throw new CDPError(`Chrome s'est terminé prématurément (code ${proc.exitCode})`);
    try {
      const v = await fetch(`http://127.0.0.1:${port}/json/version`).then((r) => r.json());
      if (v?.webSocketDebuggerUrl) {
        ready = true;
        break;
      }
    } catch {}
    await sleep(250);
  }
  if (!ready) {
    proc.kill();
    throw new CDPError("DevTools endpoint non joignable");
  }

  let target: any;
  for (let i = 0; i < 10; i++) {
    try {
      target = await fetch(`http://127.0.0.1:${port}/json/new?about%3Ablank`, { method: "PUT" }).then((r) => r.json());
      if (target?.webSocketDebuggerUrl) break;
    } catch {}
    await sleep(300);
  }
  if (!target?.webSocketDebuggerUrl) {
    proc.kill();
    throw new CDPError("Impossible de créer un target de page");
  }
  return { proc, port, wsUrl: target.webSocketDebuggerUrl };
}

export class Page {
  session: CDPSession;
  private loadWaiters: Array<() => void> = [];

  constructor(session: CDPSession) {
    this.session = session;
    session.on("Page.loadEventFired", () => {
      const w = this.loadWaiters;
      this.loadWaiters = [];
      for (const done of w) done();
    });
  }

  async init() {
    await this.session.send("Runtime.enable");
    await this.session.send("Page.enable");
    await this.session.send("Log.enable");
    await this.session.send("Network.enable");
  }

  async goto(url: string): Promise<void> {
    const href = await this.evalExpr(`new URL(${JSON.stringify(url)}, location.href).href`);
    const loaded = new Promise<void>((resolve) => this.loadWaiters.push(resolve));
    await this.session.send("Page.navigate", { url: href });
    await loaded;
    await sleep(300);
  }

  async evalFn<T = any>(body: string, args: any[] = []): Promise<T> {
    const r = await this.session.send("Runtime.evaluate", {
      expression: `(${body}).apply(null, ${JSON.stringify(args)})`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r?.exceptionDetails) {
      throw new CDPError("evalFn failed: " + JSON.stringify(r.exceptionDetails).slice(0, 300));
    }
    return r?.result?.value as T;
  }

  async evalExpr<T = any>(expr: string): Promise<T> {
    const r = await this.session.send("Runtime.evaluate", {
      expression: expr,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r?.exceptionDetails) {
      throw new CDPError("evalExpr failed: " + JSON.stringify(r.exceptionDetails).slice(0, 300));
    }
    return r?.result?.value as T;
  }

  async waitFor(expr: string, timeoutMs = 15000, pollMs = 250): Promise<any> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const v = await this.evalExpr(expr);
      if (v) return v;
      await sleep(pollMs);
    }
    throw new CDPError(`waitFor timeout: ${expr}`);
  }

  async waitForSelector(selector: string, timeoutMs = 15000): Promise<void> {
    await this.waitFor(`!!document.querySelector(${JSON.stringify(selector)})`, timeoutMs);
  }

  async textContent(selector: string): Promise<string> {
    return this.evalFn(`function(sel){ const el = document.querySelector(sel); return el ? el.textContent.trim() : null; }`, [selector]);
  }

  async exists(selector: string): Promise<boolean> {
    return this.evalFn(`function(sel){ return !!document.querySelector(sel); }`, [selector]);
  }

  async fill(inputName: string, value: string): Promise<void> {
    const ok = await this.evalFn(
      `function(name, value){
        const el = document.querySelector('input[name="' + name + '"], textarea[name="' + name + '"]');
        if (!el) return false;
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }`,
      [inputName, value]
    );
    if (!ok) throw new CDPError(`Champ introuvable: input[name=${inputName}]`);
  }

  async click(selector: string): Promise<void> {
    const ok = await this.evalFn(
      `function(sel){ const el = document.querySelector(sel); if (!el) return false; (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) ? el.click() : el.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }`,
      [selector]
    );
    if (!ok) throw new CDPError(`Element introuvable pour click: ${selector}`);
  }

  async realClick(selector: string): Promise<void> {
    const rect = await this.evalFn(
      `function(sel){ const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; }`,
      [selector]
    );
    if (!rect) throw new CDPError(`Element introuvable pour realClick: ${selector}`);
    await this.session.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
    await this.session.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  }

  async typeText(selector: string, text: string): Promise<void> {
    const ok = await this.evalFn(
      `function(sel){ const el = document.querySelector(sel); if (!el) return false; el.focus(); return true; }`,
      [selector]
    );
    if (!ok) throw new CDPError(`Element introuvable pour typeText: ${selector}`);
    await this.session.send("Input.insertText", { text });
  }

  async screenshot(path: string): Promise<void> {
    const r = await this.session.send("Page.captureScreenshot", { format: "png" });
    if (r?.data) {
      const { writeFileSync } = await import("node:fs");
      writeFileSync(path, Buffer.from(r.data, "base64"));
    }
  }

  url(): Promise<string> {
    return this.evalExpr("location.href");
  }

  async login(email: string, password: string): Promise<void> {
    await this.waitForSelector("input[name=email]");
    await this.waitForSelector("input[name=password]");
    await this.typeText("input[name=email]", email);
    await this.typeText("input[name=password]", password);
    await this.realClick("button[type=submit]");
    try {
      await this.waitFor(`location.pathname !== '/login'`, 20000);
    } catch (e) {
      const errText = await this.evalExpr(
        `(document.body.innerText || '').split('\\n').filter(l => /invalid|error|exception|incorrect|echec|échoué|refus/i.test(l)).slice(0,3).join(' | ')`
      ).catch(() => "");
      throw new CDPError(`login(DOM) timeout — errText=${String(errText).slice(0, 200)}`);
    }
  }

  // Flux NextAuth réel côté-à-côté : même endpoints (csrf + callback credentials),
  // même cookie de session. Contourne uniquement le composant React signIn()
  // qui retourne MissingCSRF dans ce navigateur headless.
  async loginViaFetch(email: string, password: string): Promise<void> {
    let lastErr: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.loginViaFetchOnce(email, password);
        return;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        await sleep(3000);
      }
    }
    throw lastErr ?? new Error("loginViaFetch: 3 tentatives échouées");
  }

  private async loginViaFetchOnce(email: string, password: string): Promise<void> {
    const r = await this.evalFn(
      `async function(creds){
        const r1 = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
        const { csrfToken } = await r1.json().catch(() => ({}));
        const b = new URLSearchParams();
        b.set('csrfToken', csrfToken || '');
        b.set('email', creds.email);
        b.set('password', creds.password);
        b.set('json', 'true');
        const r2 = await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: b,
          credentials: 'same-origin',
          redirect: 'follow',
        });
        return { status: r2.status, type: r2.type, url: r2.url.slice(0, 120) };
      }`,
      [{ email, password }]
    );
    const okStatus = r?.status === 302 || r?.status === 200 || r?.type === "opaqueredirect";
    if (!okStatus) {
      let bodyInfo = "";
      try {
        bodyInfo = await this.evalFn(
          `async function(){ const b = await fetch('/api/auth/callback/credentials', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: 'dummy@x.test', password: 'x' }), credentials: 'same-origin', redirect: 'follow' }).catch(() => null); return b ? { status: b.status, text: (await b.text().catch(() => '')).slice(0, 300) } : null; }`,
          []
        );
      } catch {}
      throw new CDPError(`loginViaFetch POST status=${r?.status} type=${r?.type} body=${JSON.stringify(bodyInfo)}`);
    }
    const sess = await this.evalFn(
      `async function(){ const s = await fetch('/api/auth/session', { credentials: 'same-origin' }); return await s.json().catch(() => null); }`,
      []
    );
    if (!sess?.user) {
      throw new CDPError(`loginViaFetch: session vide après POST (status=${r?.status})`);
    }
    await this.goto("/dashboard");
    await this.waitFor(`location.pathname.startsWith('/dashboard')`, 20000);
  }
}