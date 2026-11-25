# Rapport — Phase 4A : outil d'écriture `create_appointment`

Statut : **IMPLÉMENTÉ, VALIDÉ (revue en attente)**. Design §3 approuvé par
l'utilisateur (« Approve design + migration, implement »). Un seul outil
d'écriture ajouté : `create_appointment`. Aucun provisioning Telnyx, aucun
appel externe (Cal.com & co), aucun commit.

> **Phase 4A.1 (durcissement concurrence) : TERMINÉE.** La course
> anti-double-réservation résiduelle de la Phase 4A est fermée par une
> transaction PostgreSQL SERIALIZABLE + retry borné (voir §4b). Aucune
> migration supplémentaire n'est requise (`MIGRATION_APPLIED = NO`).
>
> **Phase 4A.2 (horaires d'ouverture) : IMPLÉMENTÉE (voir §4c).** Un modèle
> `BusinessHour` est ajouté (migration `20261015000000_add_business_hours`,
> **non appliquée**), et `create_appointment` refuse désormais toute prise en
> dehors des heures configurées (`TIME_OUTSIDE_BUSINESS_HOURS`). Sans
> configuration : comportement **non restreint** (décision A). Le client Prisma
> doit être régénéré (`prisma generate`) dans un environnement sain — la CLI
> Prisma est bloquée ici (voir §4).

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

- `prisma validate` / `prisma generate` : **OK en Phase 4A**. En Phase 4A.1 le
  CLI Prisma **restait bloqué indéfiniment** (même `prisma --version`, sans
  sortie) à cause d'un `node_modules` Prisma corrompu — **problème
  d'environnement préexistant**, identique à celui documenté en Phase 4A. Le
  schéma **n'a pas changé** (`git diff` sur `prisma/` vide), donc ce blocage est
  sans impact fonctionnel : le client déjà généré expose `Appointment` et
  `Prisma.TransactionIsolationLevel.Serializable` (vérifié par `tsc`).
- Suites de tests (aucune DB, deps injectées) :
  - `scripts/test-ai-appointment-tool.ts` (Phase 4A) : **vert**.
  - `scripts/test-ai-appointment-concurrency.ts` (Phase 4A.1) : **21 assertions
    A–M, vertes** (`AI APPOINTMENT CONCURRENCY : COUVERTURE COMPLÈTE`).
  - `scripts/test-ai-appointment-business-hours.ts` (Phase 4A.2) : **49
    assertions A–R, vertes** (`AI APPOINTMENT BUSINESS HOURS : COUVERTURE
    COMPLÈTE`).
  - `scripts/test-ai-tools.ts` (Phase 2) : **vert** (J1/J3/J5 toujours OK).
  - `scripts/test-telnyx-ai-tool-webhook.ts` (Phase 3) : **vert**.
- `eslint` (fichiers modifiés/nouveaux) : **0 erreur, 0 avertissement**.
- `tsc --noEmit` (Phase 4A.2) : **exit code = 2**, exactement **2 erreurs** :
  1. `lib/appointment-writer-prisma.ts(...)`: `Property 'businessHour' does not
     exist on type 'PrismaClient'` — **attendue** : le client n'a pas pu être
     régénéré ici (CLI Prisma bloquée) ; elle disparaît après `prisma generate`
     sur le schéma mis à jour.
  2. `lib/hermes-memory.ts(1,10)`: module `@redis-iris/agent-memory` **préexistante
     et environnementale**, fichier non touché.
  **0 erreur** dans les fichiers de logique pure (business-hours, time, handler,
  erreurs, types, tests) de cette phase.

## 4b. CONCURRENCY_HARDENING (Phase 4A.1)

### Course précédente (Phase 4A)

La détection de conflit (`findOverlappingAppointments`) et l'INSERT
(`createAppointment`) étaient **deux instructions en autocommit** (READ
COMMITTED), hors transaction. Deux requêtes concurrentes à `request_id`
**différents** sur des créneaux qui se chevauchent pouvaient toutes deux lire
« aucun chevauchement » avant que l'une n'ait écrit → **double réservation**.
La contrainte unique `idempotencyKey` ne protégeait QUE le rejeu d'un même appel
(même clé), jamais deux appels distincts. C'est le problème classique de
« phantom / write skew ».

### Mécanisme retenu

**Transaction PostgreSQL SERIALIZABLE + retry BORNÉ** (option B de la mission).

- La décision complète (idempotence → chevauchement → insertion) s'exécute dans
  **une seule** `prisma.$transaction(..., { isolationLevel: Serializable })`.
- PostgreSQL (SSI) détecte l'anti-dépendance lecture↔écriture croisée et annule
  l'un des deux ; Prisma remonte `P2034` (couvre SQLSTATE 40001
  serialization_failure et 40P01 deadlock).
