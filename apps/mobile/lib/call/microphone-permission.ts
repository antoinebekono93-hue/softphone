/**
 * Port de permission microphone. Le binding natif (dev build) fournit une
 * implémentation réelle (expo-audio ou permissions natives) ; iOS déclare
 * `NSMicrophoneUsageDescription`, Android `RECORD_AUDIO`. Aucun appel ne peut
 * démarrer si la permission n'est pas accordée.
 */
export type MicrophonePermission = "granted" | "denied" | "undetermined";

export interface MicrophonePermissionPort {
  get(): Promise<MicrophonePermission>;
  request(): Promise<MicrophonePermission>;
}

export const MICROPHONE_PERMISSION_DENIED = "MICROPHONE_PERMISSION_DENIED";

export function createGrantedMicrophonePermission(): MicrophonePermissionPort {
  return {
    async get() {
      return "granted";
    },
    async request() {
      return "granted";
    },
  };
}
