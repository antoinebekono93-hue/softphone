"use client";

import { useCallback } from "react";
import { useAppCall } from "@/contexts/AppCallContext";
import { useTelnyx } from "@/contexts/TelnyxContext";
import { toast } from "sonner";

type RouteResult =
  | { type: "APP_TO_APP"; targetUserId: string; target: string }
  | { type: "APP_TO_PSTN"; destination: string };

/**
 * Hook UNIQUE de routage des appels sortants.
 *
 * Le navigateur ne décide jamais de lui-même si une saisie est un appel interne
 * (APP_TO_APP) ou externe (APP_TO_PSTN) : il soumet sa saisie à `/api/call-route`
 * et n'agit qu'à partir de la décision serveur.
 *
 * Cela supprime le bypass où `makeCall()/newCall()` (Telnyx) serait appelé
 * directement avant toute résolution serveur.
 */
export function useCallRouter() {
  const { makeAppCall } = useAppCall();
  const { makeCall } = useTelnyx();

  const routeCall = useCallback(
    async (target: string, callerId?: string): Promise<void> => {
      const raw = (target ?? "").trim();
      if (!raw) return;

      let res: Response;
      try {
        res = await fetch("/api/call-route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: raw }),
        });
      } catch (err) {
        console.error("[call-router] request failed", err);
        toast.error("Impossible de router l'appel");
        return;
      }

      let data: { route?: RouteResult; error?: string };
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        toast.error(bodyMessage(data.error));
        return;
      }

      const route = data.route;
      if (!route) {
        toast.error("Routage indisponible");
        return;
      }

      if (route.type === "APP_TO_APP") {
        // L'appel interne passe par le chemin WebRTC (aucun Telnyx, aucun wallet).
        // On renvoie la saisie originale : /api/app-calls re-résout côté serveur
        // via la MÊME fonction (resolveCallDestination) → cohérent.
        await makeAppCall(route.target);
      } else {
        // Décision serveur explicite : destination externe → Telnyx.
        makeCall(route.destination, callerId || undefined);
      }
    },
    [makeAppCall, makeCall]
  );

  return { routeCall };
}

function bodyMessage(code: string | undefined): string {
  const map: Record<string, string> = {
    UNAUTHORIZED: "Non authentifié",
    NO_ORGANIZATION: "Organisation introuvable",
    SELF_CALL: "Impossible de s'appeler soi-même",
    TARGET_NOT_CALLABLE: "Cette personne n'est pas joignable par appel",
    EMPTY_TARGET: "Destination vide",
    NOT_APP_TO_APP_DESTINATION: "Destination externe (Telnyx)",
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
  return map[code ?? ""] ?? "Appel refusé";
}
