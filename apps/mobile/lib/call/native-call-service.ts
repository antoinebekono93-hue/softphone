import type { CallRoute } from "@buster/shared";
import type { ApiClient } from "../api";

export type NativeCallExecutionStatus = "WIRED" | "PARTIAL" | "BLOCKED_BY_WEBRTC_PROVIDER";

/**
 * The server routing decision is reachable from native, but the media handoff
 * (Telnyx WebRTC / App-to-App RTCPeerConnection) is browser-only today, so the
 * native execution path is intentionally PARTIAL.
 */
export const NATIVE_CALL_EXECUTION: NativeCallExecutionStatus = "PARTIAL";

export interface NativeCallService {
  resolveRoute(target: string): Promise<CallRoute>;
  isExecutable(): boolean;
}

export function createNativeCallService(api: ApiClient): NativeCallService {
  return {
    async resolveRoute(target: string): Promise<CallRoute> {
      const trimmed = (target ?? "").trim();
      if (!trimmed) throw new Error("EMPTY_TARGET");
      const data = await api.post<{ route?: CallRoute; error?: string }>("/api/call-route", {
        target: trimmed,
      });
      const route = data?.route;
      if (
        !route ||
        typeof route.destination !== "string" ||
        !route.destination ||
        (route.type !== "APP_TO_APP" && route.type !== "APP_TO_PSTN")
      ) {
        throw new Error(data?.error || "INVALID_CALL_ROUTE");
      }
      return route;
    },
    isExecutable() {
      return false;
    },
  };
}
