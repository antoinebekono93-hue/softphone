import type { NativeCallPresentationState } from "./presentation";

export interface NativeCallEngine {
  startCall(target: string): Promise<void>;
  acceptCall(callId: string): Promise<void>;
  rejectCall(callId: string): Promise<void>;
  hangup(): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
  setSpeaker(speaker: boolean): Promise<void>;
  sendDTMF(digit: string): Promise<void>;
  getState(): NativeCallPresentationState;
  subscribe(listener: (state: NativeCallPresentationState) => void): () => void;
}

export type NativeCallEngineStatus = "NOT_IMPLEMENTED" | "READY";

export const NATIVE_CALL_ENGINE_STATUS: NativeCallEngineStatus = "NOT_IMPLEMENTED";

export const NATIVE_CALL_CAPABILITIES = {
  media: false,
  audioRouting: false,
  dtmf: false,
} as const;
