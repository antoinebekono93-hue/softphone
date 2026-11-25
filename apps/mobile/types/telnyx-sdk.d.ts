declare module "@telnyx/react-native-voice-sdk" {
  export interface TelnyxSdkClientOptions {
    login_token?: string;
    login?: string;
    password?: string;
    environment?: string;
    debug?: boolean;
    pushNotificationDeviceToken?: string;
    pushWhenActive?: boolean;
  }

  export type TelnyxCallDirection = "inbound" | "outbound";
  export type TelnyxCallState =
    | "new"
    | "ringing"
    | "connecting"
    | "active"
    | "ended"
    | "held"
    | "dropped";

  export class Call {
    readonly callId: string;
    readonly direction: TelnyxCallDirection;
    readonly state: TelnyxCallState;
    answer(customHeaders?: { name: string; value: string }[]): Promise<void>;
    hangup(customHeaders?: { name: string; value: string }[]): void;
    mute(): void;
    unmute(): void;
    dtmf(digits: string): Promise<void>;
  }

  export interface TelnyxNewSdkCallOptions {
    destinationNumber?: string;
    callerIdNumber?: string;
    callerIdName?: string;
    clientState?: string;
    audio?: boolean | Record<string, unknown>;
    customHeaders?: { name: string; value: string }[];
  }

  export class TelnyxRTC {
    constructor(options: TelnyxSdkClientOptions);
    connect(): Promise<unknown>;
    disconnect(): void;
    newCall(options: TelnyxNewSdkCallOptions): Promise<Call>;
    on(event: "telnyx.call.stateChanged", listener: (call: Call, state: string) => void): void;
    on(event: "telnyx.client.error", listener: (error: Error) => void): void;
    on(event: string, listener: (...args: unknown[]) => void): void;
  }
}
