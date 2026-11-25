import type { ApiClient } from "../api";

/**
 * Frontière d'authentification Telnyx natif. Le client demande un jeton de
 * connexion court à durée limitée au backend Buster Call authentifié
 * (`GET /api/telnyx/token`). Aucun secret Telnyx (clé API, mot de passe SIP,
 * secret de connexion) n'est embarqué dans le bundle Expo.
 *
 * Tant que l'authentification native (migration Nhost) n'est pas résolue, aucun
 * jeton de session n'est disponible : l'acquisition de jeton reste BLOQUÉE et
 * l'architecture média est livrée sans activation en production.
 */
export type NativeTelnyxAuthStatus = "READY" | "BLOCKED_BY_NATIVE_AUTH";

export const NATIVE_TELNYX_AUTH_STATUS: NativeTelnyxAuthStatus = "BLOCKED_BY_NATIVE_AUTH";

export interface NativeTelnyxTokenReady {
  status: "READY";
  token: string;
}

export interface NativeTelnyxTokenBlocked {
  status: "BLOCKED_BY_NATIVE_AUTH";
  reason: string;
}

export type NativeTelnyxTokenResult = NativeTelnyxTokenReady | NativeTelnyxTokenBlocked;

export interface NativeTelnyxTokenDeps {
  api: ApiClient;
  getAccessToken: () => Promise<string | null>;
}

export function createNativeTelnyxTokenProvider(deps: NativeTelnyxTokenDeps) {
  return async (): Promise<NativeTelnyxTokenResult> => {
    let accessToken: string | null = null;
    try {
      accessToken = await deps.getAccessToken();
    } catch {
      accessToken = null;
    }
    if (!accessToken) {
      return { status: "BLOCKED_BY_NATIVE_AUTH", reason: "NO_NATIVE_SESSION_TOKEN" };
    }
    try {
      const data = await deps.api.get<{ token?: string; error?: string }>("/api/telnyx/token");
      if (!data?.token) {
        return { status: "BLOCKED_BY_NATIVE_AUTH", reason: data?.error || "TOKEN_UNAVAILABLE" };
      }
      return { status: "READY", token: data.token };
    } catch (error) {
      return {
        status: "BLOCKED_BY_NATIVE_AUTH",
        reason: error instanceof Error ? error.message : "TOKEN_UNAVAILABLE",
      };
    }
  };
}
