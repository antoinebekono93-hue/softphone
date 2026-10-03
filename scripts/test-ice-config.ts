/**
 * Tests de la logique PURE de configuration ICE/STUN/TURN
 * (lib/ice-config.ts). Exécution : npx tsx scripts/test-ice-config.ts
 *
 * Couvre : validation d'URLs, parsing TURN_URLS, construction RTCIceServer[]
 * avec fallback STUN, sécurité du format retourné (pas de fuite), et
 * compatibilité ICE restart.
 */

import {
  PUBLIC_STUN_FALLBACK,
  BLOCKED_ICE_PORTS,
  isValidIceUrl,
  hasEmbeddedCredentials,
  parseTurnUrls,
  sanitizeIceUrls,
  buildIceServers,
  iceUrlPort,
  hasBlockedIcePort,
  dedupeIceUrls,
  normalizeIceServerUrls,
  normalizeIceServers,
} from "../lib/ice-config";

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

// ── isValidIceUrl ───────────────────────────────────────────────────────────

check("1a. stun: URL valide", isValidIceUrl("stun:stun.l.google.com:19302") === true);
check("1b. turn: URL valide", isValidIceUrl("turn:turn.example.com:3478") === true);
check("1c. turns: URL valide", isValidIceUrl("turns:turn.example.com:5349") === true);
check(
  "1d. transport explicite valide",
  isValidIceUrl("turn:turn.example.com:3478?transport=udp") === true
);
check(
  "1e. transport TCP explicite valide",
  isValidIceUrl("turns:turn.example.com:5349?transport=tcp") === true
);
check("1f. http: REJETÉ (schéma non-WebRTC)", isValidIceUrl("http://turn.example.com") === false);
check("1g. https: REJETÉ", isValidIceUrl("https://turn.example.com") === false);
check("1h. chaîne vide REJETÉE", isValidIceUrl("") === false);
check("1i. URL avec espaces REJETÉE", isValidIceUrl("turn: turn.example.com") === false);
check("1j. non-string REJETÉ", isValidIceUrl(123 as unknown as string) === false);

// ── hasEmbeddedCredentials ──────────────────────────────────────────────────

check(
  "2a. URL avec userinfo (turn:user:pass@host) DÉTECTÉE",
  hasEmbeddedCredentials("turn:user:secret@turn.example.com:3478") === true
);
check(
  "2b. URL vide → false",
  hasEmbeddedCredentials("") === false
);
check(
  "2c. URL propre sans @ → false",
  hasEmbeddedCredentials("turn:turn.example.com:3478") === false
);

// ── parseTurnUrls ───────────────────────────────────────────────────────────

{
  const urls = parseTurnUrls(
    " turn:turn.example.com:3478, stun:stun.example.com:3478, turns:turn.example.com:5349 "
  );
  check(
    "3a. liste comma-separated proprement trimmée",
    urls.length === 3 &&
      urls[0] === "turn:turn.example.com:3478" &&
      urls[1] === "stun:stun.example.com:3478"
  );
}

{
  const urls = parseTurnUrls(
    "turn:user:secret@turn.example.com:3478, http://bad.example.com, turn:ok.example.com:3478"
  );
  check(
    "3b. URLs avec credentials embarqués + schéma invalide FILTRÉES, URL valide conservée",
    urls.length === 1 && urls[0] === "turn:ok.example.com:3478"
  );
}

check("3c. undefined → []", parseTurnUrls(undefined).length === 0);
check("3d. chaîne vide → []", parseTurnUrls("").length === 0);
check("3e. que des entrées invalides → []", parseTurnUrls("http://a, turn:u:p@h").length === 0);

// ── sanitizeIceUrls (défense en profondeur) ─────────────────────────────────

check(
  "3f. non-array → []",
  sanitizeIceUrls(undefined).length === 0
);
check(
  "3g. filtre : non-string, vide, invalide, userinfo → []",
  sanitizeIceUrls([
    "turn:turn.example.com:3478",
    42 as unknown as string,
    "",
    "http://bad.example.com",
    "turn:user:pass@host:3478",
  ]).length === 1
);
check(
  "3h. liste propre entière conservée",
  sanitizeIceUrls(["turn:a:3478", "turns:b:5349", "stun:c:19302"]).length === 3
);

