import type { CallRouteType } from "@buster/shared";

export type NativeCallStatus =
  | "IDLE"
  | "DIALING"
  | "RINGING"
  | "CONNECTING"
  | "ACTIVE"
  | "ENDING"
  | "ENDED"
  | "FAILED"
  | "INCOMING"
  | "ACCEPTING"
  | "DECLINING"
  | "MISSED";

export type NativeCallType = CallRouteType | "PSTN_TO_APP";

export type NativeCallDirection = "incoming" | "outgoing";

export interface NativeCallPresentationState {
  status: NativeCallStatus;
  displayName: string;
  displayNumber: string;
  avatarUri?: string | null;
  startedAt?: number | null;
  muted: boolean;
  speaker: boolean;
  callType?: NativeCallType;
  direction?: NativeCallDirection;
  failureReason?: string | null;
}

const STATUS_LABELS: Record<NativeCallStatus, string> = {
  IDLE: "",
  DIALING: "Appel en cours…",
  RINGING: "Sonnerie…",
  CONNECTING: "Connexion…",
  ACTIVE: "",
  ENDING: "Fin de l'appel…",
  ENDED: "Appel terminé",
  FAILED: "",
  INCOMING: "Appel entrant",
  ACCEPTING: "Connexion…",
  DECLINING: "Refus de l'appel…",
  MISSED: "Appel manqué",
};

const SOURCE_LABELS: Record<NativeCallType, string> = {
  APP_TO_APP: "Buster Call",
  APP_TO_PSTN: "Appel téléphonique",
  PSTN_TO_APP: "Appel téléphonique",
};

const DEFAULT_FAILURE = "Appel impossible pour le moment.";

export function callStatusLabel(state: NativeCallPresentationState): string {
  if (state.status === "FAILED") {
    const reason = state.failureReason?.trim();
    return reason || DEFAULT_FAILURE;
  }
  return STATUS_LABELS[state.status];
}

export function isDurationVisible(state: NativeCallPresentationState): boolean {
  return state.status === "ACTIVE" && typeof state.startedAt === "number" && state.startedAt > 0;
}

export function formatDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function initialsFromName(name?: string | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part.charAt(0).toUpperCase()).join("");
  return letters.slice(0, 2);
}

export function callerPrimaryLabel(state: NativeCallPresentationState): string {
  const name = state.displayName?.trim();
  if (name) return name;
  const number = state.displayNumber?.trim();
  return number || "Numéro inconnu";
}

export function callerSecondaryLabel(state: NativeCallPresentationState): string | null {
  const name = state.displayName?.trim();
  if (!name) return null;
  const number = state.displayNumber?.trim();
  return number || null;
}

export function isTerminalStatus(status: NativeCallStatus): boolean {
  return status === "ENDED" || status === "FAILED" || status === "MISSED";
}

export function isIncomingState(state: NativeCallPresentationState): boolean {
  return state.direction === "incoming";
}

export function callSourceLabel(state: NativeCallPresentationState): string {
  const type = state.callType;
  if (type && type in SOURCE_LABELS) return SOURCE_LABELS[type];
  return "Appel téléphonique";
}
