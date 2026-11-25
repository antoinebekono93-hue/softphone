import type { NativeCallEngine } from "./native-call-engine";
import type { NativeCallPresentationState } from "./presentation";
import { IDLE_CALL } from "./active-call-reducer";
import { mapTelnyxCallState } from "./telnyx-event-map";
import {
  MICROPHONE_PERMISSION_DENIED,
  type MicrophonePermissionPort,
} from "./microphone-permission";
import type { NativeAuthorizationOutcome } from "./native-call-authorization";
import {
  telnyxVoiceCapabilities,
  type TelnyxNewCallParams,
  type TelnyxVoiceCallPort,
  type TelnyxVoiceCapabilities,
  type TelnyxVoiceClientPort,
} from "./telnyx-voice-port";

/**
 * Adaptateur `NativeCallEngine` au-dessus du client voix Telnyx React Native.
 *
 * Il ne dépend d'aucun objet SDK concret : le binding natif injecte un
 * `TelnyxVoiceClientPort`. Il ne possède pas sa propre machine à états d'appel
 * globale ; il projette les états fournisseur normalisés dans le modèle Buster
 * Call existant (M2/M3). Invariant conservé : ACTIVE uniquement sur confirmation
 * média/session du fournisseur.
 */
export const NATIVE_MEDIA_ENGINE_STATUS = "PARTIAL" as const;
export type NativeMediaEngineStatus = typeof NATIVE_MEDIA_ENGINE_STATUS;

export const NATIVE_UNSUPPORTED_ERROR = "NATIVE_OPERATION_UNSUPPORTED";

export interface TelnyxNativeCallEngineDeps {
  client: TelnyxVoiceClientPort;
  authorize: (target: string) => Promise<NativeAuthorizationOutcome>;
  microphone: MicrophonePermissionPort;
  now?: () => number;
}

export class TelnyxNativeCallEngine implements NativeCallEngine {
  private readonly client: TelnyxVoiceClientPort;
  private readonly authorize: (target: string) => Promise<NativeAuthorizationOutcome>;
  private readonly microphone: MicrophonePermissionPort;
  private readonly now: () => number;
  private state: NativeCallPresentationState = IDLE_CALL;
  private call: TelnyxVoiceCallPort | null = null;
  private hangupIssued = false;
  private readonly listeners = new Set<(state: NativeCallPresentationState) => void>();

  constructor(deps: TelnyxNativeCallEngineDeps) {
    this.client = deps.client;
    this.authorize = deps.authorize;
    this.microphone = deps.microphone;
    this.now = deps.now ?? (() => Date.now());
  }

  private emit(next: NativeCallPresentationState) {
    this.state = next;
    for (const listener of this.listeners) listener(this.state);
  }

  private patch(patch: Partial<NativeCallPresentationState>) {
    this.emit({ ...this.state, ...patch });
  }

  capabilities(): TelnyxVoiceCapabilities {
    return telnyxVoiceCapabilities(this.call);
  }

  getState(): NativeCallPresentationState {
    return this.state;
  }

  subscribe(listener: (state: NativeCallPresentationState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async startCall(target: string): Promise<void> {
    const trimmed = (target ?? "").trim();
    if (!trimmed) throw new Error("EMPTY_TARGET");

    let permission = await this.microphone.get();
    if (permission !== "granted") permission = await this.microphone.request();
    if (permission !== "granted") throw new Error(MICROPHONE_PERMISSION_DENIED);

    const outcome = await this.authorize(trimmed);
    if (!outcome.ok) {
      this.hangupIssued = false;
      this.patch({ status: "FAILED", failureReason: outcome.reason, direction: "outgoing" });
      throw new Error(outcome.reason);
    }

    this.hangupIssued = false;
    this.patch({
      status: "DIALING",
      displayName: "",
      displayNumber: outcome.authorization.destination,
      avatarUri: null,
      startedAt: null,
      muted: false,
      speaker: false,
      callType: "APP_TO_PSTN",
      direction: "outgoing",
      failureReason: null,
    });

    const params: TelnyxNewCallParams = {
      destinationNumber: outcome.authorization.destination,
      callerNumber: outcome.authorization.callerNumber,
      clientState: outcome.authorization.clientState,
      id: outcome.authorization.attemptId,
      audio: true,
      video: false,
      callType: "APP_TO_PSTN",
    };
    try {
      this.call = await this.client.newCall(params);
    } catch (error) {
      this.patch({
        status: "FAILED",
        failureReason: error instanceof Error ? error.message : "PROVIDER_START_FAILED",
        startedAt: null,
        muted: false,
        speaker: false,
      });
      throw error;
    }
  }

  applyProviderState(rawState: string): void {
    if (!this.call) return;
    const status = mapTelnyxCallState(rawState, this.call.direction);
    if (!status) return;
    if (status === "ACTIVE") {
      this.patch({ status: "ACTIVE", startedAt: this.state.startedAt ?? this.now() });
      return;
    }
    const terminal = status === "ENDED" || status === "FAILED" || status === "MISSED";
    this.patch({
      status,
      ...(terminal ? { startedAt: null, muted: false, speaker: false } : {}),
    });
  }

  async acceptCall(_callId: string): Promise<void> {
    if (!this.call?.answer) throw new Error(NATIVE_UNSUPPORTED_ERROR);
    this.patch({ status: "ACCEPTING" });
    await this.call.answer();
  }

  async rejectCall(_callId: string): Promise<void> {
    this.patch({ status: "DECLINING" });
    await this.hangup();
  }

  async hangup(): Promise<void> {
    if (this.hangupIssued) return;
    this.hangupIssued = true;
    if (this.call) {
      await this.call.hangup();
    }
    this.patch({ status: "ENDING" });
  }

  async setMuted(muted: boolean): Promise<void> {
    const call = this.call;
    if (!call) throw new Error(NATIVE_UNSUPPORTED_ERROR);
    if (muted) {
      if (!call.muteAudio) throw new Error(NATIVE_UNSUPPORTED_ERROR);
      await call.muteAudio();
    } else {
      if (!call.unmuteAudio) throw new Error(NATIVE_UNSUPPORTED_ERROR);
      await call.unmuteAudio();
    }
    this.patch({ muted });
  }

  async setSpeaker(_speaker: boolean): Promise<void> {
    throw new Error(NATIVE_UNSUPPORTED_ERROR);
  }

  async sendDTMF(digit: string): Promise<void> {
    if (!this.call?.dtmf) throw new Error(NATIVE_UNSUPPORTED_ERROR);
    await this.call.dtmf(digit);
  }

  disconnect(): void | Promise<void> {
    this.call = null;
    this.hangupIssued = false;
    this.emit(IDLE_CALL);
    return this.client.disconnect?.();
  }
}
