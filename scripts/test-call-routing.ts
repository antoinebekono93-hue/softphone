/**
 * Tests purs du routage centralisé (lib/call-routing.ts).
 * Exécution : npx tsx scripts/test-call-routing.ts
 *
 * Aucun accès DB, Telnyx, wallet ou Pusher n'est effectué ici.
 */

import {
  classifyCandidates,
  normalizeE164,
  phoneNumberCandidates,
  resolveCallDestination,
  type PhoneNumberRouteRow,
  type ResolvedCallCandidate,
  type ResolvedUser,
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

const phone = (over: Partial<PhoneNumberRouteRow> = {}): PhoneNumberRouteRow => ({
  number: "+237612345678",
  status: "ACTIVE",
  organizationId: "org1",
  assignedUser: user({ id: "u2", name: "Bob", callUsername: "bob" }),
  ...over,
});

const phoneCandidate = (over: Partial<ResolvedCallCandidate> = {}): ResolvedCallCandidate => ({
  ...user({ id: "u2", name: "Bob", callUsername: "bob" }),
  matchSource: "PHONE",
  ...over,
});

let failures = 0;
const check = (name: string, condition: boolean, extra?: unknown) => {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}`);
    if (extra !== undefined) console.log(`  ${JSON.stringify(extra)}`);
  }
};

const isError = (value: unknown, reason: string) =>
  !!value &&
  typeof value === "object" &&
  "type" in value &&
  (value as { type?: string }).type === "ERROR" &&
  (value as { reason?: string }).reason === reason;

// ── Normalisation PSTN / identité de numéro ────────────────────────────────
check("E.164 déjà normalisé", normalizeE164("+3312345678") === "+3312345678");
check("10 chiffres US → +1", normalizeE164("4155551234") === "+14155551234");
check(
  ">10 chiffres sans + → préfixe +",
  normalizeE164("331234567890") === "+331234567890"
);
check(
  "garde seulement chiffres/plus",
  normalizeE164("(415) 555-1234") === "+14155551234"
);
check(
  "Cameroun +237 reste canonique",
  normalizeE164("+237612345678") === "+237612345678"
);
check(
  "Cameroun 237… → +237…",
  normalizeE164("237612345678") === "+237612345678"
);
check(
  "Cameroun 00237… → +237…",
  normalizeE164("00237612345678") === "+237612345678"
);

// ── Classification générique ───────────────────────────────────────────────
check(
  "cible vide → EMPTY_TARGET",
  isError(classifyCandidates({ target: "  ", callerId: "u1", candidates: [] }), "EMPTY_TARGET")
);

check(
  "soi-même par identité d'annuaire → SELF_CALL",
  isError(
    classifyCandidates({ target: "alice", callerId: "u1", candidates: [user()] }),
    "SELF_CALL"
  )
);

check(
  "candidat annuaire non joignable → TARGET_NOT_CALLABLE",
  isError(
    classifyCandidates({
      target: "bob",
      callerId: "u1",
      candidates: [user({ id: "u2", callUsername: "bob", isCallable: false })],
    }),
    "TARGET_NOT_CALLABLE"
  )
);

const appToAppDirectory = classifyCandidates({
  target: " ALICE ",
  callerId: "u3",
  candidates: [user()],
});
check(
  "candidat annuaire joignable → APP_TO_APP avec destination canonique",
  appToAppDirectory.type === "APP_TO_APP" &&
    appToAppDirectory.targetUserId === "u1" &&
    appToAppDirectory.destination === "alice",
  appToAppDirectory
);

const pstn = classifyCandidates({
  target: "+33123456789",
  callerId: "u3",
  candidates: [],
});
check(
  "aucun candidat → APP_TO_PSTN destination E.164",
  pstn.type === "APP_TO_PSTN" && pstn.destination === "+33123456789",
  pstn
);

// ── Résolution pure PhoneNumber ────────────────────────────────────────────
const canonicalPhoneTarget = "237612345678";
const matchingPhoneCandidates = phoneNumberCandidates({
  target: canonicalPhoneTarget,
  organizationId: "org1",
  // Ligne legacy sans + : elle doit être comparée après normalisation.
  phoneNumbers: [phone({ number: "00237612345678" })],
});
const appToAppPhone = classifyCandidates({
  target: canonicalPhoneTarget,
  callerId: "u1",
  candidates: matchingPhoneCandidates,
});
check(
  "numéro actif assigné même tenant → APP_TO_APP",
  appToAppPhone.type === "APP_TO_APP" &&
    appToAppPhone.targetUserId === "u2" &&
    appToAppPhone.destination === "+237612345678",
  appToAppPhone
);

check(
  "appel de son propre numéro → SELF_CALL",
  isError(
    classifyCandidates({
      target: "+237612345678",
      callerId: "u2",
      candidates: phoneNumberCandidates({
        target: "+237612345678",
        organizationId: "org1",
        phoneNumbers: [phone()],
      }),
    }),
    "SELF_CALL"
  )
);

const inactiveCandidates = phoneNumberCandidates({
  target: canonicalPhoneTarget,
  organizationId: "org1",
  phoneNumbers: [phone({ status: "SUSPENDED" })],
});
const inactiveRoute = classifyCandidates({
  target: canonicalPhoneTarget,
  callerId: "u1",
  candidates: inactiveCandidates,
});
check(
  "numéro inactif → APP_TO_PSTN (jamais APP_TO_APP)",
  inactiveRoute.type === "APP_TO_PSTN" && inactiveRoute.destination === "+237612345678",
  inactiveRoute
);

const unassignedCandidates = phoneNumberCandidates({
  target: canonicalPhoneTarget,
  organizationId: "org1",
  phoneNumbers: [phone({ assignedUser: null })],
});
check(
  "numéro non assigné → APP_TO_PSTN",
  classifyCandidates({
    target: canonicalPhoneTarget,
    callerId: "u1",
    candidates: unassignedCandidates,
  }).type === "APP_TO_PSTN"
);

const nonCallableCandidates = phoneNumberCandidates({
  target: canonicalPhoneTarget,
  organizationId: "org1",
  phoneNumbers: [phone({ assignedUser: user({ id: "u2", isCallable: false }) })],
});
check(
  "utilisateur assigné non callable → TARGET_NOT_CALLABLE, jamais PSTN",
  isError(
    classifyCandidates({
      target: canonicalPhoneTarget,
      callerId: "u1",
      candidates: nonCallableCandidates,
    }),
    "TARGET_NOT_CALLABLE"
  )
);

const crossTenantPhoneCandidates = phoneNumberCandidates({
  target: canonicalPhoneTarget,
  organizationId: "org1",
  phoneNumbers: [
    phone({
      assignedUser: user({ id: "u-other", organizationId: "org-other" }),
    }),
  ],
});
check(
  "numéro attribué à un utilisateur autre tenant → APP_TO_PSTN",
  classifyCandidates({
    target: canonicalPhoneTarget,
    callerId: "u1",
    candidates: crossTenantPhoneCandidates,
  }).type === "APP_TO_PSTN"
);

const duplicateLegacyCandidates = phoneNumberCandidates({
  target: canonicalPhoneTarget,
  organizationId: "org1",
  phoneNumbers: [
    phone({ number: "+237612345678" }),
    phone({ number: "00237612345678" }),
  ],
});
check(
  "doublons legacy canoniquement équivalents → erreur explicite, jamais PSTN",
  isError(
    classifyCandidates({
      target: canonicalPhoneTarget,
      callerId: "u1",
      candidates: duplicateLegacyCandidates,
    }),
    "AMBIGUOUS_INTERNAL_TARGET"
  )
);

check(
  "deux identités internes distinctes → erreur explicite",
  isError(
    classifyCandidates({
      target: "collision",
      callerId: "u1",
      candidates: [
        user({ id: "u2", callUsername: "collision" }),
        user({ id: "u3", callExtension: "collision" }),
      ],
    }),
    "AMBIGUOUS_INTERNAL_TARGET"
  )
);

// ── resolveCallDestination avec lookup injecté (sans DB) ───────────────────
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

  const emailRoute = await resolveCallDestination({
    callerId: "u9",
    organizationId: "org1",
    target: "alice@x.io",
    lookupUser: async () => [user()],
  });
  check(
    "resolve : identité injectée par email → APP_TO_APP et cible rejouable",
    emailRoute.type === "APP_TO_APP" && emailRoute.destination === "alice@x.io"
  );

  const route2 = await resolveCallDestination({
    callerId: "u9",
    organizationId: "org1",
    target: "jane",
    lookupUser: async () => [],
  });
  check("resolve : cible externe → APP_TO_PSTN", route2.type === "APP_TO_PSTN");

  const phoneRoute = await resolveCallDestination({
    callerId: "u9",
    organizationId: "org1",
    target: "00237612345678",
    lookupUser: async () => [phoneCandidate()],
  });
  check(
    "resolve : numéro interne injecté → APP_TO_APP avec E.164 canonique",
    phoneRoute.type === "APP_TO_APP" && phoneRoute.destination === "+237612345678",
    phoneRoute
  );

  const crossTenantRoute = await resolveCallDestination({
    callerId: "u9",
    organizationId: "org1",
    target: "+237612345678",
    lookupUser: async () => [phoneCandidate({ organizationId: "org-other" })],
  });
  check(
    "resolve : candidat lookup cross-tenant ignoré → APP_TO_PSTN",
    crossTenantRoute.type === "APP_TO_PSTN",
    crossTenantRoute
  );

  const route3 = await resolveCallDestination({
    callerId: "u9",
    organizationId: "org1",
    target: "",
    lookupUser: async () => [],
  });
  check("resolve : cible vide → EMPTY_TARGET", isError(route3, "EMPTY_TARGET"));

  const route4 = await resolveCallDestination({
    callerId: "",
    organizationId: "",
    target: "x",
    lookupUser: async () => [],
  });
  check("resolve : pas d'auth → UNAUTHORIZED", isError(route4, "UNAUTHORIZED"));

  console.log("");
  console.log(
    failures === 0 ? "TOUS LES TESTS PASSENT" : `${failures} TEST(S) EN ÉCHEC`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