- Retry borné : `maxAttempts = 4`, backoff `20·2^(n-1) + jitter` ms, **jamais
  infini**. Épuisement ⇒ résultat contrôlé `UNAVAILABLE` → HTTP 503
  `TEMPORARILY_UNAVAILABLE` (jamais une erreur SQL brute).
- Le perdant d'un `40001` est réessayé ; au 2ᵉ essai sa lecture (nouveau
  snapshot) voit le créneau committé → `CONFLICT` → `TIME_SLOT_UNAVAILABLE`.

### Pourquoi ce choix (A/B/C évalués)

- **A — contrainte d'exclusion GiST** (`EXCLUDE USING gist`, `btree_gist`) :
  c'est le graal DB, mais elle nécessite (1) une **extension Postgres**
  `btree_gist` (privilèges superuser/managed), (2) une contrainte **non
  modélisable par Prisma** (drift + risque de suppression par `migrate dev`),
  (3) une colonne `aiEmployeeId` **nullable** qui laisserait les lignes NULL
  hors de la garantie, (4) une détection d'erreur `23P01` peu fiable via
  Prisma. Rejetée pour cette itération (documentée).
- **B — SERIALIZABLE** : **retenue**. Aucune extension, aucune migration,
  nativement supportée par Prisma 6.19.3, mapping d'erreur stable (`P2034`),
  correcte multi-instances/serverless/workers (garantie côté DB, pas de verrou
  process-local).
- **C — verrou consultatif** (`pg_advisory_xact_lock`) : DB-backed et valide,
  mais convention applicative (dérivation de clé) ; gardée en réserve si la
  contention SERIALIZABLE s'avérait coûteuse.
- **Interdit et non utilisé** : verrous en mémoire, mutex de process, verrous
  Redis.

### Garanties DB

Pour un même couple `(organizationId, aiEmployeeId)`, deux créations
d'appointments qui **se chevauchent** ne peuvent pas toutes deux committer : au
plus une réussit, l'autre obtient un conflit contrôlé. Le prédicat reste
`[startsAt, endsAt)` : `existing.startsAt < requested.endsAt AND
existing.endsAt > requested.startsAt`. Le **dos-à-dos** (10:00–10:30 puis
10:30–11:00) reste autorisé (aucun buffer implicite introduit).

### Interaction idempotence

`executeAppointmentCreate` réconcilie DANS l'ordre : (1) échec d'unicité
(P2002) → relecture hors transaction par `idempotencyKey` → `DUPLICATE` avec le
MÊME rendez-vous ; (2) échec de sérialisation → retry borné ; (3) toute autre
erreur remonte. La décision relit **d'abord** l'idempotence, donc sur un retry
de SSI, un rejeu du même `request_id` retombe bien sur `DUPLICATE` (jamais un
faux `CONFLICT`). Clé inchangée : `request_id` s'il existe, sinon hash
sémantique.

### Périmètre tenant / ressource

Le chevauchement est scopé par `(organizationId, aiEmployeeId)` : des
appointments de deux **organisations** (isolation tenant) ou de deux
**employés** différents ne se bloquent pas mutuellement. La clé d'idempotence
inclut aussi l'`organizationId`.

### Impact migration

**Aucune migration.** Aucun changement de schéma, aucune extension, aucune
contrainte non-Prisma. `MIGRATION_APPLIED = NO`. Donc aucun risque de données
héritées ni de preflight (mission §12 : sans objet).

### Tests (Phase 4A.1)