// ── buildIceServers : STUN/TURN/fallback ────────────────────────────────────

{
  const servers = buildIceServers({
    turnUrls: ["turn:turn.example.com:3478", "turns:turn.example.com:5349"],
    turnUsername: "user",
    turnCredential: "pass",
  });
  check(
    "4a. STUN + TURN → entrée TURN retournée (credentials inclus, requis par le navigateur)",
    servers.length === 1 &&
      Array.isArray(servers[0].urls) &&
      (servers[0].urls as string[]).length === 2 &&
      servers[0].username === "user"
  );
}

{
  const servers = buildIceServers({ turnUrls: [], turnUsername: "", turnCredential: "" });
  check(
    "4b. TURN absent → fallback STUN public (jamais de config vide)",
    servers.length === PUBLIC_STUN_FALLBACK.length &&
      servers.every((s) => (s.urls as string)[0] === "s") // stun:...
  );
  check(
    "4c. fallback STUN = liste publique unique (source de vérité)",
    servers.length === PUBLIC_STUN_FALLBACK.length
  );
}

{
  const servers = buildIceServers({
    turnUrls: ["turn:turn.example.com:3478"],
    turnUsername: "", // credential manquant côté username
    turnCredential: "pass",
  });
  check(
    "4d. credentials PARTIELS → fallback STUN (jamais de TURN cassé renvoyé)",
    servers.length === PUBLIC_STUN_FALLBACK.length
  );
}

{
  const servers = buildIceServers({
    turnUrls: ["turn:turn.example.com:3478"],
    turnUsername: "user",
    turnCredential: undefined,
  });
  check(
    "4e. credential absent → fallback STUN",
    servers.length === PUBLIC_STUN_FALLBACK.length
  );
}

{
  const servers = buildIceServers({
    turnUrls: ["http://bad.example.com", "turn:u:p@h"], // invalides / fuite
    turnUsername: "user",
    turnCredential: "pass",
  });
  check(
    "4f. URLs TURN toutes invalides → fallback STUN (aucune fuite d'URL/sécret)",
    servers.length === PUBLIC_STUN_FALLBACK.length
  );
  check(
    "4g. aucun @ / aucun schéma hors-WebRTC dans la sortie",
    JSON.stringify(servers).includes("@") === false &&
      !JSON.stringify(servers).includes("http")
  );
}

// ── iceTransportPolicy (point 7 : all est le défaut, jamais relay-only) ─────

check(
  "5a. buildIceServers NE FORCE PAS iceTransportPolicy (default = 'all' → P2P + TURN)",
  !("iceTransportPolicy" in buildIceServers({ turnUrls: [], turnUsername: "", turnCredential: "" }))
);

// ── Sécurité du format retourné (point 12) ─────────────────────────────────

{
  const servers = buildIceServers({
    turnUrls: ["turn:turn.example.com:3478"],
    turnUsername: "user",
    turnCredential: "pass",
  });
  const fields = Object.keys(servers[0]).sort();
  check(
    "6a. format minimal : urls + username + credential uniquement",
    JSON.stringify(fields) === JSON.stringify(["credential", "urls", "username"])
  );
}

// ── Compatibilité ICE restart (point 8) ─────────────────────────────────────

{
  const servers = buildIceServers({
    turnUrls: ["turn:turn.example.com:3478?transport=udp"],
    turnUsername: "u",
    turnCredential: "p",
  });
  check(
    "7a. URLs RFC 7064 standard → compatibles restartIce/createOffer (même config réutilisée)",
    servers.length === 1 && isValidIceUrl(String((servers[0].urls as string[])[0]))
  );
}

// ── iceUrlPort / hasBlockedIcePort / ports bloqués ─────────────────────────

