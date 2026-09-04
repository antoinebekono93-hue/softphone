/**
 * Tests de la logique PURE de routage centralisé (lib/call-routing.ts).
 * Exécution : npx tsx scripts/test-call-routing.ts
 *
 * Couvre : classifyCandidates (APP_TO_APP / APP_TO_PSTN / erreurs), normalizeE164,
 * et resolveCallDestination (avec lookupUser injecté, sans DB).
 */

import {
  classifyCandidates,
  normalizeE164,
  resolveCallDestination,
  ResolvedUser,
} from "../lib/call-routing";

const user = (over: Partial<ResolvedUser> = {}): ResolvedUser => ({
  id: "u1",
  name: "Alice",
  email: "alice@x.io",
  callUsername: "alice",
  callExtension: "100",
  isCallable: true,
  organizationId: "org1",
  ...over,
});

let failures = 0;
const check = (name: string, cond: boolean, extra?: unknown) => {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}`);
    if (extra !== undefined) console.log(`  ${JSON.stringify(extra)}`);
  }
};

// ── classifyCandidates ──────────────────────────────────────────────────────
check(
  "cible vide → EMPTY_TARGET",
  classifyCandidates({ target: "  ", callerId: "u1", candidates: [] }).type ===
    "ERROR" &&
    (classifyCandidates({ target: "  ", callerId: "u1", candidates: [] }) as any)
      .reason === "EMPTY_TARGET"
);

check(
  "soi-même → SELF_CALL",
  (classifyCandidates({
    target: "alice",
    callerId: "u1",
    candidates: [user()],
  }) as any).reason === "SELF_CALL"
);

check(
  "candidat non joignable → TARGET_NOT_CALLABLE",
  (classifyCandidates({
    target: "bob",
    callerId: "u1",
    candidates: [user({ id: "u2", callUsername: "bob", isCallable: false })],
  }) as any).reason === "TARGET_NOT_CALLABLE"
);

const appToApp = classifyCandidates({
  target: "alice",
  callerId: "u3",
  candidates: [user()],
});
check(
  "candidat joignable → APP_TO_APP",
  appToApp.type === "APP_TO_APP" && appToApp.targetUserId === "u1"
);

const pstn = classifyCandidates({
  target: "+33123456789",
  callerId: "u3",
  candidates: [],
});
check(
  "aucun candidat → APP_TO_PSTN destination E.164",
  pstn.type === "APP_TO_PSTN" &&
    (pstn as { destination: string }).destination === "+33123456789"
);

// ── normalizeE164 ───────────────────────────────────────────────────────────
check("E.164 déjà normalisé", normalizeE164("+3312345678") === "+3312345678");
check("10 chiffres US → +1", normalizeE164("4155551234") === "+14155551234");
check(">10 chiffres sans + → préfixe +", normalizeE164("331234567890") === "+331234567890");
check("garde seulement chiffres/plus", normalizeE164("(415) 555-1234") === "+14155551234");

// ── resolveCallDestination (lookup injecté) ─────────────────────────────────
async function main() {
  const route1 = await resolveCallDestination({
  callerId: "u9",
  organizationId: "org1",
  target: "alice",
  lookupUser: async () => [user()],
});
check(
  "resolve : username d'un collègue → APP_TO_APP",
  route1.type === "APP_TO_APP" && route1.targetUserId === "u1"
);

const route2 = await resolveCallDestination({
  callerId: "u9",
  organizationId: "org1",
  target: "jane",
  lookupUser: async () => [],
});
check(
  "resolve : cible externe → APP_TO_PSTN",
  route2.type === "APP_TO_PSTN"
);

const route3 = await resolveCallDestination({
  callerId: "u9",
  organizationId: "org1",
  target: "",
  lookupUser: async () => [],
});
check("resolve : cible vide → EMPTY_TARGET", route3.type === "ERROR");

const route4 = await resolveCallDestination({
  callerId: "",
  organizationId: "",
  target: "x",
  lookupUser: async () => [],
});
check("resolve : pas d'auth → UNAUTHORIZED", route4.type === "ERROR");

  console.log("");
  console.log(
    failures === 0
      ? "TOUS LES TESTS PASSENT"
      : `${failures} TEST(S) EN ÉCHEC`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
