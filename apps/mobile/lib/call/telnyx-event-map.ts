import type { NativeCallStatus } from "./presentation";
import type { TelnyxVoiceDirection } from "./telnyx-voice-port";

/**
 * Normalisation des états fournisseur Telnyx vers les états Buster Call.
 * L'UI ne consomme jamais un enum Telnyx brut. Un état inconnu renvoie `null`
 * (transition ignorée) : un état non reconnu ne doit JAMAIS produire ACTIVE.
 */
const OUTGOING_STATES: Record<string, NativeCallStatus> = {
  new: "DIALING",
  trying: "DIALING",
  requesting: "DIALING",
  recovering: "DIALING",
  early: "RINGING",
  ringing: "RINGING",
  connecting: "CONNECTING",
  active: "ACTIVE",
  held: "ACTIVE",
  hangup: "ENDING",
  destroy: "ENDED",
  ended: "ENDED",
  purge: "ENDED",
  dropped: "FAILED",
  failed: "FAILED",
  fail: "FAILED",
  error: "FAILED",
};

const INCOMING_STATES: Record<string, NativeCallStatus> = {
  new: "INCOMING",
  trying: "INCOMING",
  requesting: "INCOMING",
  early: "INCOMING",
  ringing: "INCOMING",
  connecting: "CONNECTING",
  active: "ACTIVE",
  held: "ACTIVE",
  hangup: "ENDING",
  destroy: "ENDED",
  ended: "ENDED",
  purge: "ENDED",
  dropped: "FAILED",
  failed: "FAILED",
  fail: "FAILED",
  error: "FAILED",
};

export function mapTelnyxCallState(
  rawState: string,
  direction: TelnyxVoiceDirection,
): NativeCallStatus | null {
  if (typeof rawState !== "string") return null;
  const key = rawState.trim().toLowerCase();
  if (!key) return null;
  const table = direction === "incoming" ? INCOMING_STATES : OUTGOING_STATES;
  return table[key] ?? null;
}

export function isProviderFailureState(rawState: string): boolean {
  if (typeof rawState !== "string") return false;
  const key = rawState.trim().toLowerCase();
  return key === "failed" || key === "fail" || key === "error" || key === "dropped";
}

export function isProviderTerminalState(rawState: string): boolean {
  if (typeof rawState !== "string") return false;
  const key = rawState.trim().toLowerCase();
  return (
    key === "destroy" || key === "purge" || key === "hangup" || key === "ended" || key === "dropped"
  );
}
