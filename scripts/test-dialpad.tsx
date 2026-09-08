/**
 * Test ciblé du Dialpad (double-dispatch / chiffre dupliqué).
 * Exécution : npx tsx scripts/test-dialpad.tsx
 *
 * Contrat : un geste physique (clic souris, tap tactile, touche clavier)
 * doit produire UNE seule mutation du numéro composé. Un double geste
 * volontaire (deux taps) doit produire deux chiffres.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { JSDOM } from "jsdom";
import { createRoot } from "react-dom/client";
import { Dialpad } from "../components/softphone/Dialpad";

const dom = new JSDOM("<!DOCTYPE html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});

const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
try {
  g.navigator = dom.window.navigator;
} catch {
  Object.defineProperty(g, "navigator", { value: dom.window.navigator, configurable: true, writable: true });
}
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.MouseEvent = dom.window.MouseEvent;
g.getComputedStyle = dom.window.getComputedStyle;
g.requestAnimationFrame = (cb: any) => setTimeout(cb, 0);
g.cancelAnimationFrame = (id: any) => clearTimeout(id);

if (!g.PointerEvent) {
  class PointerEventPolyfill extends dom.window.Event {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly button: number;
    readonly buttons: number;
    readonly isPrimary: boolean;
    constructor(type: string, init: any = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? "mouse";
      this.button = init.button ?? 0;
      this.buttons = init.buttons ?? 0;
      this.isPrimary = init.isPrimary ?? true;
    }
  }
  g.PointerEvent = PointerEventPolyfill;
  dom.window.PointerEvent = PointerEventPolyfill as any;
}

function tick(ms = 25) {
  return new Promise((r) => setTimeout(r, ms));
}

let failures = 0;
function expect(label: string, expected: string, actual: string) {
  const ok = expected === actual;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: attendu="${expected}" obtenu="${actual}"`);
}

async function main() {
  const container = document.getElementById("root")!;
  const root = createRoot(container);
  root.render(<Dialpad onCall={() => {}} />);
  await tick();

  const input = container.querySelector("input") as HTMLInputElement;
  const keyBtn = (digit: string): HTMLButtonElement => {
    const b = Array.from(container.querySelectorAll("button")).find((x) =>
      (x as HTMLButtonElement).textContent?.trim().startsWith(digit)
    );
    if (!b) throw new Error(`clé introuvable: ${digit}`);
    return b as HTMLButtonElement;
  };
  const backspaceBtn = () =>
    container.querySelector('button[aria-label="Backspace"]') as HTMLButtonElement | null;

  // Efface le numéro via le bouton backspace (chemin réel de l'UI).
  async function clearByBackspace() {
    for (let i = 0; i < 12 && backspaceBtn(); i++) {
      backspaceBtn()!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
      await tick();
    }
  }

  const ptr = (type: string, pointerType: string) =>
    new dom.window.PointerEvent(type, { bubbles: true, pointerType, button: 0, buttons: pointerType === "mouse" ? 1 : 0 });
  const click = () => new dom.window.MouseEvent("click", { bubbles: true });

  const tapMouse = (digit: string) => {
    const el = keyBtn(digit);
    el.dispatchEvent(ptr("pointerdown", "mouse"));
    el.dispatchEvent(ptr("pointerup", "mouse"));
    el.dispatchEvent(click());
  };
  const tapTouch = (digit: string) => {
    const el = keyBtn(digit);
    el.dispatchEvent(ptr("pointerdown", "touch"));
    el.dispatchEvent(ptr("pointerup", "touch"));
    el.dispatchEvent(click());
  };
  // Cas défectueux constaté sur écrans réels : un seul tap peut émettre DEUX pointerup.
  const tapTouchDuplicatePointerUp = (digit: string) => {
    const el = keyBtn(digit);
    el.dispatchEvent(ptr("pointerdown", "touch"));
    el.dispatchEvent(ptr("pointerup", "touch"));
    el.dispatchEvent(ptr("pointerup", "touch"));
    el.dispatchEvent(click());
  };
  const typeInto = (value: string) => {
    const setter = Object.getOwnPropertyDescriptor(g.HTMLInputElement.prototype, "value")!.set as ((v: string) => void);
    setter.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  };

  // 1. Un clic souris sur "9" -> "9"
  tapMouse("9");
  await tick();
  expect("1 clic souris 9", "9", input.value);

  // 2. Un tap tactile sur "9" -> "9"
  tapTouch("9");
  await tick();
  expect("1 tap tactile 9", "99", input.value);

  // 3. REGRESSION : un tap émettant deux pointerup -> UNE seule écriture
  await clearByBackspace();
  tapTouchDuplicatePointerUp("9");
  await tick();
  expect("1 tap tactile (2 pointerup émis)", "9", input.value);

  // 4. Un clic legacy (sans pointer events) -> UN appui via click
  await clearByBackspace();
  keyBtn("9").dispatchEvent(click());
  await tick();
  expect("1 clic legacy 9", "9", input.value);

  // 5. Saisie clavier physique : keydown "9" -> "9"
  await clearByBackspace();
  dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "9", bubbles: true }));
  await tick();
  expect("keydown clavier 9", "9", input.value);

  // 6. Frappe 1,2,3 dans le champ (clavier virtuel/collage) -> "123"
  await clearByBackspace();
  typeInto("1"); await tick();
  typeInto("12"); await tick();
  typeInto("123"); await tick();
  expect("saisie input 1,2,3", "123", input.value);

  // 7. Saisie rapide par touches clavier 1,2,3 -> "123"
  await clearByBackspace();
  dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "1", bubbles: true }));
  dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "2", bubbles: true }));
  dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "3", bubbles: true }));
  await tick();
  expect("saisie rapide clavier 123", "123", input.value);

  // 8. Backspace -> retire exactement 1 caractère
  await clearByBackspace();
  tapTouch("1"); tapTouch("2"); tapTouch("3");
  await tick();
  backspaceBtn()!.dispatchEvent(click());
  await tick();
  expect("backspace 1 caractère", "12", input.value);
  backspaceBtn()!.dispatchEvent(click());
  await tick();
  expect("backspace 2e caractère", "1", input.value);

  // 9. Double clic volontaire 99 -> "99" (99 et 1122 possibles)
  await clearByBackspace();
  tapTouch("9");
  tapTouch("9");
  await tick();
  expect("double tap 9 -> 99", "99", input.value);

  // 10. Touches * et #
  await clearByBackspace();
  tapTouch("*");
  tapMouse("#");
  await tick();
  expect("touches * et #", "*#", input.value);

  // 11. Appui bref sur "0" -> "0" (une seule fois)
  await clearByBackspace();
  tapTouch("0");
  await tick();
  expect("tap 0 -> 0", "0", input.value);

  // 12. Appui long sur "0" -> "+" puis relâcher -> aucun chiffre supplémentaire
  await clearByBackspace();
  const zero = keyBtn("0");
  zero.dispatchEvent(ptr("pointerdown", "touch"));
  await tick(600);
  zero.dispatchEvent(ptr("pointerup", "touch"));
  zero.dispatchEvent(click());
  await tick();
  expect("appui long 0 -> + (pas de 0)", "+", input.value);

  console.log(failures === 0 ? "\nTOUS LES TESTS PASSENT" : `\n${failures} TEST(S) EN ÉCHEC`);
  root.unmount();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});