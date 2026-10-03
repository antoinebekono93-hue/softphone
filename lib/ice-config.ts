/**
 * Couche PURE de configuration ICE/STUN/TURN pour les appels APP_TO_APP.
 *
 * SEULE source de vérité pour :
 *  - la liste STUN publique de secours (utilisée BOTH par la route serveur
 *    /api/app-calls/ice-config ET par le fallback client dans
 *    AppCallContext — aucune duplication de liste qui pourrait diverger) ;
 *  - le parsing / la validation des URLs TURN (stun:/turn:/turns: seulement) ;
 *  - la construction de la réponse RTCIceServer[] avec fallback STUN.
 *
 * Cette couche est PURE (aucune lecture d'environnement, aucun I/O) :
 *  - importable côté client AVANT le bundle (ne fuit JAMAIS de credentials) ;
 *  - testable unitairement (scripts/test-ice-config.ts).
 */

/**
 * Liste STUN publique de secours.
 * STUN seuls : aucune donnée sensible. Utilisé quand TURN n'est pas configuré
 * (route /api/app-calls/ice-config) ou indisponible (fallback client).
 * Inclut le STUN public Cloudflare (même fournisseur que notre TURN), plus
 * deux STUN Google en redondance.
 */
export const PUBLIC_STUN_FALLBACK: Array<{ urls: string }> = [
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

/**
 * Ports bloqués par les navigateurs / fournisseurs Internet.
 * Cloudflare documente que le port 53 (port alterné) peut être bloqué par
 * Chrome/Firefox et provoquer des timeouts → filtré lors de la normalisation.
 */
export const BLOCKED_ICE_PORTS: number[] = [53];

/** Schémas acceptés pour une URL de serveur ICE (WebRTC standard). */
const ICE_URL_SCHEME = /^(stun|turn|turns):[^\s]+$/i;

/**
 * Valide une URL de serveur ICE.
 * Accepte uniquement les schémas stun:/turn:/turns: (avec ou sans transport
 * `?transport=udp|tcp`). Rejette tout le reste (http:, vide, espaces, etc).
 */
export function isValidIceUrl(url: string): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return ICE_URL_SCHEME.test(trimmed);
}

/**
 * Détecte des credentials EMBARQUÉS dans l'URL (userinfo `user:pass@host`).
 * WebRTC véhicule username/credential en CHAMPS SÉPARÉS (RTCIceServer) ; une
 * URL contenant `@` signale une mauvaise configuration susceptible de fuiter
 * des secrets (URL affichée dans les logs réseau, devtools, etc).
 * Un nom d'hôte légitime ne peut jamais contenir `@`.
 */
export function hasEmbeddedCredentials(url: string): boolean {
  return typeof url === "string" && url.includes("@");
}

/**
 * Parse la variable TURN_URLS (comma-separated) en liste d'URLs NORMALISÉES.
 * - splitte sur les virgules, trime chaque entrée, retire les vides ;
 * - rejette les URLs invalides (mauvais schéma) ;
 * - rejette les URLs contenant des credentials embarés (`@`) : plutôt
 *   perdre ce relais que risquer une fuite de secrets en production.
 * Retourne une liste nettoyée (éventuellement vide).
 */
export function parseTurnUrls(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return sanitizeIceUrls(raw.split(","));
}

/**
 * Nettoie une liste d'URLs ICE (défense en profondeur).
 * Filtre : non-strings, vides, schémas invalides, credentials embarqués (`@`).
 * Utilisé par parseTurnUrls ET ré-appliqué DANS buildIceServers pour qu'aucun
 * appelant ne puisse faire transiter une URL invalide / secrète.
 */
export function sanitizeIceUrls(urls: string[] | null | undefined): string[] {
  if (!Array.isArray(urls)) return [];
  const out: string[] = [];
  for (const part of urls) {
    if (typeof part !== "string") continue;
    const u = part.trim();
    if (!u) continue;
    if (!isValidIceUrl(u)) continue;
    if (hasEmbeddedCredentials(u)) continue;
    out.push(u);
  }
  return out;
}

/**
 * Construit la liste RTCIceServer finale.
 *
 * - Si TURN est correctement configuré (URLs valides NON vides + username +
 *   credential présents) → renvoie l'entrée TURN (username/credential inclus,
 *   requis par le navigateur pour s'authentifier auprès du relais TURN).
 * - Sinon → fallback STUN public.
 *
 * Property de sécurité :
 *  - filtre TOUJOURS les URLs d'entrée (schéma valide, pas de credentials
 *    embarqués) — un appelant ne peut pas faire fuiter d'URL/sécret ;
 *  - ne renvoie JAMAIS un TURN "banalisé" (credentials partiels ou absents) ;
 *  - si username ou credential manque → fallback STUN (pas de config cassée
 *    renvoyée silencieusement) ;
 *  - le comportement est déterministe et testable.
 */