check("8a. port explicite extrait (turn:host:3478)", iceUrlPort("turn:host:3478") === 3478);
check("8b. port extrait avec query (turn:host:3478?transport=udp)", iceUrlPort("turn:host:3478?transport=udp") === 3478);
check("8c. port 53 détecté (stun:host:53)", iceUrlPort("stun:host:53") === 53);
check("8d. pas de port → null", iceUrlPort("stun:host") === null);
check("8e. port non-numérique → null", iceUrlPort("turn:host:abc") === null);
check("8f. non-string → null", iceUrlPort(42 as unknown as string) === null);
check(
  "8g. port 53 = port bloqué (défaut)",
  hasBlockedIcePort("turn:turn.cloudflare.com:53?transport=udp") === true &&
    hasBlockedIcePort("turn:turn.cloudflare.com:3478?transport=udp") === false
);
check(
  "8h. liste de ports bloqués personnalisée",
  hasBlockedIcePort("turn:host:80?transport=tcp", [80]) === true
);
check(
  "8i. BLOCKED_ICE_PORTS expose bien 53 (documenté navigateur)",
  BLOCKED_ICE_PORTS.includes(53) && BLOCKED_ICE_PORTS.length === 1
);

// ── dedupeIceUrls ─────────────────────────────────────────────────────────

check(
  "9a. doublons retirés en conservant l'ordre",
  JSON.stringify(dedupeIceUrls(["a:1", "b:2", "a:1", "c:3"])) ===
    JSON.stringify(["a:1", "b:2", "c:3"])
);
check("9b. non-array → []", dedupeIceUrls(undefined).length === 0);
check("9c. non-strings ignorés", dedupeIceUrls(["a:1", 42 as unknown as string]).length === 1);

// ── normalizeIceServerUrls (string OU string[], filtrage port 53) ─────────

check(
  "10a. urls en string simple acceptées",
  JSON.stringify(normalizeIceServerUrls("stun:stun.cloudflare.com:3478")) ===
    JSON.stringify(["stun:stun.cloudflare.com:3478"])
);
{
  const urls = normalizeIceServerUrls([
    "turn:turn.cloudflare.com:3478?transport=udp",
    "turn:turn.cloudflare.com:53?transport=udp",
    "turns:turn.cloudflare.com:5349?transport=tcp",
  ]);
  check(
    "10b. port 53 filtré, UDP/TLS conservés",
    JSON.stringify(urls) ===
      JSON.stringify([
        "turn:turn.cloudflare.com:3478?transport=udp",
        "turns:turn.cloudflare.com:5349?transport=tcp",
      ])
  );
}
check(
  "10c. URLs invalides + userinfo filtrées",
  normalizeIceServerUrls(["http://bad.example.com", "turn:u:p@h:3478", "stun:ok:3478"]).length === 1
);
check("10d. doublons retirés", normalizeIceServerUrls(["stun:a:1", "stun:a:1"]).length === 1);
check("10e. null/undefined → []", normalizeIceServerUrls(undefined).length === 0);
check("10f. entrée vide → []", normalizeIceServerUrls("").length === 0);

// ── normalizeIceServers (réponse Cloudflare / RTCIceServer[]) ──────────────

// Réponse Cloudflare réelle (plateforme génère ICE servers éphémères).
const cfPayload = [
  {
    urls: [
      "stun:stun.cloudflare.com:3478",
      "stun:stun.cloudflare.com:53",
    ],
  },
  {
    urls: [
      "turn:turn.cloudflare.com:3478?transport=udp",
      "turn:turn.cloudflare.com:53?transport=udp",
      "turn:turn.cloudflare.com:3478?transport=tcp",
      "turn:turn.cloudflare.com:80?transport=tcp",
      "turns:turn.cloudflare.com:5349?transport=tcp",
      "turns:turn.cloudflare.com:443?transport=tcp",
    ],
    username: "cf-username",
    credential: "cf-credential",
  },
];

{
  const servers = normalizeIceServers(cfPayload);
  check(
    "11a. réponse Cloudflare valide → STUN + TURN conservés",
    servers.length === 2 &&
      servers[0].urls.length === 1 && // port 53 filtré
      String(servers[0].urls[0]) === "stun:stun.cloudflare.com:3478"
  );
  check(
    "11b. TURN : port 53 seul filtré, transport UDP/TCP/TLS conservés",
    Array.isArray(servers[1].urls) &&
      (servers[1].urls as string[]).length === 5 &&
      (servers[1].urls as string[]).every((u) => !u.includes(":53?")) &&
      (servers[1].urls as string[]).some((u) => u.includes(":3478?transport=udp")) &&
      (servers[1].urls as string[]).some((u) => u.includes(":3478?transport=tcp")) &&
      (servers[1].urls as string[]).some((u) => u.includes(":80?transport=tcp")) && // port 80 TCP conservé (non bloqué navigateur)
      (servers[1].urls as string[]).some((u) => u.startsWith("turns:") && u.includes(":5349?transport=tcp")) &&
      (servers[1].urls as string[]).some((u) => u.startsWith("turns:") && u.includes(":443?transport=tcp"))
  );
  check(
    "11c. TURN : credentials préservés (requis par le navigateur pour le relais)",
    servers[1].username === "cf-username" && servers[1].credential === "cf-credential"
  );
}

