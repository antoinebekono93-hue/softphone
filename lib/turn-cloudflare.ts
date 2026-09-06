/**
 * Client serveur Cloudflare Realtime TURN (credentials TEMPORAIRES).
 *
 * Uniquement importé côté serveur (route /api/app-calls/ice-config) :
 *  - NE JAMAIS importer depuis un composant client ;
 *  - NE JAMAIS exposer CLOUDFLARE_TURN_KEY_ID / CLOUDFLARE_TURN_API_TOKEN au
 *    navigateur (pas de NEXT_PUBLIC_*) ;
 *  - les credentials TURN retournés par Cloudflare sont TEMPORAIRES (TTL) :
 *    ils DOIVENT transiter vers le navigateur pour que RTCPeerConnection puisse
 *    s'authentifier auprès du relais, mais ne sont JAMAIS persistés en DB.
 *
 * API officielle (201 Created) :
 *   POST https://rtc.live.cloudflare.com/v1/turn/keys/{keyId}/credentials/generate-ice-servers
 *   Authorization: Bearer {apiToken}
 *   Content-Type: application/json
 *   { "ttl": <seconds> }
 *
 * Références :
 *   https://developers.cloudflare.com/realtime/turn/
 *   https://developers.cloudflare.com/realtime/turn/generate-credentials/
 */

import { normalizeIceServers, PUBLIC_STUN_FALLBACK } from "@/lib/ice-config";

/** Base de l'API Cloudflare Realtime (TURN). */
export const CLOUDFLARE_TURN_API_BASE =
  "https://rtc.live.cloudflare.com/v1/turn/keys";

// ── TTL ────────────────────────────────────────────────────────────────────────

/** TTL minimal raisonnable (10 minutes) — jamais de credentials en-dessous. */
export const TURN_TTL_MIN_SECONDS = 600;
/** TTL maximal raisonnable (24 h) — évite des credentials excessivement longs. */
export const TURN_TTL_MAX_SECONDS = 86_400;
/** Durée d'appel par défaut quand maxCallDurationSeconds est indisponible. */
export const TURN_DEFAULT_MAX_CALL_SECONDS = 3_600;
/** Marge ajoutée au maxCallDurationSeconds pour couvrir sonnerie/negotiation. */
export const TURN_TTL_MARGIN_SECONDS = 600;

/**
 * Détermine le TTL des credentials TURN Cloudflare.
 *
 * Le TTL DOIT être supérieur à la durée maximale attendue d'utilisation du
 * TURN (maxCallDurationSeconds + marge sonnerie/negotiation), borné entre
 * TURN_TTL_MIN_SECONDS et TURN_TTL_MAX_SECONDS.
 *
 * Fonction PURE (aucune lecture d'environnement) → testable.
 */
export function getTurnCredentialTtl(
  maxCallDurationSeconds: number | null | undefined
): number {
  const base =
    typeof maxCallDurationSeconds === "number" &&
    Number.isFinite(maxCallDurationSeconds) &&
    maxCallDurationSeconds > 0
      ? Math.floor(maxCallDurationSeconds)
      : TURN_DEFAULT_MAX_CALL_SECONDS;

  const ttl = base + TURN_TTL_MARGIN_SECONDS;
  return Math.min(TURN_TTL_MAX_SECONDS, Math.max(TURN_TTL_MIN_SECONDS, ttl));
}

// ── Erreurs typées ──────────────────────────────────────────────────────────────

/**
 * Erreur typée du client Cloudflare TURN.
 * Le message ne contient JAMAIS de secrets (pas de token, pas d'URL d'API,
 * pas de headers) — uniquement un code exploitable par la route.
 */
export type TurnApiErrorKind =
  | "NOT_CONFIGURED"
  | "AUTH"
  | "RATE_LIMITED"
  | "UPSTREAM"
  | "NETWORK"
  | "MALFORMED";

export class TurnApiError extends Error {
  readonly kind: TurnApiErrorKind;
  readonly status: number | null;

  constructor(kind: TurnApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "TurnApiError";
    this.kind = kind;
    this.status = status ?? null;
  }
}

// ── Appel Cloudflare ────────────────────────────────────────────────────────────

export type FetchImpl = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
    cache: RequestCache;
  }
) => Promise<{
  status: number;
  json(): Promise<unknown>;
}>;

/**
 * Appelle l'API Cloudflare pour générer des credentials TURN temporaires.
 *
 * - `fetchImpl` injectable (tests via mock) ; défaut : `fetch` global.
 * - Vérifie le statut HTTP (201 attendu) et la présence de `iceServers`.
 * - Retourne les iceServers BRUTS (la normalisation/filtrage se fait dans la
 *   route via normalizeIceServers).
 * - Ne log/ne retient aucun secret ; les erreurs sont typées et sans secret.
 *
 * @throws TurnApiError :
 *  - AUTH        : 401/403 (token API invalide/révoqué)
 *  - RATE_LIMITED: 429
 *  - UPSTREAM    : autre statut >= 400 ou réseau/erreur parse JSON
 *  - NETWORK     : fetch a lancé (DNS/TLS/connectivité)
 *  - MALFORMED   : 201 mais iceServers absent / non-array
 */
