import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildTurnIceConfig } from "@/lib/turn-cloudflare";

export const dynamic = "force-dynamic";

/**
 * Codes d'erreur internes classifiés et sûrs (aucun secret) relatifs au TURN.
 * Seule source autorisée pour le log de diagnostic — toute valeur hors liste
 * est remplacée par TURN_ERROR (défense contre un futur message brut).
 */
const SAFE_TURN_ERROR_CODES = new Set([
  "Unauthorized",
  "TURN_SERVICE_NOT_CONFIGURED",
  "TURN_AUTH_FAILED",
  "TURN_RATE_LIMITED",
  "TURN_INVALID_RESPONSE",
  "TURN_UNREACHABLE",
  "TURN_UPSTREAM_ERROR",
]);

/**
 * Renvoie la configuration ICE (STUN/TURN) à utiliser pour les appels APP_TO_APP.
 *
 * Le TURN utilise Cloudflare Realtime (credentials TEMPORAIRES) :
 *   Browser → GET /api/app-calls/ice-config
 *           → (serveur) POST rtc.live.cloudflare.com/v1/turn/keys/{keyId}/credentials/generate-ice-servers
 *           → { iceServers } (temporaires) → RTCPeerConnection
 *
 * Garanties de sécurité :
 *  - Authentification requise (401 sinon).
 *  - CLOUDFLARE_TURN_KEY_ID / CLOUDFLARE_TURN_API_TOKEN restent EXCLUSIVEMENT
 *    côté serveur (lus via process.env ici) — jamais dans le bundle, jamais
 *    dans NEXT_PUBLIC_*.
 *  - Si les variables sont absentes → 503 `TURN_SERVICE_NOT_CONFIGURED`
 *    (erreur explicite côté serveur, AUCUN secret) — jamais de placeholder.
 *  - La réponse contient uniquement `{ iceServers }` (credentials temporaires
 *    requis par WebRTC) : ni TURN_KEY_ID, ni token, ni env, ni headers.
 *  - Cache-Control: no-store → jamais de mise en cache des credentials.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Durée maximale de l'appel (fair-use du PricingPlan) pour dimensionner le
  // TTL des credentials. Une panne DB ne bloque PAS la route : on retombe sur
  // le TTL par défaut (getTurnCredentialTtl sait gérer null).
  let maxCallDurationSeconds: number | null = null;
  if (session.user.organizationId) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: {
          pricingPlan: { select: { maxCallDurationSeconds: true } },
        },
      });
      maxCallDurationSeconds =
        org?.pricingPlan?.maxCallDurationSeconds ?? null;
    } catch {
      maxCallDurationSeconds = null;
    }
  }

  const result = await buildTurnIceConfig({
    organizationId: session.user.organizationId,
    keyId: process.env.CLOUDFLARE_TURN_KEY_ID,
    apiToken: process.env.CLOUDFLARE_TURN_API_TOKEN,
    maxCallDurationSeconds,
  });

  if (!result.ok) {
    // Log défensif : on ne log QUE le code d'erreur interne déjà classifié,
    // jamais le contenu brut d'une erreur/provenant du réseau. Codes connus
    // uniquement ; toute valeur inattendue est remplacée par un code générique
    // (aucun message brut, token, credential ou URL ne peut transiter).
    const safeCode = SAFE_TURN_ERROR_CODES.has(result.error)
      ? result.error
      : "TURN_ERROR";
    console.warn(
      `[ice-config] TURN error: ${safeCode} (status ${result.status}, ttlBase=${maxCallDurationSeconds ?? "default"})`
    );
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const res = NextResponse.json({ iceServers: result.iceServers });
  res.headers.set("Cache-Control", "no-store");
  return res;
}