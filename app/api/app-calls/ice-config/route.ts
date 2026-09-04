import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * Renvoie la configuration ICE (STUN/TURN) à utiliser pour les appels APP_TO_APP.
 *
 * - Authentification requise (401 sinon).
 * - TURN configuré si les 3 variables d'environnement sont présentes.
 * - Fallback : STUN public Google si aucun TURN n'est configuré.
 * - Les credentials TURN ne sont jamais exposés côté client via NEXT_PUBLIC_*.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const iceServers: RTCIceServer[] = [];

  // ── TURN ──────────────────────────────────────────────────────────────────
  const turnUrls = process.env.TURN_URLS;
  const turnUsername = process.env.TURN_USERNAME;
  const turnCredential = process.env.TURN_CREDENTIAL;

  if (turnUrls && turnUsername && turnCredential) {
    const urls = turnUrls.split(",").map((u) => u.trim()).filter(Boolean);
    if (urls.length > 0) {
      iceServers.push({ urls, username: turnUsername, credential: turnCredential });
      console.log("[ice-config] TURN available (%d URL(s))", urls.length);
    }
  } else {
    console.log("[ice-config] TURN not configured — using STUN only");
  }

  // ── STUN fallback ─────────────────────────────────────────────────────────
  if (iceServers.length === 0) {
    iceServers.push(
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    );
  }

  return NextResponse.json({ iceServers });
}
