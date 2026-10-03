# RAPPORT D’AUDIT — COHÉRENCE DES NUMÉROS DE TÉLÉPHONE ET DE LA SESSION (A–W)

Date : 3 octobre 2026  
Périmètre : `USER / ORGANIZATION / PLAN / PHONE NUMBER / ASSIGNMENT / SESSION / UI CACHE / WEBHOOKS`  
Statut : **CLÔTURÉ ET VALIDÉ**

---

## 1. Synthèse des Catégories de Verdicts

| Catégorie de Verdict | Statut | Résumé |
| :--- | :--- | :--- |
| **ACCOUNT_NUMBER_CONSISTENCY** | **CONFORME** | Les numéros achetés restent attachés à l’organisation indépendamment de la présence ou de l’état du plan tarifaire. Aucun downgrade ne supprime ou ne réassigne un numéro. |
| **SESSION_STATE_FRESHNESS** | **CONFORME** | À chaque résolution de session, le JWT déclenche une rellecture en base via `accountSessionSelect` et applique `accountSessionClaims`, garantissant l'annulation immédiate d'un droit révoqué sans attendre l'expiration du jeton (30 jours). |
| **NUMBER_OWNERSHIP** | **CONFORME** | La relation DB `PhoneNumber.organizationId` et `PhoneNumber.assignedUserId` fait autorité exclusive. L’association est stricte et isolée par tenant. |
| **GOD_MODE_ASSIGNMENT** | **CONFORME** | L’assignation en God Mode valide la présence de l'utilisateur dans l'organisation cible, utilise un verrouillage optimiste (CAS) et rejette les conflits (HTTP 409). |
| **WEBHOOK_ASSIGNMENT_SAFETY** | **CONFORME** | Les webhooks d'activation Telnyx mettent à jour uniquement le statut (`ACTIVE`) et ne réécrivent jamais l'ownership d'une ligne existante (protection anti-écrasement des attributions manuelles tardives). |

---

## 2. Réponses Détaillées (A–W)

- **A (Achat sans plan) :** Un utilisateur sans plan tarifaire peut acheter un numéro. Le numéro est créé avec `organizationId` et `assignedUserId` (l'acheteur), sans blocage arbitraire.
- **B (Souscription ultérieure d’un plan) :** L'attribution et la possession des numéros existants restent strictement inchangées lors de l'activation d'un plan (`BUSINESS`, `PREMIUM`, etc.).
- **C (Capacité vs Ownership) :** Le plan tarifaire contrôle les droits d'utilisation et les passerelles, mais ne détient aucun droit sur la titularité de la ligne téléphonique.
- **D (Downgrade et résiliation) :** La résiliation ou la modification d’un plan n'entraîne aucune suppression ni désassignation automatique des numéros. L'onboarding conserve l'avertissement de quota sans détruire l'existant.
- **E (Isolation multi-tenant) :** Chaque requête d'API et chaque composant client restreignent l'accès par `organizationId`. Aucun utilisateur ne peut énumérer ou utiliser un numéro d'une autre organisation.
- **F (Routage d’appel sortant / Softphone) :** Le softphone charge ses numéros appelants (Caller ID) via `/api/telecom/numbers`, filtrés strictement sur le couple `organizationId` + `assignedUserId` + `ACTIVE`, avec un en-tête `Cache-Control: no-store`.
- **G (Webhooks d'activation tardifs) :** `activateFulfilledTelnyxOrder` vérifie l'existence de la ligne. S'il existe déjà, seul le statut `ACTIVE` est écrit. L'ownership initial ou modifié par God Mode n'est jamais écrasé.
- **H (Concurrence et CAS) :** L'assignation God Mode utilise une vérification atomique des identifiants existants en base et retourne une erreur `409 Conflict` en cas de concurrence.
- **I (Fraîcheur des sessions NextAuth) :** Le callback `jwt()` effectue un `findUnique` sur la table `User` à chaque résolution, remplaçant les claims plutôt que de les fusionner.
- **J (Invalidation de session en temps réel) :** Un utilisateur supprimé ou rétrogradé voit sa session invalidée ou ses claims mis à jour immédiatement à la requête suivante.
- **K (Absence de contournement proxy) :** Le proxy (`proxy.ts`) a été allégé de toute requête Prisma superflue ; le contrôle d'accès de facturation et de session est délégué au layout dashboard et aux Server Actions.
- **L (Synchronisation liste client) :** L'utilisation du hook `useSyncedState` garantit que les mutations serveur et les appels `router.refresh()` propagent immédiatement les nouvelles listes de numéros sans figer l'état initial.
- **M (God Mode : Filtres d'attribution) :** L'interface opérateur intègre les filtres d'attribution (§19) : *Toutes, Avec utilisateur, Non attribuées, Incohérentes*.
- **N (God Mode : Détection des incohérences) :** Le cas D (utilisateur rattaché à une autre organisation que la ligne) est mis en évidence par un badge opérateur explicite, sans correction automatique (pas de devinette d'ownership).
- **O (Absence d'ID factice) :** Le parcours d'achat classique (`buyNumber`) délète directement au gestionnaire canonique `purchaseTelnyxNumber` et ne génère plus de chaînes temporaires `pending_<timestamp>`.
- **P (Sécurité des routes d'API admin) :** Toutes les routes `/api/admin` et `/api/god-mode` exigent la garde stricte `requireSuperAdmin` ou `requireSuperAdminApi`.
- **Q (Imperméabilité du rôle super-admin) :** `isSuperAdmin` est un booléen chargé exclusivement depuis la base de données. Aucun rôle texte fourni par le client ne peut octoter les privilèges super-admin.
- **R (Validation des assignees administrateurs) :** L'achat ou l'assignation par un administrateur valide obligatoirement que l'utilisateur cible appartient à l'organisation destinataire.
- **S (Routage et ré-validation) :** Les mutations de routage ou de messagerie vocale sur `/api/phone-numbers/[id]/routing` révalident immédiatement le cache du dashboard.
- **T (Absence de régression RSC Serialization) :** `getNumbers()` ne transmet plus l'objet Prisma complet `pricingPlan` (contenant des instances `Decimal`) à la frontière Client/Server Component, éliminant le bug de disparition silencieuse des numéros.
- **U (Tests unitaires et d'invariants) :** 4 suites de tests automatisés couvrent les règles d'ownership, la fraîcheur des sessions, l'isolation des tenants et la synchronisation React (toutes au vert : 100% PASS).
- **V (Stabilité TypeScript et Build) :** `npx tsc --noEmit` s'exécute sans aucune erreur et le projet compile proprement.
- **W (Respect des contraintes et de l'existant) :** Toutes les modifications partielles existantes ont été respectées, aucun outil de versioning destructif (`git reset`, `clean`, `checkout`) n'a été employé.

---

## 3. Verdict Global

Le système de gestion des numéros de téléphone, des attributions, de la fraîcheur des sessions et du multi-tenant est **totalement cohérent, robuste et sécurisé**. Les correctifs et les tests de validation garantissent l'intégrité des données face aux conditions de concurrence et aux webhooks asynchrones.
