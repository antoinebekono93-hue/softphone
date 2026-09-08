/**
 * Routage centralisé des appels — source de vérité SERVEUR.
 *
 * Le navigateur ne décide JAMAIS seul si une destination est un appel interne
 * (APP_TO_APP) ou un appel externe (APP_TO_PSTN). Seul ce module (appelé côté
 * serveur) émet une décision explicite.
 *
 * Règles :
 *  - Une destination qui correspond à un UTILISATEUR CALLABLE de la MÊME
 *    organisation (par `callUsername`, `callExtension`, email, ou numéro
 *    `PhoneNumber` ACTIF qui lui est attribué) est une identité interne.
 *    Si l'utilisateur n'est pas callable, ou s'il s'agit de l'appelant,
 *    l'appel est bloqué explicitement — il ne bascule jamais vers Telnyx/PSTN.
 *  - Un numéro inactif, non attribué, ou attribué hors organisation n'est PAS
 *    une identité interne ; il suit donc le chemin APP_TO_PSTN normal.
 *  - Toute ambiguïté entre identités internes est bloquée de façon explicite :
 *    elle ne doit jamais choisir un destinataire arbitraire ni tomber en PSTN.
 *
 * `classifyCandidates` et `phoneNumberCandidates` sont pures (testables sans
 * DB). `resolveCallDestination` fait les requêtes DB puis délègue à ces
 * fonctions.
 */

import {
  canonicalizePhoneNumber,
  phoneNumberLookupCandidates,
} from "@/lib/phone-number";

export type ResolvedUser = {
  id: string;
  name: string | null;
  email: string | null;
  callUsername: string | null;
  callExtension: string | null;
  isCallable: boolean;
  organizationId: string;
};

/**
 * Provenance conservée uniquement côté serveur. Elle permet de détecter les
 * doublons de numéros legacy normalisés vers la même valeur E.164.
 */
export type ResolvedCallCandidate = ResolvedUser & {
  matchSource?: "DIRECTORY" | "PHONE";
};

export type RouteDecision =
  | {
      type: "APP_TO_APP";
      user: ResolvedUser;
      // Identifiant canonique de l'utilisateur (jamais un signal du navigateur).
      targetUserId: string;
      /**
       * Cible canonique à transmettre à /api/app-calls pour une seconde
       * résolution serveur. E.164 pour un numéro, minuscule/trimée pour une
       * identité d'annuaire.
       */
      destination: string;
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
    | "AMBIGUOUS_INTERNAL_TARGET"
    | "EMPTY_TARGET"
    | "INVALID_TARGET";
};

export type RouteResult = RouteDecision | RouteFailure;

type ClassifyInput = {
  target: string;
  callerId: string;
  // Candidats plateforme correspondant à la cible (déjà filtrés par l'appelant).
  candidates: ResolvedCallCandidate[];
};

/**
 * Représentation minimale d'une ligne PhoneNumber pour les tests et le
 * filtrage de défense. La requête Prisma applique ces mêmes contraintes, mais
 * les répéter ici garantit qu'un changement de requête ne puisse pas faire
 * d'un numéro inactif/hors tenant une identité interne.
 */
export type PhoneNumberRouteRow = {
  number: string;
  status: string;
  organizationId: string;
  assignedUser: ResolvedUser | null;
};

/**
 * Longueur maximale d'une cible de saisie. Au-dessus, on refuse SANS interroger
 * la DB (un username/ext ≤ 32, un email ≤ 254, un E.164 ≤ 16 : 300 est très
 * au-dessus du légitime et bloque les payloads de plusieurs Ko).
 */
export const MAX_TARGET_LENGTH = 300;

/**
 * Convertit uniquement une entrée d'annuaire en cible reproductible par le
 * second contrôle serveur de /api/app-calls. Les numéros utilisent toujours
 * canonicalizePhoneNumber plutôt que cette fonction.
 */
function normalizeDirectoryTarget(raw: string): string {
  return (raw ?? "").trim().toLowerCase();
}

