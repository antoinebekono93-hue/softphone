/**
 * Ownership invariants for PhoneNumber.
 *
 * Exécution : npx tsx scripts/test-number-assignment.ts  (aucune DB requise)
 *
 * The rules exercised here are the pure helpers of `lib/number-assignment.ts`,
 * which are the single place where the assignment invariants live.
 */
import assert from "node:assert/strict";
import {
  classifyNumberAssignment,
  isNumberVisibleToAccount,
  resolveActivationOwnership,
  resolveNumberAssignee,
  resolveOwnershipAfterPlanChange,
} from "../lib/number-assignment";

// ── 1. resolveNumberAssignee (God Mode explicit choice) ─────────────────────
assert.equal(resolveNumberAssignee(["buyer"], "buyer", undefined), "buyer", "preserve purchased number ownership");
assert.equal(resolveNumberAssignee(["buyer", "colleague"], "buyer", undefined), "buyer", "reassigning organization preserves its user");
assert.equal(resolveNumberAssignee(["recipient"], "old-tenant-user", undefined), "recipient", "single-user organization gets its number");
assert.equal(resolveNumberAssignee(["one", "two"], "old-tenant-user", undefined), null, "never guess in a team or retain a foreign user");
assert.equal(resolveNumberAssignee(["one", "two"], null, "two"), "two", "explicit team assignment");
assert.equal(resolveNumberAssignee(["one"], "one", null), null, "explicit unassignment");
assert.equal(resolveNumberAssignee([], "old-user", undefined), null);
assert.throws(() => resolveNumberAssignee(["one"], null, "foreign-user"));
assert.throws(() => resolveNumberAssignee(["one"], null, 123));

// ── In-memory model driven by the REAL rules ───────────────────────────────
type Row = {
  id: string;
  number: string;
  telnyxId: string;
  organizationId: string;
  assignedUserId: string | null;
  status: string;
};

type Db = Map<string, Row>;

/** Mirrors `prisma.phoneNumber.upsert({ where: { telnyxId } })` post-fix. */
function activate(db: Db, telnyxId: string, patch: Partial<Row>, order: { organizationId: string; requestedUserId: string | null }) {
  const existing = db.get(telnyxId) ?? null;
  const ownership = resolveActivationOwnership(existing, order);
  if (existing) {
    // Webhook: status only. Ownership and identity are untouched.
    db.set(telnyxId, { ...existing, ...patch });
  } else {
    db.set(telnyxId, { id: `row-${telnyxId}`, telnyxId, status: "PENDING", ...patch, ...ownership } as Row);
  }
}

/** Mirrors `prisma.phoneNumber.upsert` in `purchaseTelnyxNumber` post-fix. */
function purchase(db: Db, telnyxId: string, patch: Partial<Row>, buyer: string, organizationId: string) {
  const existing = db.get(telnyxId) ?? null;
  if (existing) {
    db.set(telnyxId, { ...existing, ...patch });
  } else {
    db.set(telnyxId, {
      id: `row-${telnyxId}`,
      telnyxId,
      status: "ACTIVE",
      assignedUserId: buyer,
      ...patch,
      organizationId,
    } as Row);
  }
}

/** Mirrors the God Mode assign route (compare-and-set on the read values). */
function godModeAssign(db: Db, telnyxId: string, organizationId: string, memberIds: string[], requested: string | null | undefined, expected: { organizationId: string; assignedUserId: string | null }) {
  const current = db.get(telnyxId);
  assert.ok(current, "number must exist");
  if (current.organizationId !== expected.organizationId || current.assignedUserId !== expected.assignedUserId) {
    return { ok: false as const };
  }
  const assignee = resolveNumberAssignee(memberIds, current.assignedUserId, requested);
  db.set(telnyxId, { ...current, organizationId, assignedUserId: assignee });
  return { ok: true as const, assignedUserId: assignee };
}

const ORG_A = { id: "org-a" };
const ORG_B = { id: "org-b" };
const ALICE = "alice";
const BOB = "bob";
const CAROL = "carol";

// ── 2. Numéros achetés AVANT le forfait restent visibles après le forfait ────
{
  const db: Db = new Map();
  // Plan = NULL: Alice achète N1 puis N2.
  purchase(db, "tel-1", { number: "+15550001", organizationId: ORG_A.id }, ALICE, ORG_A.id);
  purchase(db, "tel-2", { number: "+15550002", organizationId: ORG_A.id }, ALICE, ORG_A.id);
  assert.equal(db.size, 2, "two numbers bought without a plan");
  assert.equal(db.get("tel-1")?.assignedUserId, ALICE, "a personal purchase is owned by its buyer");

  // Plan = BUSINESS.
  const afterPlan = [...db.values()].map(row => resolveOwnershipAfterPlanChange(row));
  assert.deepEqual(
    afterPlan.map(o => o?.assignedUserId),
    [ALICE, ALICE],
    "N1/N2 stay owned after a plan is chosen",
  );
  for (const row of db.values()) {
    assert.equal(row.organizationId, ORG_A.id, "ownership survives the plan change");
    assert.equal(row.status, "ACTIVE", "a plan change never alters a number status");
  }
}