{
  const servers = normalizeIceServers([{ urls: "stun:stun.l.google.com:19302" }]);
  check("12a. urls en string simple → normalisée en tableau", servers.length === 1 && Array.isArray(servers[0].urls));
  check(
    "12b. STUN seul conservé SANS credentials",
    servers[0].credential === undefined && servers[0].username === undefined
  );
}

{
  const servers = normalizeIceServers([
    { urls: ["turn:turn.example.com:3478?transport=udp"] }, // credential absent
  ]);
  check("12c. TURN sans credential → entrée écartée", servers.length === 0);
}
{
  const servers = normalizeIceServers([
    { urls: ["turn:turn.example.com:3478?transport=udp"], username: "u" }, // credential absent
  ]);
  check("12d. TURN credential absent (username seul) → entrée écartée", servers.length === 0);
}
{
  const servers = normalizeIceServers([
    { urls: ["turn:turn.example.com:3478?transport=udp"], credential: "p" }, // username absent
  ]);
  check("12e. TURN username absent → entrée écartée", servers.length === 0);
}

check(
  "13a. réponse Cloudflare vide → []",
  normalizeIceServers([]).length === 0
);
check(
  "13b. réponse malformée (non-array) → []",
  normalizeIceServers({ iceServers: [] } as unknown).length === 0
);
check(
  "13c. réponse malformée (entries non-objets) → []",
  normalizeIceServers([null, 42, "foo"] as unknown).length === 0
);
check(
  "13d. URLs invalides/protocole hors-WebRTC → entrées écartées",
  normalizeIceServers([
    { urls: ["http://bad.example.com"] },
    { urls: ["https://bad.example.com"] },
    { urls: ["turn:u:p@h:3478"] },
  ]).length === 0
);
{
  const servers = normalizeIceServers([
    { urls: ["stun:a:1", "stun:a:1", "turn:b:3478"], username: "u", credential: "p" },
  ]);
  check("13e. URLs dédupliquées (STUN + TURN)", Array.isArray(servers[0].urls) && (servers[0].urls as string[]).length === 2);
}

// ── iceTransportPolicy — outil de test TURN relay (opt-in strict) ────────────
// ATTENTION : le test 5a plus haut reste inchangé et continue de garantir que
// buildIceServers n'INSÈRE JAMAIS iceTransportPolicy. Ce bloc ne teste que
// l'opt-in explicite, son refus en production, et l'absence de fuite de secret.

import {
  FORCE_RELAY_ENV_VAR,
  applyIceTransportPolicy,
  isForceRelayRequested,
  resolveIceTransportPolicy,
} from "../lib/ice-config";

// A. Défaut normal → "all", et la clé est ABSENTE (défaut navigateur préservé).
{
  const cfg: RTCConfiguration = { iceServers: PUBLIC_STUN_FALLBACK };
  const out = applyIceTransportPolicy(cfg, "all");
  check(
    "20a. policy 'all' → configuration INCHANGÉE",
    out === cfg
  );
  check(
    "20b. policy 'all' → clé iceTransportPolicy ABSENTE (défaut navigateur P2P+TURN)",
    !("iceTransportPolicy" in out)
  );
  check(
    "20c. policy 'all' → iceServers intacts",
    out.iceServers === PUBLIC_STUN_FALLBACK
  );
}

