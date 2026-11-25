import type { NativeCallType } from "./presentation";

/**
 * Port de liaison vers le client voix Telnyx pour React Native. Buster Call ne
 * dépend jamais directement des objets du SDK : il ne consomme que cette surface
 * minimale, injectée par le binding natif. Aucun import natif ici → testable
 * sans SDK.
 */
export type TelnyxVoiceDirection = "incoming" | "outgoing";

export interface TelnyxNewCallParams {
  destinationNumber: string;
  callerNumber?: string;
  clientState?: string;
  id?: string;
  audio?: boolean;
  video?: boolean;
  callType?: NativeCallType;
}

export interface TelnyxVoiceCallPort {
  readonly id: string;
  readonly direction: TelnyxVoiceDirection;
  readonly state: string;
  readonly remoteCallerNumber?: string | null;
  readonly callerNumber?: string | null;
  hangup(): void | Promise<void>;
  answer?(): void | Promise<void>;
  muteAudio?(): void | Promise<void>;
  unmuteAudio?(): void | Promise<void>;
  dtmf?(digit: string): void | Promise<void>;
}

export interface TelnyxVoiceClientPort {
  newCall(params: TelnyxNewCallParams): TelnyxVoiceCallPort | Promise<TelnyxVoiceCallPort>;
  disconnect?(): void | Promise<void>;
}

export interface TelnyxVoiceCapabilities {
  readonly mute: boolean;
  readonly dtmf: boolean;
  readonly audioRouting: boolean;
}

export function telnyxVoiceCapabilities(call: TelnyxVoiceCallPort | null): TelnyxVoiceCapabilities {
  return {
    mute:
      typeof call?.muteAudio === "function" && typeof call?.unmuteAudio === "function",
    dtmf: typeof call?.dtmf === "function",
    audioRouting: false,
  };
}