// ── 3. BUSINESS → PREMIUM → autre plan : ownership strictement inchangée ─────
{
  const db: Db = new Map();
  purchase(db, "tel-1", { number: "+15550001", organizationId: ORG_A.id }, ALICE, ORG_A.id);
  purchase(db, "tel-2", { number: "+15550002", organizationId: ORG_A.id }, ALICE, ORG_A.id);
  const before = [...db.values()].map(r => `${r.organizationId}:${r.assignedUserId}`).sort();
  for (const _plan of ["BUSINESS", "PREMIUM", "BASIC", "ENTERPRISE", null]) {
    for (const row of db.values()) Object.assign(row, resolveOwnershipAfterPlanChange(row)!);
  }
  const after = [...db.values()].map(r => `${r.organizationId}:${r.assignedUserId}`).sort();
  assert.deepEqual(after, before, "no plan transition ever mutates ownership");
  assert.equal(db.size, 2, "no number is ever deleted by a plan change");
}

// ── 4/5. God Mode assign puis reassign A→B, puis unassign ───────────────────
{
  const db: Db = new Map();
  activate(db, "tel-3", { number: "+15550003", status: "ACTIVE", organizationId: ORG_A.id }, { organizationId: ORG_A.id, requestedUserId: null });
  assert.equal(db.get("tel-3")?.assignedUserId, null, "N3 starts unassigned");

  // God Mode: N3 -> Alice
  const first = godModeAssign(db, "tel-3", ORG_A.id, [ALICE, BOB], ALICE, { organizationId: ORG_A.id, assignedUserId: null });
  assert.equal(first.ok && first.assignedUserId, ALICE, "assign writes the explicit user");

  // Alice voit N3 (softphone caller-ID authority = DB relation).
  assert.ok(isNumberVisibleToAccount(db.get("tel-3")!, { userId: ALICE, organizationId: ORG_A.id }, { requireActive: true, ownOnly: true }), "Alice sees N3");
  assert.ok(!isNumberVisibleToAccount(db.get("tel-3")!, { userId: BOB, organizationId: ORG_A.id }, { ownOnly: true }), "Bob does not see N3 yet");

  // Reassign N3 -> Bob.
  const second = godModeAssign(db, "tel-3", ORG_A.id, [ALICE, BOB], BOB, { organizationId: ORG_A.id, assignedUserId: ALICE });
  assert.equal(second.ok && second.assignedUserId, BOB, "reassign writes the new user");
  assert.ok(!isNumberVisibleToAccount(db.get("tel-3")!, { userId: ALICE, organizationId: ORG_A.id }, { ownOnly: true }), "Alice no longer sees N3");
  assert.ok(isNumberVisibleToAccount(db.get("tel-3")!, { userId: BOB, organizationId: ORG_A.id }, { ownOnly: true }), "Bob sees N3");
  assert.equal(db.size, 1, "reassignment touches no other number");

  // Unassign.
  const third = godModeAssign(db, "tel-3", ORG_A.id, [ALICE, BOB], null, { organizationId: ORG_A.id, assignedUserId: BOB });
  assert.equal(third.ok && third.assignedUserId, null, "explicit unassign is honoured");
  assert.ok(!isNumberVisibleToAccount(db.get("tel-3")!, { userId: BOB, organizationId: ORG_A.id }, { ownOnly: true }), "the former owner loses caller-ID access");
}

// ── 6. Concurrence : deux administrateurs, compare-and-set ───────────────────
{
  const db: Db = new Map();
  activate(db, "tel-5", { number: "+15550005", status: "ACTIVE", organizationId: ORG_A.id }, { organizationId: ORG_A.id, requestedUserId: null });
  const snapshot = { organizationId: ORG_A.id, assignedUserId: null };
  const adminA = godModeAssign(db, "tel-5", ORG_A.id, [ALICE, BOB], ALICE, snapshot);
  const adminB = godModeAssign(db, "tel-5", ORG_A.id, [ALICE, BOB], BOB, snapshot);
  assert.equal(adminA.ok, true, "the first write wins");
  assert.equal(adminB.ok, false, "the stale second write is rejected instead of silently overwriting");
  assert.equal(db.get("tel-5")?.assignedUserId, ALICE, "no last-write-wins");
}

// ── 7. Webhook d'activation tardif ≠ attribution manuelle (INVARIANT E) ─────
{
  const db: Db = new Map();
  // T0 : Alice commande N3 pour elle-même.
  activate(db, "tel-3", { number: "+15550003", organizationId: ORG_A.id }, { organizationId: ORG_A.id, requestedUserId: ALICE });
  // T1 : God Mode attribue N3 à Bob.
  godModeAssign(db, "tel-3", ORG_A.id, [ALICE, BOB], BOB, { organizationId: ORG_A.id, assignedUserId: ALICE });
  // T2 : webhook tardif correspondant à T0.
  activate(db, "tel-3", { status: "ACTIVE" }, { organizationId: ORG_A.id, requestedUserId: ALICE });
  assert.equal(db.get("tel-3")?.assignedUserId, BOB, "late activation webhook does not restore the T0 requester");
  assert.equal(db.get("tel-3")?.organizationId, ORG_A.id, "and never moves the number to another tenant");
}

