import type { StatusDotTone } from "@/components/ui/status-dot";

export type PstnCallState = "idle" | "ringing" | "connecting" | "active" | "held" | "error";

export type AppCallStatus =
  | "idle"
  | "OFFERING"
  | "RINGING"
  | "CONNECTING"
  | "ACTIVE"
  | "ENDED"
  | "MISSED"
  | "DECLINED"
  | "FAILED";

export const PSTN_STATUS_TEXT: Record<PstnCallState, string> = {
  idle: "Au repos",
  ringing: "Sonnerie",
  connecting: "Connexion…",
  active: "En communication",
  held: "En attente",
  error: "Erreur",
};

export const APP_STATUS_TEXT: Record<AppCallStatus, string> = {
  idle: "Au repos",
  OFFERING: "Appel offert",
  RINGING: "Appel entrant interne",
  CONNECTING: "Connexion…",
  ACTIVE: "En communication",
  ENDED: "Terminé",
  MISSED: "Manqué",
  DECLINED: "Refusé",
  FAILED: "Échec",
};

export function pstnTone(state: PstnCallState): StatusDotTone {
  switch (state) {
    case "active":
      return "success";
    case "ringing":
    case "connecting":
      return "info";
    case "held":
      return "warning";
    case "error":
      return "danger";
    default:
      return "neutral";
  }
}

export function pstnPulse(state: PstnCallState): boolean {
  return state === "ringing" || state === "connecting";
}

export function appTone(status: AppCallStatus): StatusDotTone {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "OFFERING":
    case "RINGING":
    case "CONNECTING":
      return "info";
    case "MISSED":
    case "DECLINED":
    case "FAILED":
      return "danger";
    default:
      return "neutral";
  }
}

export function appPulse(status: AppCallStatus): boolean {
  return status === "OFFERING" || status === "RINGING" || status === "CONNECTING";
}