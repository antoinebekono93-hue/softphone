/**
 * Session/account-context freshness (INVARIANT D) + ownership source of truth.
 *
 * Exécution : npx tsx scripts/test-account-context.ts  (aucune DB requise)
 *
 * Two halves:
 *  - behavioural: the pure claim/redirect helpers of `lib/account-session.ts`
 *    across plan and organization transitions;
 *  - structural: the mutation and read sites that could still freeze a value in
 *    a cookie, a cached payload or an unfiltered query.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { accountSessionClaims, isBillingPath, requiresBillingRedirect } from "../lib/account-session";

const ROOT = join(__dirname, "..");
const read = (relative: string) => readFileSync(join(ROOT, relative), "utf8");
const actionsSrc = read("app/dashboard/numbers/actions.ts");
/** Comments document intent; they must not satisfy (or break) a code assertion. */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");

let checks = 0;
function ok(name: string, condition: boolean, detail?: string) {
  checks++;
  assert.ok(condition, `${name}${detail ? ` — ${detail}` : ""}`);
}

/** Brace-matches starting at the first `open` at or after `fromIndex`. */
function sliceBalanced(source: string, fromIndex: number, open: string, close: string): string {
  const index = source.indexOf(open, fromIndex);
  assert.ok(index !== -1, `opening ${open} not found at/after ${fromIndex}`);
  let depth = 0;
  for (let i = index; i < source.length; i++) {
    if (source[i] === open) depth++;
    else if (source[i] === close) {
      depth--;
      if (depth === 0) return source.slice(index, i + 1);
    }
  }
  throw new Error(`unbalanced ${open}/${close}`);
}

/** Body of an inline call: `pattern({ ... })` or `pattern: { ... }`. */
function sliceBetween(source: string, startPattern: RegExp, open: string, close: string): string {
  const start = source.search(startPattern);
  assert.ok(start !== -1, `pattern not found: ${startPattern}`);
  return sliceBalanced(source, start, open, close);
}

