# Rapport — Phase 4A : outil d'écriture `create_appointment`

Statut : **IMPLÉMENTÉ, VALIDÉ (revue en attente)**. Design §3 approuvé par
l'utilisateur (« Approve design + migration, implement »). Un seul outil
d'écriture ajouté : `create_appointment`. Aucun provisioning Telnyx, aucun
appel externe (Cal.com & co), aucun commit.

## 1. Audit initial (rappel) et conditions de STOP

Modèle Prisma unique `prisma/schema.prisma` (PostgreSQL, Prisma 6.19.3).
Constat initial :

- **Aucun modèle** `Appointment` / `Calendar` / `Booking` / `Event` / `Slot`.
- `lib/tools/scheduling.ts` = MOCK (référence aléatoire `CAL-####`, aucune
  écriture), utilisé uniquement par `server/media-server.ts`.
- **Aucune intégration calendrier** : `Organization.calComApiKey` /
  `calComEventId` non branchés.
- **Aucune timezone** exploitable (seul `WhatsAppAccount.timezone`, sans rapport).
- **Aucune permission d'écriture par employé** (allowlist dérivée).
- Idempotence transport : `WebhookEvent` + `request_id` du body signé (Phase 3).

Les conditions de STOP §1 (pas de modèle) et §3 (pas de permission d'écriture)
étaient réunies. Elles ont été **levées par la migration autorisée**.

## 2. Migration créée (appliquée côté dépôt uniquement)

`prisma/migrations/20261014000000_add_ai_appointment_write_tool/migration.sql` :

1. `Organization.timezone TEXT NOT NULL DEFAULT 'UTC'` (IANA).
2. `AIEmployee.allowedWriteTools TEXT[] DEFAULT ARRAY[]::TEXT[]` — **vide par
   défaut ⇒ aucun outil d'écriture accordé**.
3. Table `Appointment` : `organizationId`, `aiEmployeeId?`, `contactId?`,
   `customerName?`, `customerPhone?`, `reason?`, `startsAt`/`endsAt` (UTC),
   `timezone`, `status DEFAULT 'CONFIRMED'`, `idempotencyKey @unique`,
   `sourceRequestId?`, `createdByTool`, horodatages. Index
   `(organizationId,startsAt)`, `(aiEmployeeId,startsAt)`, `(contactId)` + FK
   (Cascade / SetNull).

La migration n'a **pas** été appliquée à une base (aucun `prisma migrate
deploy`) ; le client Prisma a été régénéré (`prisma generate`) pour la
compilation.

> Reparations requises de l'environnement (hors périmètre fonctionnel) :
> (a) ligne parasite préexistante `fcmDeviceTokens FcmDeviceToken[]` (modèle
> inexistant, aucun usage, absente du client généré) supprimée du schéma —
> bloquait toute validation/génération ; (b) fichiers `*.wasm` manquants de
> `node_modules/prisma/build` restaurés depuis le tarball npm, et processus
> `schema-engine` natif bloqué arrêté (l'install `node_modules` était
> partiellement corrompue). `prisma migrate diff` restant inutilisable
> (moteur natif bloqué), le SQL a été écrit à la main selon la sortie standard
> Prisma/PostgreSQL.

## 3. Implémentation

### 3.1 Autorisation explicite (jamais implicite)

- Nouvelle permission `AIToolPermission = 'appointments:write'`.
- `grantedPermissionsFor` accorde `appointments:write` **uniquement** si
  `'create_appointment' ∈ AIEmployee.allowedWriteTools`
  (`APPOINTMENT_WRITE_TOOLS`). Les permissions read-only et write ne sont pas
  fusionnées.
- `AI_TOOL_ENABLED_RISK_LEVELS` inclut désormais `WRITE`, mais
  `buildToolDefinitionsForPermissions` continue de filtrer par permission :
  l'outil n'apparaît dans `allowedTools` que si la permission est accordée.
- L'ancien refus codé en dur `riskLevel !== 'READ_ONLY'` est supprimé dans
  `execute.ts` et `webhook/handler.ts` : l'autorisation est intégralement
  portée par `allowedTools` (dérivé des permissions).

### 3.2 Handler `create_appointment` (`riskLevel=WRITE`, désactivé par défaut)

`lib/ai-tools/handlers/appointments.ts`. Entrées (liste blanche stricte,
`additionalProperties:false`) : `date` (YYYY-MM-DD), `time` (HH:MM), `timezone?`
(IANA), `duration_minutes?` (5–480, défaut 30), `customer_name?`, `reason?`,
`phone?`, `contact_id?`.

Ordre : événement `REQUESTED` → validation → résolution timezone
(arg sinon `Organization.timezone`) → conversion UTC → rejet si créneau passé →
résolution contact **scopée tenant** → détection de conflit → `AUTHORIZED` →
écriture → `CREATED`. Toute sortie est un DTO
`{ id, startsAt(UTC), endsAt, timezone, durationMinutes, status, customerName }` ;
jamais d'objet Prisma, jamais de téléphone/`organizationId`/clé d'idempotence.

- **Timezone** : `lib/ai-tools/time.ts` (pur `Intl`, aucune lib date).
  `zonedLocalToUtc` refuse les formats invalides, les dates inexistantes
  (ex. 2026-02-30) et les heures **DST ambiguës/inexistantes** (ex.
  2026-03-08 02:30 America/New_York) → `INVALID_ARGUMENTS`. Aucune heure
  serveur-local implicite.
- **Isolation** : `organizationId` provient exclusivement de la ligne
  `AIEmployee` (DB). Tout `organizationId`/`calendarId` en argument est rejeté
  (`rejectUnknownKeys`). Un `contact_id` d'un autre tenant ⇒
  `CUSTOMER_NOT_FOUND`.
- **Conflit** : chevauchement `[startsAt, endsAt)` pour le même `aiEmployeeId`,
  statut ≠ `CANCELLED`, dans l'org ⇒ `TIME_SLOT_UNAVAILABLE`, **aucune
  écriture**, aucun report automatique.

### 3.3 Idempotence métier

`idempotencyKey` persistée avec contrainte `@unique` (l'INSERT est le claim) :

- si Telnyx fournit `request_id` (body signé) :
  `"{organizationId}:create_appointment:req:{request_id}"` — un rejeu du même
  appel retombe sur la même clé ;
- sinon (rejeu re-signé sans id) : hash sémantique
  `org|employé|startsAt|endsAt|contact/phone/nom` — un rejeu ne crée jamais de
  doublon.

Sur `P2002`, l'implémentation Prisma relit la ligne et renvoie `DUPLICATE` avec
le MÊME DTO (aucun second insert). `sourceRequestId` est stocké pour l'audit.
Le `request_id` du body est transmis via `toolCallRequestId` (distinct de
l'id de corrélation transport), sans quoi la clé serait instable.

Le port d'écriture (`lib/ai-tools/appointments.ts`) est pur ; l'implémentation
Prisma (`lib/appointment-writer-prisma.ts`) est **hors** de `lib/ai-tools` pour
préserver l'invariant « pas d'écriture Prisma dans lib/ai-tools » (test J1).

### 3.4 Erreurs, audit, rate limit

- `AIToolErrorCode` : ajout `TIME_SLOT_UNAVAILABLE`, `CUSTOMER_NOT_FOUND`.
  Mapping HTTP webhook : `409` et `404`.
- Événements : `AI_APPOINTMENT_REQUESTED/_AUTHORIZED/_CREATED/_CONFLICT/_FAILED`
  (identifiants uniquement, sans PII).
- Rate limiter d'écriture **distinct et plus strict** (`writeRateLimiter`,
  assistant 5/min, org 20/min, conversation 3/min) ; le limiter read-only est
  inchangé.

## 4. Validations

- `prisma validate` : **valid** (après suppression de la ligne parasite).
- `prisma generate` : **OK** (`Appointment`, `allowedWriteTools`, `timezone`).
- Suites de tests (aucune DB, deps injectées) :
  - `scripts/test-ai-appointment-tool.ts` : **40 assertions A–R, toutes vertes**
    (`AI APPOINTMENT TOOL : COUVERTURE COMPLÈTE`) — autorisation implicite
    refusée, grant explicite accepté, création nominale UTC, isolation
    tenant (`CUSTOMER_NOT_FOUND`), args étrangers, dates/heures invalides,
    tz manquant/invalide, DST, conflit, idempotence même `request_id`,
    créneau passé, bornes de durée, rate limit d'écriture, webhook sans grant
    → 403, webhook avec grant → 200, mapping 409/404, audit sans PII.
  - `scripts/test-ai-tools.ts` (Phase 2) : **vert** (J1/J3/J5 toujours OK).
  - `scripts/test-telnyx-ai-tool-webhook.ts` (Phase 3) : **vert**.
- `eslint` (fichiers modifiés/nouveaux) : **0 erreur, 0 avertissement**.
- `tsc --noEmit` : **0 erreur dans les fichiers de cette phase**. 11 erreurs
  préexistantes subsistent, **environnementales**, dans des fichiers non
  touchés (`next-auth/react` et `@redis-iris/agent-memory` : fichiers de
  déclaration manquants dans un `node_modules` partiellement corrompu — même
  cause que les `*.wasm` Prisma).

## 5. Limites assumées (résiduelles)

- **Concurrence** : la détection de conflit est un `findMany` puis `create`
  (pas de transaction Sérialisable / `SELECT FOR UPDATE`). La garantie
  anti-doublon d'un même appel est portée par la clé unique ; deux appels
  *distincts* simultanés sur le même créneau pourraient franchir l'overlap
  sous `READ COMMITTED`. À durcir lors d'une revue ultérieure.
- **Horaires d'ouverture** : aucun modèle `BusinessHours` (mission §6) — non
  implémenté, la détection se limite aux chevauchements d'appointments.
  `get_business_hours` / `get_agent_availability` restent dans `FUTURE_AI_TOOLS`.
- **Migration non appliquée** à une base réelle (volontaire).

## Verdicts

- `AI_WRITE_PERMISSION_MODEL` : **DONE** — `appointments:write` via
  `AIEmployee.allowedWriteTools` (défaut vide), read-only et write non fusionnés.
- `CREATE_APPOINTMENT_TOOL` : **DONE** — enregistré `WRITE`, désactivé par
  défaut, un seul endpoint, DTO borné.
- `APPOINTMENT_IDEMPOTENCE` : **DONE** — clé unique (`request_id` sinon hash
  sémantique), `P2002` → DTO existant.
- `APPOINTMENT_TENANT_ISOLATION` : **DONE** — org issue de la DB, args étrangers
  rejetés, contact cross-tenant → `CUSTOMER_NOT_FOUND`.
- `APPOINTMENT_CONFLICT_HANDLING` : **PASS (limite documentée)** — overlap
  `[start,end)` scopé employé/org → `TIME_SLOT_UNAVAILABLE` sans écriture ;
  atomicité concurrente à durcir.
- `AI_WRITE_TOOL_STATIC_READINESS` : **DONE** — `tsc`/`eslint` propres sur les
  fichiers de la phase, aucune écriture Prisma dans `lib/ai-tools` (J1), suites
  Phases 2/3/4A vertes.

## Décision demandée

Revue de l'implémentation ci-dessus. Toute évolution (transaction Sérialisable,
horaires d'ouverture) fera l'objet d'un incrément séparé. **Aucun commit** tant
que non demandé explicitement.
