import type { NativeCallType } from "./presentation";

export interface NativeIncomingCallSignal {
  callId: string;
  from: string;
  displayName?: string | null;
  callType: NativeCallType;
  timestamp: number;
}

export type NativePushStatus = "NOT_IMPLEMENTED" | "READY";

export const NATIVE_PUSH_STATUS: NativePushStatus = "NOT_IMPLEMENTED";
