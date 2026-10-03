/**
 * List source-of-truth: a Server Component refresh must reach the screen.
 *
 * Exécution : npx tsx scripts/test-numbers-list-sync.tsx
 *
 * Reproduces the exact bug family « la DB est correcte mais l'utilisateur voit
 * une ancienne valeur » at the React level: both numbers lists seed their state
 * from a Server Component prop. `router.refresh()` delivers a NEW array
 * identity; a component doing `useState(initialNumbers)` keeps rendering the
 * first payload forever. Both lists now go through `useSyncedState`, and this
 * test renders that hook for real.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { JSDOM } from "jsdom";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { useState } from "react";
import { useSyncedState } from "../lib/use-synced-state";

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
g.MouseEvent = dom.window.MouseEvent;
g.getComputedStyle = dom.window.getComputedStyle;
g.requestAnimationFrame = (cb: any) => setTimeout(cb, 0);
g.cancelAnimationFrame = (id: any) => clearTimeout(id);
g.IS_REACT_ACT_ENVIRONMENT = true;

type NumberRow = { id: string; number: string; assignedUserId: string | null };

function NumbersList({ rows }: { rows: NumberRow[] }) {
  const [numbers, setNumbers] = useSyncedState<NumberRow[]>(rows);
  return (
    <div>
      <ul data-testid="numbers">
        {numbers.map(row => (
          <li key={row.id}>{`${row.number} → ${row.assignedUserId ?? "unassigned"}`}</li>
        ))}
      </ul>
      <button data-testid="local-edit" onClick={() => setNumbers(current => current.map(row => ({ ...row, number: "+19990000" })))}>
        edit
      </button>
    </div>
  );
}

/** Contrôle négatif: l'ancien `useState(initialProps)`, bogue à l'état. */
function FrozenList({ rows }: { rows: NumberRow[] }) {
  const [numbers] = useState<NumberRow[]>(rows);
  return (
    <ul data-testid="frozen">
      {numbers.map(row => (
        <li key={row.id}>{`${row.number} → ${row.assignedUserId ?? "unassigned"}`}</li>
      ))}
    </ul>
  );
}

let failures = 0;
function expect(label: string, expected: string, actual: string) {
  const ok = expected === actual;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: attendu="${expected}" obtenu="${actual}"`);
}

function render() {
  const container = document.getElementById("root")!;
  return container.querySelector('[data-testid="numbers"]')!.textContent ?? "";
}

async function main() {
  const container = document.getElementById("root")!;
  const root = createRoot(container);

  // T0 — the user owns N1 and N2, bought before any plan was chosen.
  const initial: NumberRow[] = [
    { id: "n1", number: "+15550001", assignedUserId: "alice" },
    { id: "n2", number: "+15550002", assignedUserId: "alice" },
  ];
  await act(async () => { root.render(<NumbersList rows={initial} />); });
  expect("1. rendu initial (2 numéros)", "+15550001 → alice+15550002 → alice", render());

  // T1 — a plan is chosen, the Server Component re-queries and re-renders with a
  // NEW array carrying the same content: the list must not flicker or duplicate.
  await act(async () => { root.render(<NumbersList rows={[...initial]} />); });
  expect("2. refresh sans changement de données", "+15550001 → alice+15550002 → alice", render());

  // T2 — God Mode assigns N3 to Bob: the refresh must make it appear immediately.
  const afterAssign: NumberRow[] = [
    { id: "n1", number: "+15550001", assignedUserId: "alice" },
    { id: "n2", number: "+15550002", assignedUserId: "alice" },
    { id: "n3", number: "+15550003", assignedUserId: "bob" },
  ];
  await act(async () => { root.render(<NumbersList rows={afterAssign} />); });
  expect(
    "3. numéro attribué en God Mode visible sans rechargement",
    "+15550001 → alice+15550002 → alice+15550003 → bob",
    render(),
  );

  // T3 — reassignment N3 : Bob → Carol.
  const afterReassign: NumberRow[] = afterAssign.map(row => (row.id === "n3" ? { ...row, assignedUserId: "carol" } : row));
  await act(async () => { root.render(<NumbersList rows={afterReassign} />); });
  expect(
    "4. réaffectation N3 visible (Bob → Carol)",
    "+15550001 → alice+15550002 → alice+15550003 → carol",
    render(),
  );

  // T4 — unassign N3.
  const afterUnassign: NumberRow[] = afterReassign.map(row => (row.id === "n3" ? { ...row, assignedUserId: null } : row));
  await act(async () => { root.render(<NumbersList rows={afterUnassign} />); });
  expect(
    "5. désattribution N3 visible",
    "+15550001 → alice+15550002 → alice+15550003 → unassigned",
    render(),
  );

  // T5 — a local optimistic edit still works and is not fought by the hook.
  const button = container.querySelector('[data-testid="local-edit"]') as HTMLElement;
  await act(async () => { button.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); });
  expect(
    "6. édition locale optimiste conservée",
    "+19990000 → alice+19990000 → alice+19990000 → unassigned",
    render(),
  );

  // T6 — the next server refresh still wins over the local copy.
  await act(async () => { root.render(<NumbersList rows={afterReassign} />); });
  expect(
    "7. le refresh serveur prime sur l’édition locale",
    "+15550001 → alice+15550002 → alice+15550003 → carol",
    render(),
  );

  // T7 — a number deleted server-side disappears from the list.
  await act(async () => { root.render(<NumbersList rows={[afterReassign[0]]} />); });
  expect("8. suppression serveur répercutée", "+15550001 → alice", render());

  // T8 — negative control: the pre-fix pattern must stay frozen, proving the
  // test above actually detects the bug instead of passing vacuously.
  const controlContainer = document.createElement("div");
  document.body.appendChild(controlContainer);
  const controlRoot = createRoot(controlContainer);
  await act(async () => { controlRoot.render(<FrozenList rows={initial} />); });
  await act(async () => { controlRoot.render(<FrozenList rows={afterAssign} />); });
  expect(
    "9. contrôle négatif: useState(initialProps) reste figé (bug d'origine)",
    "+15550001 → alice+15550002 → alice",
    controlContainer.querySelector('[data-testid="frozen"]')!.textContent ?? "",
  );

  console.log("");
  console.log(failures === 0 ? "PASS: liste React alignée sur les props serveur" : `${failures} ÉCHEC(S)`);
  await act(async () => { root.unmount(); });
  await act(async () => { controlRoot.unmount(); });
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});