export function buildIceServers({
  turnUrls,
  turnUsername,
  turnCredential,
}: {
  turnUrls: string[] | null | undefined;
  turnUsername: string | null | undefined;
  turnCredential: string | null | undefined;
}): RTCIceServer[] {
  const validUrls = sanitizeIceUrls(turnUrls);
  const haveCreds =
    typeof turnUsername === "string" &&
    turnUsername.length > 0 &&
    typeof turnCredential === "string" &&
    turnCredential.length > 0;

  // TURN complet → renvoyer (credentials requis par le navigateur).
  if (validUrls.length > 0 && haveCreds) {
    return [
      {
        urls: validUrls,
        username: turnUsername,
        credential: turnCredential,
      },
    ];
  }

  // TURN absent / mal configuré (URLs invalides ou credentials manquants) →
  // fallback STUN public. Jamais de config vide / cassée renvoyée.
  return PUBLIC_STUN_FALLBACK;
}

/**
 * Extrait le numéro de port d'une URL ICE (stun:/turn:/turns:).
 * Forme supportée : `scheme:host:port[?query]` (et `scheme://host:port`).
 * Retourne null si l'URL ne porte pas de port numérique explicite.
 */
export function iceUrlPort(url: string): number | null {
  if (typeof url !== "string") return null;
  const noScheme = url.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:/, "");
  const noQuery = noScheme.split("?")[0];
  const idx = noQuery.lastIndexOf(":");
  if (idx === -1) return null;
  const port = noQuery.slice(idx + 1);
  if (!/^\d+$/.test(port)) return null;
  const n = Number(port);
  return Number.isSafeInteger(n) ? n : null;
}

/**
 * Indique si une URL ICE utilise un port bloqué (par défaut : le port 53,
 * documenté comme bloqué par Chrome/Firefox et susceptible de timeouter).
 */
export function hasBlockedIcePort(
  url: string,
  blockedPorts: number[] = BLOCKED_ICE_PORTS
): boolean {
  const port = iceUrlPort(url);
  return port !== null && blockedPorts.includes(port);
}

/**
 * Déduplique une liste d'URLs ICE en conservant l'ordre.
 */
