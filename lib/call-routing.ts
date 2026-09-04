/**
 * Routage centralisé des appels — source de vérité SERVEUR.
 *
 * Le navigateur ne décide JAMAIS seul si une destination est un appel interne
 * (APP_TO_APP) ou un appel externe (APP_TO_PSTN). Seul ce module (appelé côté
 * serveur) émet une décision explicite.
 *
 * Règles :
 *  - Une destination qui correspond à un UTILISATEUR CALLABLE de la MÊME
 *    organisation (par `callUsername` ou `callExtension`) est TOUJOURS routée
 *    APP_TO_APP. Le chemin Telnyx/PSTN est alors IMPOSSIBLE.
 *  - Sinon, la destination est routée APP_TO_PSTN (Telnyx).
 *
 * `classifyCandidates` est une fonction PURE (testable sans DB) qui classe une
 * liste pré-résolue de candidats. `resolveCallDestination` fait la requête DB
 * puis délègue à `classifyCandidates`.
 */

export type ResolvedUser = {
  id: string;
  name: string | null;
  email: string | null;
  callUsername: string | null;
  callExtension: string | null;
  isCallable: boolean;
  organizationId: string;
};

export type RouteDecision =
  | {
      type: "APP_TO_APP";
      user: ResolvedUser;
      // Identifiant canonique de l'utilisateur (jamais un signal du navigateur).
      targetUserId: string;
    }
  | {
      type: "APP_TO_PSTN";
      // Destination E.164 nettoyée qui part vers Telnyx.
      destination: string;
    };

export type RouteFailure = {
  type: "ERROR";
  reason:
    | "UNAUTHORIZED"
    | "NO_ORGANIZATION"
    | "SELF_CALL"
    | "TARGET_NOT_CALLABLE"
    | "EMPTY_TARGET";
};

export type RouteResult = RouteDecision | RouteFailure;

type Candidate = {
  id: string;
  name: string | null;
  email: string | null;
  callUsername: string | null;
  callExtension: string | null;
  isCallable: boolean;
  organizationId: string;
};

type ClassifyInput = {
  target: string;
  callerId: string;
  // Candidats plateforme correspondant à la cible (déjà filtrés par l'appelant).
  candidates: Candidate[];
};

/**
 * Pure : classe une décision à partir de la cible brute et des candidats
 * pré-résolus. Ne fait AUCUNE requête DB.
 */
export function classifyCandidates(input: ClassifyInput): RouteDecision | RouteFailure {
  const target = (input.target ?? "").trim();
  if (!target) {
    return { type: "ERROR", reason: "EMPTY_TARGET" };
  }

  if (input.candidates.length > 0) {
    const user = input.candidates[0];
    if (user.id === input.callerId) {
      return { type: "ERROR", reason: "SELF_CALL" };
    }
    if (!user.isCallable) {
      return { type: "ERROR", reason: "TARGET_NOT_CALLABLE" };
    }
    // Un utilisateur plateforme résolu ⇒ APP_TO_APP, JAMAIS Telnyx.
    return {
      type: "APP_TO_APP",
      user,
      targetUserId: user.id,
    };
  }

  // Aucun utilisateur plateforme : destination externe (PSTN).
  return { type: "APP_TO_PSTN", destination: normalizeE164(target) };
}

/**
 * Normalise une destination PSTN en E.164 (même logique que TelnyxContext,
 * sans dépendance navigateur) : pour un appel APP_TO_PSTN uniquement.
 */
export function normalizeE164(raw: string): string {
  let cleaned = (raw ?? "").replace(/[^0-9+]/g, "");
  if (cleaned.length === 10 && !cleaned.startsWith("+")) {
    cleaned = "+1" + cleaned;
  } else if (cleaned.length > 10 && !cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
}

/**
 * Résout une cible d'appel côté SERVEUR et émet la décision de routage.
 *
 * @param params.callerId    id de l'utilisateur authentifié (depuis auth()).
 * @param params.organizationId id de l'organisation (depuis auth()).
 * @param params.target       saisie brute (username / extension / numéro...).
 * @param params.lookupUser   injectable (tests) ; par défaut interroge Prisma.
 */
export async function resolveCallDestination(params: {
  callerId: string;
  organizationId: string;
  target: string;
  lookupUser?: (q: {
    organizationId: string;
    callerId: string;
    lower: string;
  }) => Promise<ResolvedUser[]>;
}): Promise<RouteResult> {
  const { callerId, organizationId, target } = params;
  if (!callerId || !organizationId) {
    return { type: "ERROR", reason: "UNAUTHORIZED" };
  }

  const lower = (target ?? "").trim().toLowerCase();
  if (!lower) {
    return { type: "ERROR", reason: "EMPTY_TARGET" };
  }

  const lookup = params.lookupUser ?? defaultLookup;
  const candidates = await lookup({ organizationId, callerId, lower });

  return classifyCandidates({ target, callerId, candidates });
}

async function defaultLookup(q: {
  organizationId: string;
  callerId: string;
  lower: string;
}): Promise<ResolvedUser[]> {
  const { prisma } = await import("@/lib/prisma");
  const rows = await prisma.user.findMany({
    where: {
      organizationId: q.organizationId,
      OR: [
        { callUsername: { equals: q.lower } },
        { callExtension: { equals: q.lower } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      callUsername: true,
      callExtension: true,
      isCallable: true,
      organizationId: true,
    },
  });
  return rows
    .filter((r) => r.organizationId !== null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      callUsername: r.callUsername,
      callExtension: r.callExtension,
      isCallable: r.isCallable,
      organizationId: r.organizationId as string,
    }));
}
