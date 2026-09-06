/**
 * Tests serveur Cloudflare Realtime TURN (lib/turn-cloudflare.ts)
 * et orchestration de la route /api/app-calls/ice-config.
 *
 * Exécution : npx tsx scripts/test-turn-api.ts
 *
 * Aucun secret réel utilisé : l'appel Cloudflare est TOUJOURS mocké
 * (fetchImpl / generate injectés). Aucun call réseau n'est émis.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getTurnCredentialTtl,
  generateCloudflareIceServers,
  buildTurnIceConfig,
  TurnApiError,
  TURN_TTL_MIN_SECONDS,
  TURN_TTL_MAX_SECONDS,
  TURN_DEFAULT_MAX_CALL_SECONDS,
  TURN_TTL_MARGIN_SECONDS,
} from "../lib/turn-cloudflare";
import { PUBLIC_STUN_FALLBACK } from "../lib/ice-config";

let failures = 0;
let passed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}`);
  }
};

async function main() {
  // ── Mocks fetch / generate ─────────────────────────────────────────────────
  const FAKE_SECRET = "rk-test-super-secret-api-token";
  const FAKE_KEY_ID = "my-turn-key-id";

  const okFetch = (payload: unknown, status = 201) =>
    async () => ({ status, json: async () => payload });

  // ── TTL (§5 / §14: 16-17) ──────────────────────────────────────────────────
  {
    const ttl = getTurnCredentialTtl(3600);
    check(
      "16a. TTL(maxCallDuration=3600) = 3600 + marge",
      ttl === TURN_DEFAULT_MAX_CALL_SECONDS + TURN_TTL_MARGIN_SECONDS
    );
    check("16b. TTL > durée d'appel", ttl > 3600);
    check("16c. TTL dans les bornes [MIN, MAX]", ttl >= TURN_TTL_MIN_SECONDS && ttl <= TURN_TTL_MAX_SECONDS);
  }
  {
    const ttl = getTurnCredentialTtl(7200);
    check("16d. TTL(7200) = 7800 (> 2h de call)", ttl === 7800);
    check("16e. TTL(7200) > durée d'appel", ttl > 7200);
  }
  {
    const ttl = getTurnCredentialTtl(43_200); // 12h
    check("16f. TTL(43200) = 43800 (< TTL max 24h)", ttl === 43_800);
  }
  {
    const ttl = getTurnCredentialTtl(60); // 1 min
    check("16g. TTL(60) = 660 (> durée de 60s)", ttl === 660);
    check("16h. TTL MIN > durée", ttl > 60 && ttl >= TURN_TTL_MIN_SECONDS);
  }
  {
    const ttl = getTurnCredentialTtl(100_000); // 27h+
    check("16i. TTL(100000) borné au MAX (86400)", ttl === TURN_TTL_MAX_SECONDS);
  }

  check("17a. TTL(null) → défaut", getTurnCredentialTtl(null) === 3_600 + TURN_TTL_MARGIN_SECONDS);
  check("17b. TTL(undefined) → défaut", getTurnCredentialTtl(undefined) === 3_600 + TURN_TTL_MARGIN_SECONDS);
  check("17c. TTL(0) → défaut", getTurnCredentialTtl(0) === 3_600 + TURN_TTL_MARGIN_SECONDS);
  check("17d. TTL(-5) → défaut", getTurnCredentialTtl(-5) === 3_600 + TURN_TTL_MARGIN_SECONDS);
  check("17e. TTL(NaN) → défaut", getTurnCredentialTtl(Number.NaN) === 3_600 + TURN_TTL_MARGIN_SECONDS);
  check("17f. TTL(Infinity) → défaut", getTurnCredentialTtl(Infinity) === 3_600 + TURN_TTL_MARGIN_SECONDS);
  check("17g. TTL(1800) = 2400", getTurnCredentialTtl(1800) === 2_400);

  // ── generateCloudflareIceServers : statuts HTTP / malformation (mock) ─────
  {
    const iceServers = await generateCloudflareIceServers({
      keyId: FAKE_KEY_ID,
      apiToken: FAKE_SECRET,
      ttl: 4200,
      fetchImpl: okFetch({ iceServers: [{ urls: ["stun:stun.cloudflare.com:3478"] }] }),
    });
    check(
      "A1. réponse Cloudflare 201 valide → iceServers retournés",
      Array.isArray(iceServers) && iceServers.length === 1
    );
    check(
      "A2. iceServers ne contient pas de secret serveur",
      JSON.stringify(iceServers).includes(FAKE_SECRET) === false &&
        JSON.stringify(iceServers).includes(FAKE_KEY_ID) === false
    );
  }

  for (const [label, status] of [
    ["AUTH (401)", 401],
    ["AUTH (403)", 403],
  ] as const) {
    try {
      await generateCloudflareIceServers({
        keyId: FAKE_KEY_ID,
        apiToken: FAKE_SECRET,
        ttl: 4200,
        fetchImpl: okFetch({}, status),
      });
      check(`${label} → TurnApiError attendu`, false);
    } catch (err) {
      check(
        `${label} → kind=AUTH`,
        err instanceof TurnApiError && err.kind === "AUTH" && err.status === status
      );
    }
  }

  {
    try {
      await generateCloudflareIceServers({
        keyId: FAKE_KEY_ID,
        apiToken: FAKE_SECRET,
        ttl: 4200,
        fetchImpl: okFetch({}, 429),
      });
      check("429 → TurnApiError attendu", false);
    } catch (err) {
      check(
        "429 → kind=RATE_LIMITED",
        err instanceof TurnApiError && err.kind === "RATE_LIMITED"
      );
    }
  }

  {
    try {
      await generateCloudflareIceServers({
        keyId: FAKE_KEY_ID,
        apiToken: FAKE_SECRET,
        ttl: 4200,
        fetchImpl: okFetch({}, 500),
      });
      check("5xx → TurnApiError attendu", false);
    } catch (err) {
      check(
        "500 → kind=UPSTREAM",
        err instanceof TurnApiError && err.kind === "UPSTREAM" && err.status === 500
      );
    }
  }

  {
    try {
      await generateCloudflareIceServers({
        keyId: FAKE_KEY_ID,
        apiToken: FAKE_SECRET,
        ttl: 4200,
        fetchImpl: okFetch({ iceServers: [] }),
      });
      check("A5. 201 avec iceServers vide → OK (array valide, fallback géré en aval)", true);
    } catch (err) {
      check("A5. 201 avec iceServers vide → OK (array valide, fallback géré en aval)", false);
    }
  }

  {
    try {
      await generateCloudflareIceServers({
        keyId: FAKE_KEY_ID,
        apiToken: FAKE_SECRET,
        ttl: 4200,
        fetchImpl: okFetch({}, 201), // pas de champ iceServers
      });
      check("201 sans champ iceServers → TurnApiError attendu", false);
    } catch (err) {
      check(
        "201 sans champ iceServers → kind=MALFORMED",
        err instanceof TurnApiError && err.kind === "MALFORMED"
      );
    }
  }

  {
    try {
      await generateCloudflareIceServers({
        keyId: FAKE_KEY_ID,
        apiToken: FAKE_SECRET,
        ttl: 4200,
        fetchImpl: async () => {
          throw new Error("ECONNRESET");
        },
      });
      check("fetch throw → TurnApiError attendu", false);
    } catch (err) {
      check(
        "fetch throw → kind=NETWORK",
        err instanceof TurnApiError && err.kind === "NETWORK"
      );
    }
  }

  // ── Aucun secret dans les messages d'erreur (§13 / §14: 15) ────────────────
  for (const [label, status] of [
    ["AUTH", 401],
    ["RATE_LIMITED", 429],
    ["UPSTREAM", 500],
  ] as const) {
    try {
      await generateCloudflareIceServers({
        keyId: FAKE_KEY_ID,
        apiToken: FAKE_SECRET,
        ttl: 4200,
        fetchImpl: okFetch({}, status),
      });
    } catch (err) {
      const msg = String(err instanceof Error ? err.message : err);
      check(
        `15. ${label} : message d'erreur SANS secrets (token/keyId)`,
        !msg.includes(FAKE_SECRET) && !msg.includes(FAKE_KEY_ID)
      );
    }
  }

  // ── buildTurnIceConfig : orchestration route (§15) ─────────────────────────
  {
    const res = await buildTurnIceConfig({
      organizationId: null,
      keyId: FAKE_KEY_ID,
      apiToken: FAKE_SECRET,
    });
    check(
      "B1. utilisateur non authentifié → 401 Unauthorized",
      res.ok === false && res.status === 401 && res.error === "Unauthorized"
    );
  }
  {
    const res = await buildTurnIceConfig({
      organizationId: "org-1",
      keyId: null,
      apiToken: FAKE_SECRET,
    });
    check(
      "B2. CLOUDFLARE_TURN_KEY_ID absent → 503 TURN_SERVICE_NOT_CONFIGURED",
      res.ok === false && res.status === 503 && res.error === "TURN_SERVICE_NOT_CONFIGURED"
    );
  }
  {
    const res = await buildTurnIceConfig({
      organizationId: "org-1",
      keyId: FAKE_KEY_ID,
      apiToken: null,
    });
    check(
      "B3. CLOUDFLARE_TURN_API_TOKEN absent → 503 TURN_SERVICE_NOT_CONFIGURED",
      res.ok === false && res.status === 503 && res.error === "TURN_SERVICE_NOT_CONFIGURED"
    );
  }
  {
    let generatedTtl: number | null = null;
    const res = await buildTurnIceConfig({
      organizationId: "org-1",
      keyId: FAKE_KEY_ID,
      apiToken: FAKE_SECRET,
      maxCallDurationSeconds: 7200,
      generate: async ({ ttl }) => {
        generatedTtl = ttl;
        return [{ urls: ["turn:turn.cloudflare.com:3478?transport=udp"], username: "u", credential: "p" }];
      },
    });
    check("B4. Cloudflare 201 → ok avec iceServers", res.ok === true && res.iceServers.length === 1);
    check("B5. TTL transmis à Cloudflare = getTurnCredentialTtl(7200)", generatedTtl === 7800);
  }
  {
    const res = await buildTurnIceConfig({
      organizationId: "org-1",
      keyId: FAKE_KEY_ID,
      apiToken: FAKE_SECRET,
      generate: async () => {
        throw new TurnApiError("AUTH", "boom", 401);
      },
    });
    check(
      "B6. Cloudflare 401 → 502 TURN_AUTH_FAILED (sans secret)",
      res.ok === false && res.status === 502 && res.error === "TURN_AUTH_FAILED"
    );
  }
  {
    const res = await buildTurnIceConfig({
      organizationId: "org-1",
      keyId: FAKE_KEY_ID,
      apiToken: FAKE_SECRET,
      generate: async () => {
        throw new TurnApiError("RATE_LIMITED", "boom", 429);
      },
    });
    check("B7. Cloudflare 429 → 503 TURN_RATE_LIMITED", res.ok === false && res.status === 503 && res.error === "TURN_RATE_LIMITED");
  }
  {
    const res = await buildTurnIceConfig({
      organizationId: "org-1",
      keyId: FAKE_KEY_ID,
      apiToken: FAKE_SECRET,
      generate: async () => {
        throw new TurnApiError("UPSTREAM", "boom", 500);
      },
    });
    check("B8. Cloudflare 5xx → 502 TURN_UPSTREAM_ERROR", res.ok === false && res.status === 502 && res.error === "TURN_UPSTREAM_ERROR");
  }
  {
    const res = await buildTurnIceConfig({
      organizationId: "org-1",
      keyId: FAKE_KEY_ID,
      apiToken: FAKE_SECRET,
      generate: async () => {
        throw new TurnApiError("NETWORK", "boom");
      },
    });
    check("B9. réseau → 502 TURN_UNREACHABLE", res.ok === false && res.status === 502 && res.error === "TURN_UNREACHABLE");
  }
  {
    const res = await buildTurnIceConfig({
      organizationId: "org-1",
      keyId: FAKE_KEY_ID,
      apiToken: FAKE_SECRET,
      generate: async () => {
        throw new TurnApiError("MALFORMED", "boom");
      },
    });
    check("B10. réponse malformée → 502 TURN_INVALID_RESPONSE", res.ok === false && res.status === 502 && res.error === "TURN_INVALID_RESPONSE");
  }
  {
    const res = await buildTurnIceConfig({
      organizationId: "org-1",
      keyId: FAKE_KEY_ID,
      apiToken: FAKE_SECRET,
      generate: async () => {
        throw new Error("unexpected");
      },
    });
    check("B11. erreur non typée → 502 TURN_UPSTREAM_ERROR", res.ok === false && res.status === 502 && res.error === "TURN_UPSTREAM_ERROR");
  }
  {
    const res = await buildTurnIceConfig({
      organizationId: "org-1",
      keyId: FAKE_KEY_ID,
      apiToken: FAKE_SECRET,
      generate: async () => [
        { urls: ["turn:turn.cloudflare.com:53?transport=udp", "stun:stun.cloudflare.com:53"], username: "u", credential: "p" },
      ],
    });
    check(
      "B12. tout filtré (port 53) → fallback STUN-only (pas de TURN cassé servi)",
      res.ok === true &&
        res.iceServers.length === PUBLIC_STUN_FALLBACK.length &&
        res.iceServers.every((s) => /^stun:/i.test(String(s.urls)))
    );
  }

  // ── Statique : aucun secret NEXT_PUBLIC dans le code TURN (§14: 20) ────────
  {
    const files = [
      resolve(__dirname, "../lib/turn-cloudflare.ts"),
      resolve(__dirname, "../lib/ice-config.ts"),
      resolve(__dirname, "../app/api/app-calls/ice-config/route.ts"),
    ];
    let leaked = 0;
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      if (/NEXT_PUBLIC_CLOUDFLARE_TURN|NEXT_PUBLIC_TURN/.test(src)) leaked++;
    }
    check(
      "20. aucun NEXT_PUBLIC_CLOUDFLARE_TURN / NEXT_PUBLIC_TURN dans le code TURN",
      leaked === 0
    );
  }

  console.log(`\n${passed} passed, ${failures} failed`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});