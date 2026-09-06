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