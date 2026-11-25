import type { PhoneTab } from "./call";

export const BRAND_NAME = "Buster Call";
export const BRAND_TAGLINE = "APPELEZ PLUS LOIN";

export interface TabDefinition {
  id: PhoneTab;
  label: string;
}

export const PHONE_TABS: readonly TabDefinition[] = [
  { id: "favorites", label: "Favoris" },
  { id: "recents", label: "Récents" },
  { id: "contacts", label: "Contacts" },
  { id: "dialer", label: "Clavier" },
  { id: "messages", label: "Messagerie" },
] as const;

export const CALL_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Non authentifié",
  NO_ORGANIZATION: "Organisation introuvable",
  SELF_CALL: "Impossible de s'appeler soi-même",
  TARGET_NOT_CALLABLE: "Cette personne n'est pas joignable par appel",
  AMBIGUOUS_INTERNAL_TARGET: "Cette identité interne est ambiguë.",
  EMPTY_TARGET: "Destination vide",
  NOT_APP_TO_APP_DESTINATION: "Destination externe",
  CALLEE_NOT_FOUND: "Utilisateur introuvable",
  MAX_CONCURRENT_CALLS: "Trop d'appels simultanés (fair-use)",
  MAX_CALLS_PER_HOUR: "Limite horaire atteinte (fair-use)",
  MAX_CALLS_PER_DAY: "Limite journalière atteinte (fair-use)",
  CALLEE_BUSY: "La personne est déjà en ligne",
  CALLER_BUSY: "Vous avez déjà un appel en cours",
  ORGANIZATION_MAX_CONCURRENT: "Trop d'appels simultanés",
  SERIALIZATION_CONFLICT: "Conflit de concurrence, réessayez",
  NO_PLAN: "Aucun plan actif",
  PLAN_INACTIVE: "Plan inactif",
};

export function callErrorMessage(code: string | undefined | null): string {
  return CALL_ERROR_MESSAGES[code ?? ""] ?? "Appel refusé";
}
