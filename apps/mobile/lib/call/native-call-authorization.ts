import type { ApiClient } from "../api";

/**
 * Handshake d'autorisation d'appel PSTN natif. Réutilise le pipeline serveur
 * autoritatif existant (`POST /api/telnyx/preauthorize`) : vérification plan /
 * destination / solde / concurrence, création du CallLog et génération du
 * `clientState` qui corrèle la jambe Telnyx au CallLog via webhook. Aucun
 * système de facturation parallèle n'est introduit.
 */
export interface NativeCallAuthorization {
  attemptId: string;
  destination: string;
  callerNumber: string;
  clientState: string;
}

export type NativeAuthorizationOutcome =
  | { ok: true; authorization: NativeCallAuthorization }
  | { ok: false; reason: string };

export const NATIVE_CALL_AUTHORIZATION_STATUS = "READY";

export function createNativeCallAuthorization(api: ApiClient) {
  return async (target: string, callerId?: string): Promise<NativeAuthorizationOutcome> => {
    const trimmed = (target ?? "").trim();
    if (!trimmed) return { ok: false, reason: "EMPTY_TARGET" };
    try {
      const data = await api.post<
        Partial<NativeCallAuthorization> & { error?: string }
      >("/api/telnyx/preauthorize", {
        target: trimmed,
        ...(callerId ? { callerId } : {}),
      });
      if (!data?.attemptId || !data.destination || !data.callerNumber || !data.clientState) {
        return { ok: false, reason: data?.error || "INVALID_AUTHORIZATION_RESPONSE" };
      }
      return {
        ok: true,
        authorization: {
          attemptId: data.attemptId,
          destination: data.destination,
          callerNumber: data.callerNumber,
          clientState: data.clientState,
        },
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "PREAUTHORIZATION_FAILED";
      return { ok: false, reason };
    }
  };
}