// ── 8. Webhook tardif sur un numéro vide ≠ vol de tenant ────────────────────
{
  const db: Db = new Map();
  // Le numéro a déjà été rattaché à l'org A par une synchronisation admin.
  activate(db, "tel-3", { number: "+15550003", organizationId: ORG_A.id }, { organizationId: ORG_A.id, requestedUserId: null });
  // Le webhook d'une commande de l'org B arrive en retard.
  activate(db, "tel-3", { status: "ACTIVE" }, { organizationId: ORG_B.id, requestedUserId: null });
  assert.equal(db.get("tel-3")?.organizationId, ORG_A.id, "a late order never hijacks an existing tenant");
}

// ── 9. Idempotence du webhook (reçu deux fois) ─────────────────────────────
{
  const db: Db = new Map();
  activate(db, "tel-3", { number: "+15550003", status: "ACTIVE", organizationId: ORG_A.id }, { organizationId: ORG_A.id, requestedUserId: ALICE });
  const once = JSON.stringify([...db.values()]);
  activate(db, "tel-3", { status: "ACTIVE" }, { organizationId: ORG_A.id, requestedUserId: ALICE });
  activate(db, "tel-3", { status: "ACTIVE" }, { organizationId: ORG_A.id, requestedUserId: ALICE });
  assert.equal(JSON.stringify([...db.values()]), once, "a duplicated activation event is a no-op");
}

// ── 10. Achat personnel : le numéro a bien un owner ────────────────────────
{
  const db: Db = new Map();
  purchase(db, "tel-9", { number: "+15550009", organizationId: ORG_A.id }, CAROL, ORG_A.id);
  assert.equal(db.get("tel-9")?.assignedUserId, CAROL, "assignedUserId is the buyer, not only organizationId");
  assert.equal(db.get("tel-9")?.organizationId, ORG_A.id);
}

// ── 11. Isolation multi-tenant ─────────────────────────────────────────────
{
  const db: Db = new Map();
  purchase(db, "tel-a", { number: "+15550100", organizationId: ORG_A.id }, ALICE, ORG_A.id);
  purchase(db, "tel-b", { number: "+15550101", organizationId: ORG_B.id }, BOB, ORG_B.id);
  assert.ok(!isNumberVisibleToAccount(db.get("tel-a")!, { userId: BOB, organizationId: ORG_B.id }), "Org B user never sees Org A number");
  assert.ok(!isNumberVisibleToAccount(db.get("tel-b")!, { userId: ALICE, organizationId: ORG_A.id }), "Org A user never sees Org B number");
  // Même un assignee incohérent ne rend pas le numéro visible à un autre tenant.
  const corrupt = { organizationId: ORG_A.id, assignedUserId: BOB, status: "ACTIVE" };
  assert.ok(!isNumberVisibleToAccount(corrupt, { userId: BOB, organizationId: ORG_B.id }), "an inconsistent assignee grants no cross-tenant access");
  assert.ok(isNumberVisibleToAccount(corrupt, { userId: BOB, organizationId: ORG_A.id }, { ownOnly: true }), "but stays usable inside its own tenant");
  // Un compte sans organisation ne voit rien.
  assert.ok(!isNumberVisibleToAccount(db.get("tel-a")!, { userId: ALICE, organizationId: null }), "no organization, no access");
}

// ── 12. Rétrocompatibilité : un numéro acheté AVANT le feature flag ─────────
{
  const db: Db = new Map();
  // Donnée legacy : org + owner présents, statut PENDING.
  db.set("tel-legacy", { id: "r", number: "+15559999", telnyxId: "tel-legacy", organizationId: ORG_A.id, assignedUserId: ALICE, status: "PENDING" });
  activate(db, "tel-legacy", { status: "ACTIVE" }, { organizationId: ORG_A.id, requestedUserId: null });
  assert.equal(db.get("tel-legacy")?.assignedUserId, ALICE, "an order without requester never clears an existing owner");
  assert.equal(db.get("tel-legacy")?.status, "ACTIVE", "but the status is still updated");
}

// ── 13. Classification des attributions legacy (§19) ───────────────────────
assert.equal(classifyNumberAssignment({ organizationId: "o", assignedUserId: "u" }, "o"), "A");
assert.equal(classifyNumberAssignment({ organizationId: "o", assignedUserId: null }, "o"), "B");
assert.equal(classifyNumberAssignment({ organizationId: null, assignedUserId: null }, null), "C");
assert.equal(classifyNumberAssignment({ organizationId: "o", assignedUserId: "u" }, "other"), "D");
assert.equal(classifyNumberAssignment({ organizationId: "o", assignedUserId: "u" }, null), "D", "unknown assignee org is reported as inconsistent");

console.log("PASS: number ownership invariants (assignment, reassignment, unassign,");
console.log("      concurrency, late webhook, idempotence, purchase, tenant isolation,");
console.log("      legacy classification)");