/**
 * Extrait les candidats internes associés à un numéro déjà chargé. Aucun
 * numéro inactif/non attribué/hors tenant n'est retourné. Le statut
 * `isCallable` est volontairement laissé au classifieur : un utilisateur
 * interne non callable doit provoquer TARGET_NOT_CALLABLE, jamais un fallback
 * Telnyx/PSTN.
 *
 * La comparaison normalise AUSSI la valeur stockée. Cela reconnaît les lignes
 * legacy `237…` / `00237…` sans devoir modifier la base de données, tout en
 * permettant ensuite au classifieur de bloquer les doublons ambigus.
 */
export function phoneNumberCandidates(params: {
  target: string;
  organizationId: string;
  phoneNumbers: PhoneNumberRouteRow[];
}): ResolvedCallCandidate[] {
  const canonicalTarget = canonicalizePhoneNumber(params.target);
  if (!canonicalTarget) return [];

  return params.phoneNumbers.flatMap((phone) => {
    const assignedUser = phone.assignedUser;
    if (
      phone.status !== "ACTIVE" ||
      phone.organizationId !== params.organizationId ||
      !assignedUser ||
      assignedUser.organizationId !== params.organizationId ||
      canonicalizePhoneNumber(phone.number) !== canonicalTarget
    ) {
      return [];
    }

    return [{ ...assignedUser, matchSource: "PHONE" }];
  });
}

/**
 * Pure : classe une décision à partir de la cible brute et des candidats
 * pré-résolus. Ne fait AUCUNE requête DB.
 */
export function classifyCandidates(input: ClassifyInput): RouteDecision | RouteFailure {
  const target = (input.target ?? "").trim();
  if (!target) {
    return { type: "ERROR", reason: "EMPTY_TARGET" };
  }
  if (target.length > MAX_TARGET_LENGTH) {
    return { type: "ERROR", reason: "INVALID_TARGET" };
  }

  // Plusieurs lignes PhoneNumber legacy qui normalisent vers la même identité
  // sont un problème de données. Ne jamais choisir l'une d'elles au hasard et
  // ne jamais basculer l'appel vers Telnyx/PSTN.
  const phoneMatchCount = input.candidates.filter(
    (candidate) => candidate.matchSource === "PHONE"
  ).length;
  if (phoneMatchCount > 1) {
    return { type: "ERROR", reason: "AMBIGUOUS_INTERNAL_TARGET" };
  }

  // Une même personne peut correspondre à son username et à son numéro : ce
  // n'est pas ambigu. En revanche deux utilisateurs distincts le sont.
  const uniqueCandidates = Array.from(
    new Map(input.candidates.map((candidate) => [candidate.id, candidate])).values()
  );
  if (uniqueCandidates.length > 1) {
    return { type: "ERROR", reason: "AMBIGUOUS_INTERNAL_TARGET" };
  }

  if (uniqueCandidates.length === 1) {
    const user = uniqueCandidates[0];
    if (user.id === input.callerId) {
      return { type: "ERROR", reason: "SELF_CALL" };
    }
    if (!user.isCallable) {
      return { type: "ERROR", reason: "TARGET_NOT_CALLABLE" };
    }

    const canonicalPhoneTarget = canonicalizePhoneNumber(target);
    // Un utilisateur plateforme résolu ⇒ APP_TO_APP, JAMAIS Telnyx.
    return {
      type: "APP_TO_APP",
      user,
      targetUserId: user.id,
      destination:
        phoneMatchCount === 1 && canonicalPhoneTarget
          ? canonicalPhoneTarget
          : normalizeDirectoryTarget(target),
    };
  }

  // Aucun utilisateur plateforme : destination externe (PSTN).
  return { type: "APP_TO_PSTN", destination: normalizeE164(target) };
}

/**
 * Normalise une destination PSTN en E.164. Les numéros identité de la
 * plateforme utilisent la validation stricte partagée ; le repli conserve le
 * comportement historique pour les destinations internationales génériques
 * que le Dialpad/Telnyx acceptaient déjà.
 */
export function normalizeE164(raw: string): string {
  const canonical = canonicalizePhoneNumber(raw);
  if (canonical) return canonical;

  const compact = (raw ?? "").trim().replace(/[^0-9+]/g, "");
  const digits = compact.replace(/\D/g, "");
  if (!digits) return "";

  // Préfixe d'accès international : 00237612345678 → +237612345678.
  if (compact.startsWith("00")) {
    const internationalDigits = digits.slice(2);
    return internationalDigits ? `+${internationalDigits}` : "";
  }
  if (compact.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length > 10) return `+${digits}`;

  // Compatibilité avec l'ancien routeur pour les extensions/cibles courtes.
  return digits;
}