export async function generateCloudflareIceServers({
  keyId,
  apiToken,
  ttl,
  fetchImpl = fetch as unknown as FetchImpl,
}: {
  keyId: string;
  apiToken: string;
  ttl: number;
  fetchImpl?: FetchImpl;
}): Promise<RTCIceServer[]> {
  if (!keyId || !apiToken) {
    throw new TurnApiError("NOT_CONFIGURED", "TURN service not configured");
  }

  const url = `${CLOUDFLARE_TURN_API_BASE}/${encodeURIComponent(keyId)}/credentials/generate-ice-servers`;

  let res: Awaited<ReturnType<FetchImpl>>;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl }),
      cache: "no-store",
    });
  } catch {
    throw new TurnApiError("NETWORK", "TURN upstream unreachable");
  }

  if (res.status === 401 || res.status === 403) {
    throw new TurnApiError("AUTH", "TURN credentials rejected", res.status);
  }
  if (res.status === 429) {
    throw new TurnApiError("RATE_LIMITED", "TURN rate limited", res.status);
  }
  if (res.status !== 201) {
    throw new TurnApiError("UPSTREAM", "TURN upstream failure", res.status);
  }

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new TurnApiError("MALFORMED", "TURN response not JSON");
  }

  const data = (parsed ?? {}) as { iceServers?: unknown };
  if (!Array.isArray(data.iceServers)) {
    throw new TurnApiError("MALFORMED", "TURN response missing iceServers");
  }
  return data.iceServers as RTCIceServer[];
}

// ── Build config route ──────────────────────────────────────────────────────────

export type IceConfigResult =
  | { ok: true; iceServers: RTCIceServer[] }
  | { ok: false; status: number; error: string };

/**
 * Construit la config ICE à servir au navigateur (logique de la route,
 * isolée pour être testable sans route Next.js ni env réels).
 *
 * - `organizationId` null/absent → 401 (auth insuffisante).
 * - `keyId`/`apiToken` absents → 503 TURN_SERVICE_NOT_CONFIGURED (erreur
 *   explicite côté serveur, AUCUN secret) — ne crée PAS de placeholder.
 * - Sinon : TTL calculé via getTurnCredentialTtl(maxCallDurationSeconds),
 *   appel Cloudflare (via `generate` injecté), normalisation des iceServers
 *   (filtrage port 53 notamment), fallback STUN-only si plus rien de valide.
 * - Aucune erreur ne contient de secret (codes machine uniquement).
 */
export async function buildTurnIceConfig({
  organizationId,
  keyId,
  apiToken,
  maxCallDurationSeconds,
  generate = generateCloudflareIceServers,
}: {
  organizationId: string | null | undefined;
  keyId: string | null | undefined;
  apiToken: string | null | undefined;
  maxCallDurationSeconds?: number | null;
  generate?: (args: {
    keyId: string;
    apiToken: string;
    ttl: number;
  }) => Promise<RTCIceServer[]>;
}): Promise<IceConfigResult> {
  if (!organizationId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  if (!keyId || !apiToken) {
    // Absence des variables = TURN non configuré. Jamais de placeholder,
    // jamais de message révélant quoi que ce soit d'interne.
    return { ok: false, status: 503, error: "TURN_SERVICE_NOT_CONFIGURED" };
  }

  const ttl = getTurnCredentialTtl(maxCallDurationSeconds);

  let raw: RTCIceServer[];
  try {
    raw = await generate({ keyId, apiToken, ttl });
  } catch (err) {
    const kind = err instanceof TurnApiError ? err.kind : "UPSTREAM";
    switch (kind) {
      case "AUTH":
        return { ok: false, status: 502, error: "TURN_AUTH_FAILED" };
      case "RATE_LIMITED":
        return { ok: false, status: 503, error: "TURN_RATE_LIMITED" };
      case "MALFORMED":
        return { ok: false, status: 502, error: "TURN_INVALID_RESPONSE" };
      case "NETWORK":
        return { ok: false, status: 502, error: "TURN_UNREACHABLE" };
      default:
        return { ok: false, status: 502, error: "TURN_UPSTREAM_ERROR" };
    }
  }

  // Normalisation : filtrage URLs invalides/port 53, dedup, drop TURN sans
  // credentials. Si plus rien de valide (ex. tout sur port 53) → fallback
  // STUN public ONLY (le client voit « pas de TURN », jamais de TURN cassé).
  const iceServers = normalizeIceServers(raw);
  return {
    ok: true,
    iceServers: iceServers.length > 0 ? iceServers : PUBLIC_STUN_FALLBACK,
  };
}