`scripts/test-ai-appointment-concurrency.ts` (21 assertions A–M, vertes) via un
writer mémoire qui exécute les **fonctions pures de production** contre un
moteur imitant la sémantique SERIALIZABLE (snapshot + conflit à l'insertion) :

- **A** même `request_id` concurrent → 1 `CREATED` + 1 `DUPLICATE`, 1 ligne ;
- **B** request_ids différents, créneau identique → 1 `CREATED` + 1 `CONFLICT` ;
- **C** chevauchement partiel → 1 `CREATED` + 1 `CONFLICT` ;
- **D** intervalle imbriqué → conflit ;
- **E** dos-à-dos → 2 `CREATED` ;
- **F** employé différent → 2 `CREATED` ;
- **G** organisation différente → 2 `CREATED` (isolation tenant) ;
- **H** 1 échec SSI puis succès → `CREATED`, 2 tentatives ;
- **I** limite de retry atteinte → `UNAVAILABLE`, tentatives bornées, 0 écriture ;
- **J** idempotence séquentielle → même rendez-vous, pas de doublon ;
- **K** fuseau/DST inchangés (via le handler) ;
- **M** mapping handler : conflit → `TIME_SLOT_UNAVAILABLE`, contention →
  `TEMPORARILY_UNAVAILABLE`.

### Risques résiduels

- Sous très forte contention, des abandons SERIALIZABLE supplémentaires peuvent
  survenir : bornés par les 4 tentatives, sinon réponse 503 contrôlée (pas de
  fausse réservation). Un verrou consultatif ciblé (option C) pourrait réduire
  les faux positifs si la mesure le justifie.
- L'atomicité réelle dépend de PostgreSQL ; le writer mémoire n'est qu'un
  modèle de test (les garanties DB réelles ne s'exercent qu'avec la migration
  Phase 4A appliquée à une base).

## 4c. BUSINESS_HOURS (Phase 4A.2)

Objectif : empêcher `create_appointment` de réserver **en dehors des heures
d'ouverture**. Aucun outil, permission ou ressource Telnyx nouveau ; aucune
intégration calendrier externe.

### Audit préalable

- **Aucun** modèle `BusinessHours` / `Availability` / `Schedule` /
  `WorkingHours` / `OfficeHours` / jour férié dans `prisma/schema.prisma`.
- seul `lib/tools/scheduling.ts` = MOCK Cal.com (utilisé par
  `server/media-server.ts`), non branché à l'IA ;
- `FUTURE_AI_TOOLS.get_business_hours` / `get_agent_availability` : désactivés
  (motif « No BusinessHours model exists yet »). Motifs mis à jour (le modèle
  existe désormais, mais les outils de **lecture** restent hors périmètre).
- `Organization.timezone` (IANA, défaut `UTC`) réutilisé comme fuseau par défaut.

### Modèle & migration (schéma proposé, approuvé)

`model BusinessHour` : `id`, `organizationId`, `aiEmployeeId?` (nul = défaut
organisation), `dayOfWeek Int` (`Date.getDay()` : 0=dim..6=sam), `opensAt` /
`closesAt` (`"HH:mm"` **mural** local, jamais UTC), `enabled Boolean @default(true)`,
horodatages ; index `(organizationId, aiEmployeeId, dayOfWeek)` ; FK Cascade.
Migration **à la main** : `prisma/migrations/20261015000000_add_business_hours/
migration.sql` — **non appliquée** (`MIGRATION_APPLIED = NO`).

### Logique pure (`lib/ai-tools/business-hours.ts`)

- **Validation** (`validateBusinessHoursConfig`) : jour 0–6, `"HH:mm"` valide,
  `opensAt < closesAt` (fenêtres nocturnes **refusées**, option A §18),
  interdiction de fenêtres chevauchantes pour un même jour (adjacentes permises).
- **Hiérarchie** (`resolveBusinessHours`) : toute ligne employé **remplace**
  le défaut organisation ; sinon défaut organisation ; sinon **aucune config**.
- **Évaluation** (`evaluateBusinessHours`) : conversion UTC→heure murale via
  `getZonedParts` (nouvel export `time.ts`), puis containment **strict** dans
  UNE seule fenêtre du même jour local (`opensMinutes <= début && fin <=
  closesMinutes`, fermeture inclusive). Refus si le RDV franchit minuit local
  (`SPANS_DAYS`) ou tombe un jour fermé (`CLOSED_DAY`).
- **Prochaines fenêtres** (`findNextAvailableWindows`) : aperçu **borné**
  (7 jours, 3 résultats max), déterministe, **sans** examiner les RDV existants
  ni réserver automatiquement.

### Pipeline (§8) et décision « sans configuration »

Ordre dans le handler : validation → fuseau → conversion → rejet si passé →
**évaluation des horaires (lecture hors transaction)** → résolution contact →
`AUTHORIZED` → écriture SERIALIZABLE (idempotence+overlap, §4b, **inchangée**).
Sans configuration (`configured === false`), le comportement **legacy non
restreint** est conservé (décision A approuvée).

### Contrat d'erreur & observabilité

- Nouveau code `TIME_OUTSIDE_BUSINESS_HOURS` → **HTTP 409** (cohérent avec
  `TIME_SLOT_UNAVAILABLE`).
- L'échec expose des `details` **non sensibles** : `timezone`,
  `requestedStart`/`requestedEnd` (ISO), `nextAvailableWindows` (ISO, bornées).
- Événements `AI_APPOINTMENT_BUSINESS_HOURS_CHECK` (toujours) et
  `AI_APPOINTMENT_OUTSIDE_HOURS` (si refus) — identifiants/fuseau/horodatages
  uniquement, **sans PII**.

### Préservation des garanties existantes

Allowlist, permission `appointments:write`, `riskLevel=WRITE`, rate limit,
isolation tenant (lecture scopée `organizationId`), idempotence,
anti-double-réservation SERIALIZABLE + retry borné : **inchangés**. Les règles
de durée (5–480 min, défaut 30) sont réutilisées telles quelles.

### Tests (Phase 4A.2)

`scripts/test-ai-appointment-business-hours.ts` (49 assertions A–R, vertes) :
A validation de config ; B hiérarchie ; C dans les heures ; D avant ouverture ;
E débordement partiel (§7) ; F bornes incluses ; G jour fermé ; H fenêtres
multiples + trou ; I priorité employé→organisation ; J DST (spring/fall) ; K
chevauchement de minuit ; L même instant, fuseaux différents ; M isolation
multi-tenant ; N sans config non restreint ; O événements sans PII ; P détails
structurés + prochaines fenêtres bornées ; Q mapping webhook 409 + détails ;
R règles de durée.

### Limites assumées (Phase 4A.2)

- Aucune UI/route d'administration pour créer les `BusinessHour` (hors
  périmètre) : la validation de configuration est fournie comme fonction pure
  prête à être branchée.