export function dedupeIceUrls(urls: string[] | null | undefined): string[] {
  if (!Array.isArray(urls)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    if (typeof u !== "string") continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

/**
 * Normalise et filtre une liste d'URLs d'un serveur ICE.
 * - accepte `urls` passé en string OU string[] ;
 * - valide chaque URL (schéma stun:/turn:/turns:, pas de credentials
 *   embarqués `@`) ;
 * - filtre les ports bloqués (port 53) ;
 * - déduplique ;
 * Retourne une liste propre (éventuellement vide).
 */
export function normalizeIceServerUrls(
  urls: string | string[] | null | undefined
): string[] {
  const list = Array.isArray(urls) ? urls : urls ? [urls] : [];
  const cleaned = sanitizeIceUrls(list);
  const filtered = cleaned.filter((u) => !hasBlockedIcePort(u));
  return dedupeIceUrls(filtered);
}

/**
 * Normalise une réponse de serveurs ICE (format Cloudflare / RTCIceServer[]).
 *
 * Pour chaque entrée :
 *  - `urls` accepté en string OU string[] (normalise, filtre port 53,
 *    déduplique) ;
 *  - si l'entrée contient une URL `turn:`/`turns:`, elle est conservée
 *    UNIQUEMENT si username ET credential sont présents (non vides) — un
 *    relais TURN sans credentials est inutilisable et ne doit jamais être
 *    servi ;
 *  - si l'entrée ne contient que des stun:, elle est conservée sans
 *    credentials (comportement WebRTC standard) ;
 *  - une entrée dont toutes les URLs ont été retirées est écartée ;
 *  - les entrées malformées (non-objets) sont ignorées.
 *
 * Ne log JAMAIS username/credential.
 * Retourne toujours un tableau (éventuellement vide → fallback STUN appelant).
 */
export function normalizeIceServers(raw: unknown): RTCIceServer[] {
  if (!Array.isArray(raw)) return [];

  const out: RTCIceServer[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;

    const urls = normalizeIceServerUrls(e.urls as string | string[] | undefined);
    if (urls.length === 0) continue;

    const hasTurn = urls.some((u) => /^turn:/i.test(u) || /^turns:/i.test(u));
    const hasCreds =
      typeof e.username === "string" && e.username.length > 0 &&
      typeof e.credential === "string" && e.credential.length > 0;

    if (hasTurn && !hasCreds) continue;

    const server: RTCIceServer = { urls };
    if (hasTurn && hasCreds) {
      server.username = e.username as string;
      server.credential = e.credential as string;
    }
    out.push(server);
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────────────────
 * iceTransportPolicy — OUTIL DE TEST TURN RELAY (test-only, opt-in strict)
 *
 * BUT : pouvoir prouver que le relais Cloudflare TURN fonctionne réellement
 * (candidate relay sélectionnée) en IMposant au navigateur de n'utiliser que
 * le relais. Un `iceTransportPolicy` absent = défaut navigateur "all"
 * (P2P + TURN), qui est le comportement PRODUCTION normal.
 *
 * INVARIANTS (ne jamais modifier) :
 *  - "all" reste le défaut ABSOLU : la clé `iceTransportPolicy` ne doit JAMAIS
 *    être présente dans une configuration de production (protégé par
 *    scripts/test-ice-config.ts) ;
 *  - le mode "relay" exige une activation EXPLICITE, donc impossible à activer
 *    par un utilisateur via une query string / un paramètre d'URL ;
 *  - le mode "relay" est refusé si NODE_ENV === "production" : aucune
 *    activation automatique en production, même si le flag est défini ;
 *  - ce module ne lit QUE les valeurs qu'on lui passe (couche PURE) : aucun
 *    accès à process.env, aucun secret, aucun credential TURN ici.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Politique ICE : "all" = défaut navigateur (P2P + TURN), "relay" = TURN seul. */
export type IceTransportPolicy = "all" | "relay";

/**
 * Nom du flag d'activation. Volontairement `NEXT_PUBLIC_*` : Next.js INLINE
 * ces variables au BUILD. L'opt-in est donc figé dans le bundle et ne peut PAS
 * être basculé à l'exécution par un tiers via l'URL ou une entrée utilisateur —
 * c'est ce qui rend l'option non pilotable depuis le client.
 */
export const FORCE_RELAY_ENV_VAR = "NEXT_PUBLIC_APP_CALL_FORCE_RELAY";

/** Valeurs acceptées pour activer le flag (parsing strict, pas de truthiness). */
const TRUTHY_FLAG_VALUES = ["1", "true", "on", "yes"];

/** Interpréte la valeur brute du flag d'activation. */
export function isForceRelayRequested(raw: string | null | undefined): boolean {
  if (typeof raw !== "string") return false;
  return TRUTHY_FLAG_VALUES.includes(raw.trim().toLowerCase());
}

/**
 * Résout la politique ICE applicable.
 *
 * Renvoie "relay" UNIQUEMENT si les DEUX conditions sont réunies :
 *   1. le flag est explicitement activé (build-time, cf. FORCE_RELAY_ENV_VAR) ;
 *   2. l'environnement n'est PAS "production".
 *
 * Sinon renvoie "all" — y compris si le flag est défini en production, ce qui
 * garantit qu'aucun build de production ne puisse forcer le relais par accident
 * (variable manquante, environnement mal configuré, CI, etc).
 */
export function resolveIceTransportPolicy({
  forceRelayRequested,
  nodeEnv,
}: {
  forceRelayRequested: string | null | undefined;
  nodeEnv: string | null | undefined;
}): IceTransportPolicy {
  if (nodeEnv === "production") return "all";
  return isForceRelayRequested(forceRelayRequested) ? "relay" : "all";
}

/**
 * Applique la politique résolue à une configuration RTCPeerConnection.
 *
 * - policy "all" (défaut / production) → configuration INCHANGÉE, et la clé
 *   `iceTransportPolicy` reste ABSENTE (défaut navigateur, pas d'override) ;
 * - policy "relay" (test opt-in uniquement) → `iceTransportPolicy: "relay"`.
 *
 * Ne modifie jamais `iceServers` : les credentials TURN continuent de provenir
 * exclusivement du serveur (/api/app-calls/ice-config).
 */
export function applyIceTransportPolicy<T extends RTCConfiguration>(
  config: T,
  policy: IceTransportPolicy
): T {
  if (policy !== "relay") return config;
  return { ...config, iceTransportPolicy: "relay" };
}