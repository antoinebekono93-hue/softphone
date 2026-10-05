import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

async function main() {
  const dom = new JSDOM('<!doctype html><html><body><button id="launcher">Open</button><div id="root"></div></body></html>', { url: "http://localhost/dashboard/inbox?contact=a" });
  Object.assign(globalThis, {
    window: dom.window, document: dom.window.document,
    HTMLElement: dom.window.HTMLElement, requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(cb, 0), localStorage: dom.window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
  Object.defineProperty(dom.window.navigator, "onLine", { configurable: true, value: true });
  dom.window.matchMedia = (() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  dom.window.HTMLElement.prototype.getClientRects = function() { return [{ width: 100, height: 44 }] as unknown as DOMRectList; };
  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { SearchParamsContext } = await import("next/dist/shared/lib/hooks-client-context.shared-runtime");
  const { default: InboxClient } = await import("../app/dashboard/inbox/InboxClient");
  const { Modal } = await import("../components/ui/modal");
  const { draftKey, readSnapshot, clearPrivateLocalStorage } = await import("../lib/offline-store");
  const contacts = ["a", "b"].map(id => ({ id, name: "Contact " + id, phone: id, botMode: false, escalationStatus: "NONE", aiSummary: null, lastMessage: null }));
  let sending = 0;
  let deferA = false;
  let finishA: ((value: Response) => void) | undefined;
  const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/api/inbox/send")) { sending++; return response({ error: "Canal indisponible" }, 422); }
    if (url.includes("/api/inbox/contacts")) return response({ contacts });
    if (url.includes("contactId=a") && deferA) return new Promise(resolve => { finishA = resolve; });
    if (url.includes("/api/inbox/messages")) return response({ messages: [{ id: url.includes("contactId=b") ? "b-message" : "a-message", body: url.includes("contactId=b") ? "Message B" : "Message A", type: "SMS", direction: "INBOUND", sentAt: new Date().toISOString() }] });
    throw new Error("Unexpected request: " + url);
  };
  const container = document.getElementById("root")!;
  let root = createRoot(container);
  const renderInbox = async (contact: string) => {
    await act(async () => {
      root.render(React.createElement(SearchParamsContext.Provider, { value: new URLSearchParams({ contact }) },
        React.createElement(InboxClient, { organizationId: "org", userId: "user" })));
    });
  };
  await renderInbox("a");
  assert.match(container.textContent!, /Message A/);
  assert.ok(container.querySelector('textarea[aria-label="Votre message"]'));
  assert.ok(container.querySelector('[aria-label="Retour aux discussions"]'));
  assert.equal(container.querySelectorAll('button[aria-pressed]').length, 2, "Only supported sending channels");
  const textarea = container.querySelector("textarea")!;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")!.set!;
    setter.call(textarea, "Brouillon conservé");
    textarea.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
  assert.equal(localStorage.getItem(draftKey("org:user", "a", "shared")), "Brouillon conservé");
  await act(async () => { (container.querySelector('[aria-label="Envoyer le message"]') as HTMLButtonElement).click(); });
  assert.equal(sending, 1);
  assert.equal(textarea.value, "Brouillon conservé", "HTTP failure must preserve draft");
  assert.match(container.querySelector('[role="alert"]')!.textContent!, /Canal indisponible/);
  await act(async () => {
    Object.defineProperty(dom.window.navigator, "onLine", { configurable: true, value: false });
    window.dispatchEvent(new dom.window.Event("offline"));
  });
  assert.equal((container.querySelector('[aria-label="Envoyer le message"]') as HTMLButtonElement).disabled, true);
  await renderInbox("b");
  assert.equal(container.querySelector("textarea")!.value, "", "Draft must not leak to another contact");
  await renderInbox("a");
  assert.equal(container.querySelector("textarea")!.value, "Brouillon conservé");
  deferA = true;
  await renderInbox("b");
  await renderInbox("a");
  await renderInbox("b");
  await act(async () => { finishA?.(response({ messages: [{ id: "late", body: "STALE", sentAt: new Date().toISOString() }] })); });
  assert.doesNotMatch(container.textContent!, /STALE/, "Late responses cannot overwrite selected conversation");
  await act(async () => root.unmount());

  root = createRoot(container);
  const launcher = document.getElementById("launcher")!;
  launcher.focus();
  let closed = 0;
  await act(async () => root.render(React.createElement(Modal, { open: true, title: "Test", onClose: () => { closed++; } }, React.createElement("button", null, "Action"))));
  const dialog = document.querySelector('[role="dialog"]')!;
  assert.ok(dialog.contains(document.activeElement));
  const buttons = dialog.querySelectorAll("button");
  buttons[buttons.length - 1].focus();
  await act(async () => document.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })));
  assert.equal(document.activeElement, buttons[0], "Focus must stay inside the modal");
  await act(async () => document.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  assert.equal(closed, 1);
  await act(async () => root.unmount());
  assert.equal(document.activeElement, launcher);
  assert.equal(document.body.style.overflow, "");
  assert.equal(await readSnapshot("org:user", "contacts"), null, "Unavailable IndexedDB must degrade gracefully");
  localStorage.setItem("unrelated-setting", "keep");
  clearPrivateLocalStorage();
  assert.equal(localStorage.getItem(draftKey("org:user", "a", "shared")), null);
  assert.equal(localStorage.getItem("unrelated-setting"), "keep");
  // Reproduce Next's history contract: internal __NA/_N writes bypass router updates.
  deferA = false;
  Object.defineProperty(dom.window.navigator, "onLine", { configurable: true, value: true });
  window.history.replaceState({ __NA: true }, "", "/dashboard/inbox");
  function NavigationHarness() {
    const [params, setParams] = React.useState(new URLSearchParams(window.location.search));
    React.useEffect(() => {
      const push = window.history.pushState.bind(window.history);
      const replace = window.history.replaceState.bind(window.history);
      const update = () => setParams(new URLSearchParams(window.location.search));
      window.history.pushState = (data, unused, url) => {
        push(data, unused, url);
        if (!data?.__NA && !data?._N) update();
      };
      window.history.replaceState = (data, unused, url) => {
        replace(data, unused, url);
        if (!data?.__NA && !data?._N) update();
      };
      window.addEventListener("popstate", update);
      return () => {
        window.history.pushState = push;
        window.history.replaceState = replace;
        window.removeEventListener("popstate", update);
      };
    }, []);
    return React.createElement(SearchParamsContext.Provider, { value: params },
      React.createElement(InboxClient, { organizationId: "org", userId: "user" }));
  }
  root = createRoot(container);
  await act(async () => root.render(React.createElement(NavigationHarness)));
  const row = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Contact a"))!;
  await act(async () => row.click());
  assert.ok(container.querySelector("textarea"), "Opening a row must update Next's search params");
  const back = container.querySelector<HTMLButtonElement>('[aria-label="Retour aux discussions"]');
  assert.ok(back);
  await act(async () => { back!.click(); await new Promise(resolve => setTimeout(resolve, 30)); });
  assert.equal(container.querySelector("textarea"), null, "Back returns to the list");
  await act(async () => root.unmount());
  dom.window.close();
  console.log("Mobile inbox: supported channels, draft isolation, offline send guard, HTTP errors, request races and modal focus passed.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