- Pas de jours fériés/fermetures exceptionnelles (incrément futur).
- `findNextAvailableWindows` n'examine pas les RDV existants (aperçu
  d'ouverture, pas de réservation).



- **Horaires d'ouverture** : modèle `BusinessHour` + évaluation implémentés
  (Phase 4A.2, §4c). Restent hors périmètre : UI/API d'administration des
  horaires, jours fériés, et les outils de **lecture** `get_business_hours` /
  `get_agent_availability` (toujours dans `FUTURE_AI_TOOLS`).
- **Régénération du client Prisma** : requise (`prisma generate`) dans un
  environnement sain après l'ajout du modèle `BusinessHour` ; impossible ici
  (CLI Prisma bloquée).
- **Migration non appliquée** à une base réelle (volontaire).

## Verdicts

- `AI_WRITE_PERMISSION_MODEL` : **DONE** — `appointments:write` via
  `AIEmployee.allowedWriteTools` (défaut vide), read-only et write non fusionnés.
- `CREATE_APPOINTMENT_TOOL` : **DONE** — enregistré `WRITE`, désactivé par
  défaut, un seul endpoint, DTO borné.
- `APPOINTMENT_CONFLICT_HANDLING` : **DONE** — overlap `[start,end)` scopé
  employé/org → `TIME_SLOT_UNAVAILABLE` sans écriture ; désormais atomique.
- `AI_WRITE_TOOL_STATIC_READINESS` : **DONE** — `tsc`/`eslint` propres sur les
  fichiers de la phase (1 erreur tsc environnementale hors périmètre), aucune
  écriture Prisma dans `lib/ai-tools` (J1), suites Phases 2/3/4A/4A.1 vertes.

**Verdicts Phase 4A.1 (demandés) :**

- `APPOINTMENT_CONCURRENCY` : **READY** — transaction SERIALIZABLE + retry
  borné, correcte multi-instances/serverless (garantie DB).
- `APPOINTMENT_DOUBLE_BOOKING_PROTECTION` : **READY** — au plus un
  committe par `(organizationId, aiEmployeeId)` chevauchant ; perdant →
  `TIME_SLOT_UNAVAILABLE`/503 contrôlé.
- `APPOINTMENT_IDEMPOTENCY` : **READY** — clé unique (`request_id` sinon hash
  sémantique), `P2002` → `DUPLICATE` avec le même rendez-vous ; préservée sous
  retry SSI.