/** Body of a function whose signature ends with `) {`. */
function fnBody(source: string, signature: RegExp): string {
  const start = source.search(signature);
  assert.ok(start !== -1, `signature not found: ${signature}`);
  const parenClose = source.indexOf(")", start);
  assert.ok(parenClose !== -1, `parameter list not closed after ${signature}`);
  return sliceBalanced(source, parenClose, "{", "}");
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Mutable account state is re-read, not cached in the JWT (INVARIANT D)
// ═══════════════════════════════════════════════════════════════════════════
const authSrc = read("auth.ts");
const jwtCallback = fnBody(authSrc, /async jwt\(/);
{
  ok("jwt callback re-queries the database on EVERY session resolution", /prisma\.user\.findUnique/.test(jwtCallback));
  ok(
    "jwt callback is not gated on a fresh login (`if (user)` would freeze claims for 30 days)",
    !/if\s*\(\s*user\s*\)/.test(jwtCallback),
  );
  ok("jwt callback rebuilds claims from the DB row, never from the client payload", /accountSessionClaims\(dbUser\)/.test(jwtCallback));
  ok("a deleted user invalidates the session", /if\s*\(!dbUser\)\s*return null/.test(jwtCallback));
}

// Superadmin / impersonation surface must survive the refactor (audit §25).
{
  ok("auth.ts keeps the MOCK_AUTH production backdoor closed", /MOCK_AUTH === "true" && process\.env\.NODE_ENV !== "production"/.test(authSrc));
  ok("session still exposes isSuperAdmin", /session\.user\.isSuperAdmin = token\.isSuperAdmin/.test(authSrc));
  ok("session still exposes the identity id", /session\.user\.id = token\.id/.test(authSrc));
  ok("session still exposes role / organizationId / organizationName", /session\.user\.organizationId = token\.organizationId/.test(authSrc) && /session\.user\.role = token\.role/.test(authSrc));
  ok("session exposes plan and planStatus", /session\.user\.plan = token\.plan/.test(authSrc) && /session\.user\.planStatus = token\.planStatus/.test(authSrc));
  ok("auth.ts still exports handlers/signIn/signOut/auth", /export const \{ handlers, signIn, signOut, auth \}/.test(authSrc));
  ok("JWT signature strategy untouched (jwt, not database)", /strategy:\s*"jwt"/.test(authSrc));
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. The middleware stays light; the authoritative gate lives server side
// ═══════════════════════════════════════════════════════════════════════════
{
  const proxySrc = read("proxy.ts");
  ok("proxy.ts performs no database query (edge middleware stays light)", !/prisma/.test(proxySrc));
  ok("proxy.ts does not decide billing from a mutable JWT claim", !/planStatus/.test(proxySrc));
  ok("proxy.ts forwards the pathname for the server-side gate", /x-pathname/.test(proxySrc));

  const layoutSrc = read("app/dashboard/layout.tsx");
  ok("the dashboard layout enforces the billing gate from a fresh session", /requiresBillingRedirect\(pathname, session\.user\.planStatus\)/.test(layoutSrc));
  ok("the dashboard layout reads the pathname forwarded by the proxy", /headers\(\)/.test(layoutSrc));
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Behavioural: a plan change is visible immediately (no re-login)
// ═══════════════════════════════════════════════════════════════════════════
type AccountShape = Parameters<typeof accountSessionClaims>[0];
const account = (over: Partial<AccountShape> = {}): AccountShape => ({
  role: "AGENT",
  isSuperAdmin: false,
  organizationId: "org-a",
  organization: { name: "Org A", planStatus: "ACTIVE", pricingPlan: { name: "BASIC" } },
  ...over,
});

{
  const basic = accountSessionClaims(account());
  assert.equal(basic.plan, "BASIC");
  assert.equal(basic.organizationId, "org-a");

  // Upgrade without re-login.
  const business = accountSessionClaims(account({
    organization: { name: "Org A", planStatus: "ACTIVE", pricingPlan: { name: "BUSINESS" } },
  }));
  assert.equal(business.plan, "BUSINESS", "upgrade is reflected on the next session resolution");

  // Downgrade without re-login.
  const downgraded = accountSessionClaims(account({
    organization: { name: "Org A", planStatus: "ACTIVE", pricingPlan: { name: "BASIC" } },
  }));
  assert.equal(downgraded.plan, "BASIC", "downgrade is reflected on the next session resolution");

  // Plan removed: the claim must be cleared, never kept stale.
  const removed = accountSessionClaims(account({
    organization: { name: "Org A", planStatus: "UNPAID", pricingPlan: null },
  }));
  assert.equal(removed.plan, "", "a removed plan clears the claim instead of keeping the old one");
  assert.equal(removed.planStatus, "UNPAID");

  // Organization moved: the claim follows the DB.
  const moved = accountSessionClaims(account({
    organizationId: "org-b",
    organization: { name: "Org B", planStatus: "TRIALING", pricingPlan: { name: "PREMIUM" } },
  }));
  assert.equal(moved.organizationId, "org-b", "organization change is reflected without re-login");
  assert.equal(moved.organizationName, "Org B");
  assert.equal(moved.plan, "PREMIUM");

  // Membership removed entirely.
  const orphan = accountSessionClaims(account({ organizationId: null, organization: null }));
  assert.equal(orphan.organizationId, "", "a removed membership clears the tenant claim");
  assert.equal(orphan.planStatus, "");

  // isSuperAdmin comes from the DB boolean, never from a role string.
  const promoted = accountSessionClaims(account({ role: "AGENT", isSuperAdmin: true }));
  assert.equal(promoted.isSuperAdmin, true);
  const demoted = accountSessionClaims(account({ role: "ADMIN", isSuperAdmin: false }));
  assert.equal(demoted.isSuperAdmin, false, "a free-text role never grants superadmin");
}

// Billing gate takes effect immediately on a status change.
{
  assert.equal(requiresBillingRedirect("/dashboard/numbers", "ACTIVE"), false);
  assert.equal(requiresBillingRedirect("/dashboard/numbers", "TRIALING"), false);
  assert.equal(requiresBillingRedirect("/dashboard/numbers", "UNPAID"), true, "downgrade to UNPAID gates the dashboard at once");
  assert.equal(requiresBillingRedirect("/dashboard/numbers", "PAST_DUE"), true);
  assert.equal(requiresBillingRedirect("/dashboard/billing", "UNPAID"), false, "the billing page itself stays reachable");
  assert.equal(isBillingPath("/dashboard/settings/billing"), true);
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Ownership is never derived from a plan (INVARIANT B) and never cached
// ═══════════════════════════════════════════════════════════════════════════
{
  const getNumbersBody = fnBody(actionsSrc, /export async function getNumbers\(/);
  const whereClause = sliceBetween(getNumbersBody, /where:/, "{", "}");
  ok("getNumbers filters on the organization only", /^\{\s*organizationId\s*\}$/.test(whereClause.trim()));
  ok("getNumbers is not restricted to the numbers owned by the user", !/assignedUserId/.test(whereClause));
  ok("getNumbers is not restricted by status", !/status/.test(whereClause));
  ok("getNumbers does not filter on the plan", !/plan|pricing/i.test(whereClause));
  ok("getNumbers does not swallow a failed query into an empty list", !/catch[\s\S]{0,200}return \[\]/.test(getNumbersBody));
  ok("getNumbers selects no Prisma Decimal (RSC serialization boundary)", !/pricingPlan: true/.test(getNumbersBody));

  const numbersPage = read("app/dashboard/numbers/page.tsx");
  ok("the numbers page renders an explicit error instead of a fake empty inventory", /Impossible de charger vos numéros/.test(numbersPage));
  ok("the numbers page reads the current organization from the DB helper", /getCurrentAccountContext/.test(numbersPage));
}

// Caller-ID authority is the DB relation, on every read path.
{
  const contextSrc = read("lib/account-context.ts");
  const ownedHelper = fnBody(contextSrc, /export const getOwnedPhoneNumbers =/);
  ok("caller-ID list is scoped to the current user AND the tenant", /where:\s*\{\s*organizationId,\s*assignedUserId: userId,\s*status: "ACTIVE"\s*\}/.test(ownedHelper));
  ok("caller-ID list is not filtered by plan", !/pricingPlan|planStatus/.test(ownedHelper));

  const orgHelper = fnBody(contextSrc, /export const getOrganizationPhoneNumbers =/);
  ok("the tenant inventory is organization-scoped and plan-independent", /where:\s*\{\s*organizationId\s*\}/.test(orgHelper));
  ok("the tenant inventory is not narrowed to one user", !/assignedUserId/.test(orgHelper));

  const accountHelper = fnBody(contextSrc, /export const getCurrentAccountContext =/);
  ok("the account context is read from the database on every request", /prisma\.user\.findUnique/.test(accountHelper));
  ok("the account context is request-deduplicated, not per-call duplicated", /cache\(/.test(contextSrc));
  ok("the account context stays narrow (no phone numbers, no whole user row)", !/phoneNumber/.test(accountHelper));

  const callerIds = read("app/api/telecom/numbers/route.ts");
  ok("the caller-ID route delegates to the single authority helper", /getOwnedPhoneNumbers\(session\.user\.id, session\.user\.organizationId\)/.test(callerIds));
  ok("the caller-ID list is never cached", /no-store/.test(callerIds));

  const preauthorize = read("app/api/telnyx/preauthorize/route.ts");
  ok(
    "the call backend refuses a caller ID the user does not own",
    /assignedUserId: userId/.test(preauthorize) && /NO_ACTIVE_CALLER_NUMBER/.test(preauthorize),
  );

  const routing = read("app/api/phone-numbers/[id]/routing/route.ts");
  ok("routing ownership is checked against the tenant", /numberOrganizationId: phoneNumber\.organizationId/.test(routing));
  ok("routing updates never rewrite ownership", !/assignedUserId:/.test(sliceBetween(routing, /const updated = await prisma\.phoneNumber\.update\(/, "{", "}")));

  const updateNumber = sliceBetween(actionsSrc, /export async function updateNumber\(/, "{", "}");
  const updateWrite = sliceBetween(updateNumber, /await prisma\.phoneNumber\.update\(/, "{", "}");
  ok("updateNumber never rewrites organizationId, number, status or telnyxId", !/organizationId|status:|telnyxId|(^|[^a-zA-Z])number:/.test(updateWrite));
  ok("updateNumber rejects a cross-tenant assignee", /assignedUserId && !assignee/.test(updateNumber));
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Provider events are partial updates only (INVARIANT E, audit §9)
// ═══════════════════════════════════════════════════════════════════════════
{
  const purchaseSrc = read("lib/telnyx-number-purchase.ts");

  const activation = fnBody(purchaseSrc, /export async function activateFulfilledTelnyxOrder/);
  const activationUpsert = sliceBetween(activation, /await prisma\.phoneNumber\.upsert\(/, "{", "}");
  const activationUpdate = sliceBetween(activationUpsert, /update:\s*\{/, "{", "}");
  ok("the activation webhook writes the status", /status: "ACTIVE"/.test(activationUpdate));
  ok("the activation webhook never rewrites organizationId", !/organizationId/.test(activationUpdate));
  ok("the activation webhook never rewrites assignedUserId", !/assignedUserId/.test(activationUpdate));
  ok("the activation webhook never rewrites the number identity", !/\bnumber:/.test(activationUpdate));
  ok("the activation webhook only creates a row when it does not exist yet", /create:\s*\{/.test(activationUpsert) && /organizationId: ownership\.organizationId/.test(activationUpsert));
  ok("a late activation conflict is logged instead of silently applied", /Ownership conflict on late activation/.test(purchaseSrc));

  const purchaseUpdate = sliceBetween(
    sliceBetween(purchaseSrc, /await tx\.phoneNumber\.upsert\(/, "{", "}"),
    /update:\s*\{/,
    "{",
    "}",
  );
  ok("a purchase never rewrites an existing assignee", !/assignedUserId/.test(purchaseUpdate));
  ok("a purchase never moves an existing row to another tenant", !/organizationId/.test(purchaseUpdate));
  ok("a purchase assigns the buyer on creation", /assignedUserId: options\.assignedUserId \?\? null/.test(purchaseSrc));

  const syncSrc = read("app/api/admin/telnyx/numbers/sync/route.ts");
  const syncUpdate = sliceBetween(syncSrc, /await tx\.phoneNumber\.upsert\(/, "{", "}");
  ok("the admin sync preserves the organization of existing rows", !/organizationId/.test(sliceBetween(syncUpdate, /update:\s*\{/, "{", "}")));
  ok("the admin sync preserves the assignee of existing rows", !/assignedUserId/.test(sliceBetween(syncUpdate, /update:\s*\{/, "{", "}")));

  const webhookSrc = read("app/api/webhooks/telecom/route.ts");
  ok("the number-order handler still calls the guarded activation helper", /activateFulfilledTelnyxOrder\(orderId\)/.test(webhookSrc));
  ok("the webhook claims each event id for idempotence", /prisma\.webhookEvent\.create\(\{/.test(webhookSrc));
  const numberOrderWrite = sliceBetween(webhookSrc, /await prisma\.numberOrder\.updateMany\(\{/, "{", "}");
  ok("the order-status webhook only writes the order status", /status:/.test(numberOrderWrite) && !/assignedUserId/.test(numberOrderWrite));
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. God Mode is an explicit, guarded, compare-and-set modification
// ═══════════════════════════════════════════════════════════════════════════
{
  const assignSrc = read("app/api/admin/telnyx/numbers/assign/route.ts");
  ok("assignment still requires a super admin", /requireSuperAdminApi\(\)/.test(assignSrc));
  ok("the assignee must belong to the target organization", /resolveNumberAssignee\(organization\.users/.test(assignSrc));
  ok("the write is a compare-and-set, not a blind update", /updateMany\(\{[\s\S]*where:\s*\{\s*id: numberId,[\s\S]*organizationId: number\.organizationId,[\s\S]*assignedUserId: number\.assignedUserId/.test(assignSrc));
  ok("a lost race returns 409 instead of overwriting", /status: 409/.test(assignSrc));
  ok("both number inventories are invalidated", /revalidatePath\("\/dashboard\/numbers"\)/.test(assignSrc) && /revalidatePath\("\/god-mode\/numbers"\)/.test(assignSrc));
  ok("the response reports the effective owner", /assignedUserId: assignee/.test(assignSrc));

  const godModeClient = read("app/god-mode/numbers/NumbersClient.tsx");
  ok("God Mode mirrors the server payload instead of freezing the first render", /useSyncedState/.test(godModeClient));
  ok("God Mode offers an explicit user selector", /Utilisateur attribué à/.test(godModeClient));
  ok("God Mode surfaces unassigned numbers instead of guessing an owner", /Non attribué/.test(godModeClient));
  ok("God Mode offers an attribution filter", /attributionFilter/.test(godModeClient));
  ok("God Mode refreshes the server tree after a purchase", /router\.refresh\(\)/.test(godModeClient));
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. Lists re-derive from props; mutations invalidate their views (§10, §11)
// ═══════════════════════════════════════════════════════════════════════════
{
  const hook = read("lib/use-synced-state.ts");
  ok("the shared sync hook re-derives on every prop identity change", /useEffect\(\(\) => \{\s*setLocal\(value\);\s*\}, \[value\]\)/.test(hook));

  for (const client of ["app/dashboard/numbers/NumbersClient.tsx", "app/god-mode/numbers/NumbersClient.tsx"]) {
    const src = read(client);
    ok(`${client}: list state follows the server props`, /useSyncedState/.test(src));
    ok(`${client}: no frozen \`useState(initial…)\` seeding left`, !/useState\(\s*initial|useState\(\s*existingNumbers/.test(src));
  }

  const dashboardClient = read("app/dashboard/numbers/NumbersClient.tsx");
  ok("the dashboard numbers view refreshes after a mutation", /router\.refresh\(\)/.test(dashboardClient));

  const routingSrc = read("app/api/phone-numbers/[id]/routing/route.ts");
  ok("a routing/voicemail change invalidates the numbers pages", /revalidatePath\("\/dashboard\/numbers"\)/.test(routingSrc));

  const buyRoute = read("app/api/telecom/numbers/buy/route.ts");
  ok("a purchase invalidates the numbers pages", /revalidatePath\("\/dashboard\/numbers"\)/.test(buyRoute));
  ok("a purchase assigns the buyer", /assignedUserId: account\.userId/.test(buyRoute));
  ok("a purchase reads the CURRENT organization from the database", /getCurrentAccountContext/.test(buyRoute));

  const softphone = read("components/softphone/Softphone.tsx");
  ok("the softphone re-reads its caller IDs without a page reload", /refreshNumbers/.test(softphone) && /no-store/.test(softphone));
  ok("the softphone keeps a still-valid selection instead of snapping back to the first entry", /data\.data\.some/.test(softphone));
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. Legacy purchase paths no longer write the PhoneNumber row directly
// ═══════════════════════════════════════════════════════════════════════════
{
  for (const file of ["app/dashboard/numbers/actions.ts", "app/onboarding/number/actions.ts"]) {
    const src = code(read(file));
    ok(`${file}: no direct phoneNumber.create (ownership is written by the single purchase path)`, !/prisma\.phoneNumber\.create\(/.test(src));
    ok(`${file}: delegates to purchaseTelnyxNumber`, /purchaseTelnyxNumber\(/.test(src));
    ok(`${file}: never fabricates a telnyxId`, !/pending_/.test(src));
  }
  const onboarding = code(read("app/onboarding/number/actions.ts"));
  ok("onboarding search is not an anonymous server action", /if \(!session\?\.user\?\.id\) return \{ error: "Unauthorized" \}/.test(onboarding));

  const adminBuy = code(read("app/api/admin/telnyx/numbers/buy/route.ts"));
  ok("an admin purchase cannot assign a foreign-tenant user", /assignedUserId must belong to organizationId/.test(adminBuy));
}

console.log(`PASS: ${checks} session / ownership source-of-truth checks`);
console.log("      (plan + organization freshness, proxy weight, webhook partial");
console.log("       updates, God Mode guards, list sync, purchase paths)");