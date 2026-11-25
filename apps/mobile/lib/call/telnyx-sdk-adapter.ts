import { TelnyxRTC, type Call } from "@telnyx/react-native-voice-sdk";
import type {
  TelnyxNewCallParams,
  TelnyxVoiceCallPort,
  TelnyxVoiceClientPort,
  TelnyxVoiceDirection,
} from "./telnyx-voice-port";

/**
 * Binding natif : traduit le client Telnyx RTC concret en port Buster Call.
 * Ce fichier est le seul à importer le SDK ; toute la logique métier reste
 * dans les modules purs et testables sans appareil.
 */
export interface TelnyxSdkClientDeps {
  loginToken: string;
  onProviderState: (rawState: string) => void;
  onProviderError?: (error: unknown) => void;
}

export interface TelnyxSdkClient extends TelnyxVoiceClientPort {
  connect(): Promise<void>;
}

class TelnyxSdkCallPort implements TelnyxVoiceCallPort {
  constructor(private readonly call: Call) {}

  get id(): string {
    return this.call.callId;
  }

  get direction(): TelnyxVoiceDirection {
    return this.call.direction === "inbound" ? "incoming" : "outgoing";
  }

  get state(): string {
    return this.call.state;
  }

  hangup(): void {
    this.call.hangup();
  }

  answer(): Promise<void> {
    return this.call.answer();
  }

  muteAudio(): void {
    this.call.mute();
  }

  unmuteAudio(): void {
    this.call.unmute();
  }

  dtmf(digits: string): Promise<void> {
    return this.call.dtmf(digits);
  }
}

export function createTelnyxSdkClient(deps: TelnyxSdkClientDeps): TelnyxSdkClient {
  const client = new TelnyxRTC({ login_token: deps.loginToken });

  client.on("telnyx.call.stateChanged", (_call, state) => {
    deps.onProviderState(state);
  });
  client.on("telnyx.client.error", (error) => {
    deps.onProviderError?.(error);
  });

  return {
    connect: async () => {
      await client.connect();
    },
    newCall: async (params: TelnyxNewCallParams): Promise<TelnyxVoiceCallPort> => {
      const call = await client.newCall({
        destinationNumber: params.destinationNumber,
        ...(params.callerNumber ? { callerIdNumber: params.callerNumber } : {}),
        ...(params.clientState ? { clientState: params.clientState } : {}),
        audio: params.audio ?? true,
      });
      return new TelnyxSdkCallPort(call);
    },
    disconnect: () => client.disconnect(),
  };
}