- `APPOINTMENT_WRITE_INTEGRITY` : **READY** — aucune erreur SQL/Prisma/stack
  exposée ; erreurs mappées vers le contrat d'outil.
- `MIGRATION_APPLIED` : **NO** — aucune migration requise ni appliquée.

**Verdicts Phase 4A.2 (demandés) :**

- `BUSINESS_HOURS` : **READY** — modèle `BusinessHour` (normalisé, validé),
  logique pure multi-fenêtres/jours, fuseau + DST, containment strict, refus
  des fenêtres nocturnes/chevauchantes ; sans config ⇒ non restreint (décision A).
- `BUSINESS_HOURS_ENFORCEMENT` : **READY** — `create_appointment` refuse hors
  heures **avant** toute écriture (`TIME_OUTSIDE_BUSINESS_HOURS`, 409) ; aucune
  écriture tentée sur refus.
- `BUSINESS_HOURS_TENANT_ISOLATION` : **READY** — lecture scopée
  `organizationId`; hiérarchie employé→organisation; aucune fuite inter-tenant.
- `BUSINESS_HOURS_ERROR_CONTRACT` : **READY** — code dédié + `details`
  non sensibles (fuseau, instants ISO, prochaines fenêtres bornées) ; jamais
  d'erreur brute.
- `BUSINESS_HOURS_OBSERVABILITY` : **READY** — `AI_APPOINTMENT_BUSINESS_HOURS_CHECK`
  / `AI_APPOINTMENT_OUTSIDE_HOURS`, sans PII.
- `MIGRATION_APPLIED` : **NO** — migration `20261015000000_add_business_hours`
  écrite à la main, **non appliquée** ; client Prisma à régénérer.

## Décision demandée

Revue de l'implémentation ci-dessus (Phases 4A + 4A.1 + 4A.2). Prochaines étapes
possibles : UI/API d'administration des `BusinessHour`, jours fériés, outils de
lecture d'horaires/disponibilité, verrou consultatif si la contention le
justifie. **Aucun commit** tant que non demandé explicitement.


## 4c. PHASE_4A_3_PRODUCTION_MIGRATION

### 4c.1 Statut migration BusinessHours
- Action : APPLIQUEE EN PROD (lancement explicite, hors build Vercel).
- Commande : npm run db:migrate:deploy (runner durci, timeout borne, fail-closed sur conn pool�e, classification des erreurs).
- Connexion : DIRECT_URL avec sslmode=require (ajout n�cessaire). MIGRATION_CONNECTION = DIRECT_URL.
- Pre-migration : 15/16, pending 20261015000000_add_business_hours. PRE_MIGRATION_STATE = EXPECTED, BUSINESS_HOURS_SQL_MATCH = YES, DESTRUCTIVE_SQL = NO.
- Post-migration : 16/16 appliqu�es (Database schema is up to date). MIGRATIONS_APPLIED=16, MIGRATIONS_PENDING=0.
- Dur�e : ~22,4 s, exit 0, OUTCOME = SUCCESS.

### 4c.2 V�rification sch�ma (prod)
- Table BusinessHour pr�sente (colonnes, index, FKs CASCADE OK). 0 ligne. BusinessHour delegate + Serializable disponibles.

### 4c.3 Build/types
- prisma validate PASS, prisma generate PASS, tsc --noEmit EXIT 0.

### 4c.4 Tests
- test-ai-appointment-business-hours.ts: 49 PASS (COUVERTURE COMPLETE).
- test-ai-appointment-tool.ts, test-ai-appointment-concurrency.ts, test-ai-tools.ts, test-telnyx-ai-tool-webhook.ts: COUVERTURE COMPLETE.

### 4c.5 Final Verdicts
DIRECT_URL=READY (sslmode=require), DATABASE_CONNECTIVITY=READY, BUSINESS_HOURS_MIGRATION=APPLIED, MIGRATIONS_APPLIED=16/16, MIGRATIONS_PENDING=0, BUSINESS_HOUR_TABLE=READY, PRISMA_VALIDATE/PASS, PRISMA_GENERATE/PASS, WEB_TSC=PASS, BUSINESS_HOURS_TESTS=PASS, APPOINTMENT_CONCURRENCY=READY, CREATE_APPOINTMENT_PRODUCTION_SCHEMA=READY, PHASE_4A_FINAL_READINESS=READY.
Migration appliqu�e explicitement et contr�l�e. Comportement no-config = unrestricted pr�serv�.