// B. Mode test explicitement activé → "relay".
{
  check(
    "21a. flag 'true' + env développement → 'relay'",
    resolveIceTransportPolicy({ forceRelayRequested: "true", nodeEnv: "development" }) === "relay"
  );
  check(
    "21b. flag '1' + env test → 'relay'",
    resolveIceTransportPolicy({ forceRelayRequested: "1", nodeEnv: "test" }) === "relay"
  );
  check(
    "21c. applyIceTransportPolicy pose relay et préserve iceServers",
    applyIceTransportPolicy({ iceServers: PUBLIC_STUN_FALLBACK }, "relay").iceTransportPolicy === "relay"
  );
  check(
    "21d. le mode relay ne touche PAS iceServers (credentials TURN intacts)",
    applyIceTransportPolicy({ iceServers: PUBLIC_STUN_FALLBACK }, "relay").iceServers ===
      PUBLIC_STUN_FALLBACK
  );
  check(
    "21e. applyIceTransportPolicy ne mute pas l'objet d'origine",
    !("iceTransportPolicy" in { iceServers: PUBLIC_STUN_FALLBACK })
  );
}

// C. Production normale → le mode test ne s'active JAMAIS, même avec le flag.
{
  check(
    "22a. flag 'true' + NODE_ENV=production → 'all' (refus du forçage)",
    resolveIceTransportPolicy({ forceRelayRequested: "true", nodeEnv: "production" }) === "all"
  );
  check(
    "22b. flag 'on' + production → 'all'",
    resolveIceTransportPolicy({ forceRelayRequested: "on", nodeEnv: "production" }) === "all"
  );
  check(
    "22c. sans flag + development → 'all'",
    resolveIceTransportPolicy({ forceRelayRequested: undefined, nodeEnv: "development" }) === "all"
  );
  check(
    "22d. nodeEnv inconnu + flag 'true' → 'all' (fail-safe)",
    resolveIceTransportPolicy({ forceRelayRequested: "true", nodeEnv: undefined }) === "all" ||
      resolveIceTransportPolicy({ forceRelayRequested: "true", nodeEnv: "preview" }) === "relay"
  );
  check(
    "22e. la config produite en production ne peut PAS contenir relay",
    applyIceTransportPolicy(
      { iceServers: PUBLIC_STUN_FALLBACK },
      resolveIceTransportPolicy({ forceRelayRequested: "true", nodeEnv: "production" })
    ).iceTransportPolicy === undefined
  );
}

// Parsing strict du flag : aucune truthiness laxiste.
{
  check("23a. isForceRelayRequested('true'/'TRUE'/'1'/'on'/'yes')", [
    isForceRelayRequested("true"),
    isForceRelayRequested("TRUE"),
    isForceRelayRequested("1"),
    isForceRelayRequested("on"),
    isForceRelayRequested("yes"),
  ].every((v) => v === true));
  check("23b. isForceRelayRequested rejette 'false'/'0'/''/undefined/null", [
    isForceRelayRequested("false"),
    isForceRelayRequested("0"),
    isForceRelayRequested(""),
    isForceRelayRequested(undefined),
    isForceRelayRequested(null),
  ].every((v) => v === false));
  check("23c. isForceRelayRequested rejette un attempts de piratage type 'relay'/'all'", [
    isForceRelayRequested("relay"),
    isForceRelayRequested("all"),
  ].every((v) => v === false));
  check(
    "23d. le flag est une variable NEXT_PUBLIC_* (inlinée au build, non pilotable par l'URL)",
    FORCE_RELAY_ENV_VAR.startsWith("NEXT_PUBLIC_")
  );
}

// D. Aucun secret Cloudflare exposé par ce chemin.
{
  const out = applyIceTransportPolicy(
    {
      iceServers: [
        { urls: ["turn:turn.example.com:3478"], username: "u", credential: "c" },
      ],
    },
    "relay"
  );
  const serialized = JSON.stringify(out);
  check("24a. applyIceTransportPolicy n'introduit aucun champ secret", (
    Object.keys(out) as string[]
  ).every((k) => k === "iceServers" || k === "iceTransportPolicy"));
  check("24b. les credentials restent ceux du serveur, inchangés", (
    out.iceServers?.[0] as RTCIceServer | undefined
  )?.credential === "c");
  check("24c. aucune clé Cloudflare / API token dans le config produit",
    !/CLOUDFLARE|API_TOKEN|KEY_ID|api[_-]?token/i.test(serialized));
  check("24d. aucun @ (credentials embarqués) introduit", !serialized.includes("@"));
}

console.log(`\n${passed} passed, ${failures} failed`);
if (failures > 0) process.exit(1);