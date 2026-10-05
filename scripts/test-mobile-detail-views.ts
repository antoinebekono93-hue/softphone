/* Regression checks for the mobile list/detail fixes applied in this round.
   Run with: npx tsx scripts/test-mobile-detail-views.ts */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";

const root = resolve(__dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

async function main() {
  console.log("\nMobile list/detail regressions\n");

  // 1. PrivateStorageBoundary must never destroy drafts on a transient failure.
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: "http://localhost/dashboard/inbox",
  });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(cb, 0),
    localStorage: dom.window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
  Object.defineProperty(dom.window.navigator, "onLine", { configurable: true, value: true });
  dom.window.matchMedia = (() => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;

  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { PrivateStorageBoundary } = await import("../components/pwa/PrivateStorageBoundary");
  const { draftKey } = await import("../lib/offline-store");
  const localStorage = dom.window.localStorage;
  localStorage.clear();

  const session = { update: async () => null, data: null, status: "unauthenticated" as const };
  let probe: () => Promise<Response>;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/auth/session")) return probe();
    throw new Error("Unexpected request: " + url);
  };

  const { SessionContext } = await import("next-auth/react");
  const container = document.getElementById("root")!;
  const root = createRoot(container);
  const render = async () => {
    await act(async () => {
      root.render(
        React.createElement(
          SessionContext.Provider,
          { value: session },
          React.createElement(PrivateStorageBoundary),
        ),
      );
    });
  };

  localStorage.setItem(draftKey("org:user", "a", "shared"), "brouillon vital");
  localStorage.setItem("antigravity-storage-owner", "org:user");

  probe = async () => { throw new Error("Network down"); };
  await render();
  assert.equal(localStorage.getItem(draftKey("org:user", "a", "shared")), "brouillon vital",
    "A network failure must not be treated as a sign-out");

  probe = async () => new Response("<html>502</html>", { status: 502 });
  await render();
  assert.equal(localStorage.getItem(draftKey("org:user", "a", "shared")), "brouillon vital",
    "A 5xx response must not be treated as a sign-out");

  probe = async () => new Response(JSON.stringify({ user: null }), { status: 200 });
  await render();
  assert.equal(localStorage.getItem(draftKey("org:user", "a", "shared")), null,
    "A definitive empty session purges private data");
  assert.equal(localStorage.getItem("antigravity-storage-owner"), null);

  probe = async () => new Response(JSON.stringify({ user: null }), { status: 200 });
  localStorage.setItem(draftKey("org:other", "a", "shared"), "brouillon autre");
  localStorage.setItem("antigravity-storage-owner", "org:other");
  Object.defineProperty(dom.window.navigator, "onLine", { configurable: true, value: false });
  await render();
  assert.equal(localStorage.getItem(draftKey("org:other", "a", "shared")), "brouillon autre",
    "Offline browsers cannot prove a sign-out");
  await act(async () => root.unmount());
  dom.window.close();
  console.log("  PrivateStorageBoundary: transient failures preserve drafts, definitive sign-out purges.");

  // 2. Static contract checks on the three responsive surfaces fixed in this round.
  console.log("  Responsive surfaces");
  const whatsapp = read("app/dashboard/whatsapp-inbox/WhatsAppInboxClient.tsx");
  assert.match(whatsapp, /useMobileDetail\("event"\)/, "WhatsApp inbox must drive its selection from the URL");
  assert.match(whatsapp, /Retour aux conversations/, "WhatsApp inbox must offer a back affordance");
  assert.doesNotMatch(whatsapp, /useState<[^>]*number \| null>\(null\)\s*;\s*const \[selected/, "Selection must not be local state");

  const messages = read("app/dashboard/messages/layout.tsx");
  assert.doesNotMatch(messages, /100vh/, "Legacy messages layout must not hardcode 100vh");
  assert.match(messages, /usePathname/, "Legacy messages layout must read the current route");
  assert.match(messages, /hidden md:flex/, "Legacy messages layout must collapse the list on mobile");

  const contact = read("app/dashboard/contacts/[id]/page.tsx");
  assert.doesNotMatch(contact, /100vh/, "Contact timeline must not be sized from 100vh");
  assert.match(contact, /min-h-11 min-w-11/, "Contact header back button must be a 44px target");
  assert.match(contact, /dvh/, "Contact timeline must use a dynamic viewport unit");

  const sidebar = read("app/dashboard/DashboardSidebar.tsx");
  assert.match(sidebar, /h-dvh/, "The mobile drawer must use a dynamic viewport height");
  assert.match(sidebar, /env\(safe-area-inset-top\)/, "The mobile drawer must respect the top safe area");

  const proxy = read("proxy.ts");
  assert.doesNotMatch(proxy, /manifest\.webmanifest/, "Only one manifest may be referenced");
  assert.match(proxy, /\/manifest\.json/, "The manifest must stay publicly reachable");

  console.log("  WhatsApp inbox, legacy messages layout, contact timeline and drawer are viewport-safe.");
  console.log("\nMobile list/detail: all checks passed.\n");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});