type LookupQuery = {
  organizationId: string;
  callerId: string;
  lower: string;
  target: string;
};

/**
 * Résout une cible d'appel côté SERVEUR et émet la décision de routage.
 *
 * @param params.callerId    id de l'utilisateur authentifié (depuis auth()).
 * @param params.organizationId id de l'organisation (depuis auth()).
 * @param params.target       saisie brute (username / extension / email / numéro).
 * @param params.lookupUser   injectable (tests) ; par défaut interroge Prisma.
 */
export async function resolveCallDestination(params: {
  callerId: string;
  organizationId: string;
  target: string;
  lookupUser?: (q: LookupQuery) => Promise<ResolvedCallCandidate[]>;
}): Promise<RouteResult> {
  const { callerId, organizationId, target } = params;
  if (!callerId || !organizationId) {
    return { type: "ERROR", reason: "UNAUTHORIZED" };
  }

  const lower = normalizeDirectoryTarget(target);
  if (!lower) {
    return { type: "ERROR", reason: "EMPTY_TARGET" };
  }
  if (lower.length > MAX_TARGET_LENGTH) {
    // Refus AVANT toute requête DB (une cible de plusieurs Ko ne justifie pas
    // un scan de l'annuaire).
    return { type: "ERROR", reason: "INVALID_TARGET" };
  }

  const lookup = params.lookupUser ?? defaultLookup;
  const candidates = await lookup({ organizationId, callerId, lower, target });

  // Le résultat d'un lookup injectable ne doit jamais contourner l'isolement
  // tenant : même en test/futur adaptateur, un candidat cross-tenant est ignoré.
  return classifyCandidates({
    target,
    callerId,
    candidates: candidates.filter(
      (candidate) => candidate.organizationId === organizationId
    ),
  });
}

async function defaultLookup(q: LookupQuery): Promise<ResolvedCallCandidate[]> {
  const { prisma } = await import("@/lib/prisma");
  const phoneLookupValues = phoneNumberLookupCandidates(q.target);

  const [users, phoneNumbers] = await Promise.all([
    prisma.user.findMany({
      where: {
        organizationId: q.organizationId,
        OR: [
          { callUsername: { equals: q.lower } },
          { callExtension: { equals: q.lower } },
          { email: { equals: q.lower } },
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
    }),
    phoneLookupValues.length > 0
      ? prisma.phoneNumber.findMany({
          where: {
            organizationId: q.organizationId,
            status: "ACTIVE",
            assignedUserId: { not: null },
            number: { in: phoneLookupValues },
            assignedUser: {
              is: {
                organizationId: q.organizationId,
              },
            },
          },
          select: {
            number: true,
            status: true,
            organizationId: true,
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
                callUsername: true,
                callExtension: true,
                isCallable: true,
                organizationId: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const directoryCandidates: ResolvedCallCandidate[] = users.flatMap((user) => {
    // organizationId est nullable dans le schéma général ; cette garde reste
    // nécessaire même si la clause where la rend normalement non nulle.
    if (!user.organizationId) return [];
    return [
      {
        id: user.id,
        name: user.name,
        email: user.email,
        callUsername: user.callUsername,
        callExtension: user.callExtension,
        isCallable: user.isCallable,
        organizationId: user.organizationId,
        matchSource: "DIRECTORY",
      },
    ];
  });

  const phoneCandidates = phoneNumberCandidates({
    target: q.target,
    organizationId: q.organizationId,
    phoneNumbers: phoneNumbers.map((phone) => ({
      number: phone.number,
      status: phone.status,
      organizationId: phone.organizationId,
      assignedUser: phone.assignedUser?.organizationId
        ? {
            id: phone.assignedUser.id,
            name: phone.assignedUser.name,
            email: phone.assignedUser.email,
            callUsername: phone.assignedUser.callUsername,
            callExtension: phone.assignedUser.callExtension,
            isCallable: phone.assignedUser.isCallable,
            organizationId: phone.assignedUser.organizationId,
          }
        : null,
    })),
  });

  return [...directoryCandidates, ...phoneCandidates];
}
