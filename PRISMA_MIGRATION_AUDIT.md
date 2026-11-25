# Audit — Environnement Prisma & Migrations

> **Mise à jour — mission « découpler les migrations Prisma du build Vercel ».**
> Le build n'applique plus aucune migration : `build = next build --webpack`.
> La migration est désormais une commande **explicite et durcie**
> (`npm run db:migrate:deploy`), avec **connexion directe requise (fail-closed)**
> et **timeout borné** (§2.1, §9, §15 à §18). Résultats :
> `VERCEL_AUTO_MIGRATION = DISABLED`, `BUILD_CAN_MUTATE_DB = NO`.
> La migration 4A.2 `20261015000000_add_business_hours` reste **PENDING**.
> Aucune migration n'a été appliquée, aucun commit / push / déploiement.

Statut initial : **AUDIT TERMINÉ (lecture seule)**. Aucun `migrate deploy` / `migrate dev` /
`db push` / `db seed` / `migrate reset`, aucune requête SQL d'écriture, aucun
commit / push / déploiement. La seule écriture effectuée est locale et hors
base : régénération du client Prisma (`node_modules/`), nettoyage d'artefacts
temporaires, correction d'un shim de types (voir §11). `MIGRATION_APPLIED = NO`
pour la migration 4A.2.

Objectif : lever le blocage « CLI Prisma » de la Phase 4A.2, régénérer le client
(`businessHour`, `TransactionIsolationLevel.Serializable`), vérifier l'intégrité
de l'historique de migrations, évaluer le risque de migration automatique par le
build Vercel, et rendre une recommandation de déploiement.

---

## 1. Environnement

| Élément | Valeur |
|---|---|
| Node.js | v22.22.0 |
| npm | 10.9.4 |
| pnpm | 9.15.4 présent (non utilisé par les scripts) |
| yarn | absent |
| `prisma` (CLI) | **6.19.3** (pinned) |
| `@prisma/client` | **6.19.3** (pinned) |
| TypeScript | 5.9.3 (résolu par la CLI ; `typescript: ^5` en devDep) |
| OS cible | win32 / x64 |
| Query engine | `libquery-engine c2990dca…` (`node_modules/@prisma/engines/query_engine-windows.dll.node`) |
| Schema engine | `schema-engine-cli c2990dca…` (`node_modules/@prisma/engines/schema-engine-windows.exe`) |

Versions CLI/client **alignées** (6.19.3) : pas de décalage générateur/runtime.

### 1.1 Diagnostic du « blocage » de la CLI (résolu)

Le blocage constaté en Phase 4A.2 était **environnemental**, pas une corruption :

- Un `next build --webpack` relancé en arrière-plan saturait le CPU. Le require
  du bundle CLI (`prisma/build/index.js`, ~2,8 Mo) prenait alors plusieurs
  minutes et semblait figé.
- Les tests précédents utilisaient `Start-Job`/`Stop-Job`, dont le cycle de vie
  faussait la mesure (sortie bufferisée, job non terminé).
- Une fois les processus `node` terminés, `require('prisma/build/index.js')`
  aboutit en **~8,5 s**, et toutes les commandes CLI (`--version`, `validate`,
  `generate`, `migrate status`) s'exécutent normalement.

**Conclusion : `PRISMA_CLI = OK`.** Aucune réinstallation n'a été nécessaire.
(L'historique du rapport 4A mentionne une install `node_modules` partiellement
corrompue antérieure — `*.wasm` restaurés — désormais résolue : les 12 fichiers
`*.wasm` sont présents dans `node_modules/prisma/build`.)

---

## 2. Configuration Prisma

- **Schéma** : `prisma/schema.prisma` (unique).
- **Datasource** : `provider = "postgresql"`, `url = env("DATABASE_URL")`,
  **pas de `directUrl`**.
- **`prisma.config.ts`** : **absent**. Un avertissement CLI signale que la
  configuration `package.json#prisma` est **dépréciée** (suppression prévue en
  Prisma 7) :
  ```json
  "prisma": { "seed": "npx tsx prisma/seed.ts" }
  ```
  → à migrer vers `prisma.config.ts` avant Prisma 7 (non bloquant aujourd'hui).
- **Variables d'environnement** (présence uniquement, aucune valeur exposée) :
  - `.env` : `DATABASE_URL` présent (hôte `kgebwferveweznnuutxc.db.eu-central-1.nhost.run:5432`) ;
    paramètres d'URL : `schema`, `sslmode`, **`pgbouncer`**.
  - `.env.local` : `DATABASE_URL` présent (même hôte) ; paramètres : `schema`, `sslmode` (**pas de `pgbouncer`**).
  - `DIRECT_URL` : **absent** des deux fichiers.
  - `.env.utf16-backup` présent (hors périmètre ; encodage backup).
  - `.gitignore` ignore `.env*` → **secrets non versionnés**.
- **Prisma CLI vs Next** : la CLI charge `.env` (donc `pgbouncer=true`) ;
  Next.js charge `.env.local` en priorité (donc sans `pgbouncer`). Les deux
  pointent vers la **même** base hébergée.

> **PGBOUNCER_MIGRATION_RISK = MOYEN.** Les migrations Prisma s'exécutent via une
> connexion poolée (`pgbouncer=true`). En pratique les migrations 20261013 et
> 20261014 ont bien été appliquées (voir §6), donc la voie fonctionne ; il reste
> recommandé d'utiliser une connexion **directe** pour les migrations
> (`DIRECT_URL` + `directUrl` dans la datasource).

### 2.1 Scripts de build / déploiement

**AVANT (risqué — corrigé) :**

- `package.json` :
  - `build` = `node scripts/migrate-deploy.mjs && next build --webpack`
  - `db:migrate` = `prisma migrate deploy`
- `scripts/migrate-deploy.mjs` : `spawnSync("npx", ["prisma","migrate","deploy"])`,
  **4 tentatives**, délai **20 s**, `shell: true` sous Windows,
  **aucun `timeout`** → si la CLI se fige, le build se fige.
- `vercel.json` : `{ "regions": ["fra1"] }` uniquement, **aucun `buildCommand`**
  → le build Vercel utilisait `package.json#build`, donc **appliquait les
  migrations à chaque déploiement**.

> **VERCEL_AUTO_MIGRATION_RISK = OUI — DÉJÀ RÉALISÉ.** Toute migration `*.sql`
> committée sur `main` était appliquée automatiquement au prochain build Vercel
> (preuve §6 : 20261013 et 20261014 sont déjà appliquées).

**APRÈS (état actuel — découplé) :**

- `package.json` :
  - `build` = **`next build --webpack`** (plus aucune invocation Prisma).
  - `db:migrate` = `npm run db:migrate:deploy` (alias explicite).
  - `db:migrate:deploy` = **`node scripts/migrate-deploy.mjs`** (commandes durcie).
  - `postinstall` = `prisma generate` (**inchangé** : n'écrit pas en base).
- `scripts/migrate-deploy.mjs` **durci** : connexion directe requise (fail-closed),
  `spawnSync` avec **`timeout` borné**, kill du sous-processus, classification
  d'erreurs réelle, essais finis. Détails §16.
- `vercel.json` : inchangé (`regions: ["fra1"]`), mais sans effet sur le schéma
  car plus appelé par le build.

> **VERCEL_AUTO_MIGRATION = DISABLED.** Le build Vercel ne peut plus modifier la
> base (vérifié §17 : `BUILD_CAN_MUTATE_DB = NO`).

---

## 3. Validation & génération

| Commande | Résultat |
|---|---|
| `prisma validate` | **PASS** — « The schema … is valid 🚀 » (exit 0) |
| `prisma generate` | **PASS** — « Generated Prisma Client (v6.19.3) … in 4.49s » (exit 0) |

Vérifications du client régénéré :

- `prisma.businessHour` : **présent** (`BusinessHour` type L321, delegate
  `prisma.businessHour` L1047, 880 occurrences).
- `Prisma.TransactionIsolationLevel.Serializable` : **présent** (`Serializable: 'Serializable'`).
- Vérification **runtime** (`new PrismaClient()` sans requête, sans connexion) :
  `typeof p.businessHour = object`, `Serializable = Serializable`. Aucune
  connexion base déclenchée.

### 3.1 Typecheck (`tsc --noEmit`)

| Moment | Erreurs |
|---|---|
| Avant `generate` | 2 : `appointment-writer-prisma.ts(138,32) TS2339 'businessHour' …` + `hermes-memory.ts(1,10) TS2614` |
| Après `generate` | 1 : `hermes-memory.ts(1,10) TS2614` (l'erreur `businessHour` a disparu ✅) |
| Après correction shim (§11) | **0 — exit 0 (clean)** |

---

## 4. Inventaire des migrations (16)

| # | Migration | Lignes | Contenu | Sûreté |
|---|---|---|---|---|
| 1 | `0001_init` | 1068 | Schéma initial complet | Création uniquement |
| 2 | `20260904000000_phase1_unlimited_calls_and_app_to_app` | 151 (+`pre_migration_inspection.sql`) | Enums, colonnes, `CallReservation`/`CallLimit`/`UsageLog`/`AppCallSession`, Float→Decimal | ALTER/ADD + cast `USING` |
| 3 | `20260908000000_add_webhook_event_idempotency` | 14 | Table `WebhookEvent` | Création |
| 4 | `20260908010000_add_voice_margin_settings` | 5 | Colonnes `SystemSettings` | ADD COLUMN |
| 5 | `20260909010000_add_exact_call_seconds` | 4 | Colonne + **backfill** `UPDATE` | ADD + UPDATE idempotent |
| 6 | `20260909020000_add_telnyx_cdr_reconciliation` | 7 | Colonnes `CallLog`/`NumberOrder` | ADD COLUMN |
| 7 | `20260909030000_add_user_telnyx_credentials` | 7 | Colonnes `User` + index uniques | ADD + INDEX |
| 8 | `20260909040000_add_incoming_call_routing` | 20 | Colonnes `PhoneNumber`/`CallLog` + FK self-réf. | ADD + INDEX + FK |
| 9 | `20260910000000_add_telnyx_public_key` | 2 | `SystemSettings.telnyxPublicKey` | ADD COLUMN |
| 10 | `20260910010000_add_voicemail` | 12 | Colonnes `PhoneNumber`/`CallLog` + index | ADD + INDEX |
| 11 | `20260917000000_production_whatsapp` | 23 | Colonnes `WhatsAppAccount`/`WhatsAppTemplate` | ADD + `DROP NOT NULL` + defaults |
| 12 | `20261011000000_add_payment_intent` | 24 | Table `PaymentIntent` + FK | Création |
| 13 | `20261012000000_add_payment_intent_country` | 2 | `PaymentIntent.chargeCountry` | ADD COLUMN |
| 14 | `20261013000000_add_telnyx_ai_assistant` | 7 | `AIEmployee.telnyxAssistantId`/`voiceProvider`, `CallLog.telnyxConversationId` | ADD + INDEX UNIQUE |
| 15 | `20261014000000_add_ai_appointment_write_tool` | 46 | `Organization.timezone`, `AIEmployee.allowedWriteTools`, table `Appointment` + index + FK | Création |
| 16 | `20261015000000_add_business_hours` | 27 | Table `BusinessHour` + index + FK | Création — **NON APPLIQUÉE** |

**Ordre :** `0001_init` puis horodatages strictement croissants → ordre
lexicographique Prisma correct.

Fichier annexe : `20260904000000_…/pre_migration_inspection.sql` (script `psql`
**lecture seule** avec méta-commandes `\echo`). Prisma n'applique que
`migration.sql` → **ignoré, sans effet**.

---

## 5. Revue de sûreté du SQL

Balayage de **toutes** les migrations :

- **Aucun** `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE FROM`, `DROP TYPE`,
  `DROP SCHEMA`, `RENAME`.
- Seul `DROP` présent : `ALTER COLUMN "accessToken" DROP NOT NULL`
  (whatsapp) → **relâche** une contrainte, non destructif.
- Une **écriture de données** : `20260909010000` →
  `UPDATE "Organization" SET "callSecondsUsedThisMonth" = GREATEST("minutesUsedThisMonth",0)*60;`
  → backfill additif, borné (`GREATEST(…,0)`), rejouable sans perte.
- Changements de type phase1 : `ALTER COLUMN … SET DATA TYPE DECIMAL … USING "col"::decimal(…)`
  → élargissement/qualification avec cast explicite (données préservées).
- Aucune opération longue de type réécriture de table massive hors phase1.

**SQL_SAFETY = PASS.** Le seul point d'attention reste le backfill et le cast
phase1 (déjà appliqués en base — voir §6), sans risque pour les nouvelles
migrations 4A / 4A.2.

Un script de contrôle pré-migration a été fourni (`pre_migration_inspection.sql`)
pour détecter d'éventuels débordements de précision avant le cast Float→Decimal.

---

## 6. État des migrations côté base (⚠️ découverte majeure)

`prisma migrate status` **s'est connecté avec succès** :

```
Datasource "db": PostgreSQL database "kgebwferveweznnuutxc", schema "public"
at "kgebwferveweznnuutxc.db.eu-central-1.nhost.run:5432"
16 migrations found in prisma/migrations
Following migration have not yet been applied:
20261015000000_add_business_hours
```

| Verdict | Valeur |
|---|---|
| `DB_CONNECTIVITY` | **OK** (Nhost eu-central-1, schéma `public`) |
| Migrations trouvées | 16 |
| **Appliquées** | **15** |
| **En attente** | **1** : `20261015000000_add_business_hours` |
| `MIGRATION_APPLIED` (4A.2) | **NO** |

> ⚠️ **Découverte importante pour le cadrage initial :** les migrations
> `20261013000000_add_telnyx_ai_assistant` et
> `20261014000000_add_ai_appointment_write_tool` sont **DÉJÀ APPLIQUÉES** sur la
> base cible. Le suivi git confirme qu'elles sont **committées** (HEAD, commit
> `94061a7`), donc le build Vercel les a appliquées automatiquement. La
> contrainte « ne pas appliquer 20261013000000 » est donc **déjà dépassée par la
> réalité** : elle est en base. Aucune action de notre part n'a appliqué ces
> migrations ; elles l'étaient avant cet audit.

Conséquence : la seule migration **pendante** est `add_business_hours`
(non committée, non appliquée). Depuis le découplage (§9), elle **ne sera plus
appliquée automatiquement** : elle requiert l'exécution explicite de
`npm run db:migrate:deploy`.

> **Connectivité (re-contrôle en fin de mission).** Un second `prisma migrate
> status` (lecture seule) a échoué sur **`P1001: Can't reach database server`**
> (3 tentatives). La base se met en veille (cf. `keepalive` `.github/workflows/cron.yml`)
> / réseau transitoire. Il ne s'agit **pas** d'un changement d'état des
> migrations. Dernier état **connu fiable** dans cette session : **15 appliquées
> / 1 en attente**. `DB_CONNECTIVITY = DÉGRADÉ (transitoire, P1001)` à cet instant.

---

## 7. Contrôle schéma ↔ migrations (4A / 4A.2 / telnyx_ai)

Vérifié à la main, colonne par colonne, entre `prisma/schema.prisma` et le DDL :

- **`20261015000000_add_business_hours`** ↔ `model BusinessHour` : identiques
  (`organizationId`, `aiEmployeeId?`, `dayOfWeek Int`, `opensAt`/`closesAt` String,
  `enabled Boolean @default(true)`, timestamps ; index
  `(organizationId, aiEmployeeId, dayOfWeek)` ; FK Cascade ×2). Le modèle généré
  correspond au SQL.
- **`20261014000000_add_ai_appointment_write_tool`** ↔ `Organization.timezone`,
  `AIEmployee.allowedWriteTools`, `model Appointment` : identiques (index uniques
  `idempotencyKey`, index composites, FK Cascade/SetNull).
- **`20261013000000_add_telnyx_ai_assistant`** ↔ champs `telnyxAssistantId`
  (unique), `voiceProvider`, `telnyxConversationId` : identiques.

`schema.prisma` diffère de HEAD de **+27 lignes seulement** (modèle `BusinessHour`
+ 2 relations inverses) → pas de dérive inattendue introduite par cette mission.
`model FcmDeviceToken` (L1294, refs L80/L158) est **présent dans HEAD** : ce n'est
pas une modification de travail.

> **Limite méthodologique :** la dérive *structurelle* base ↔ migrations
> (`migrate diff --from-migrations`) n'a pas été exécutée car elle nécessite une
> **shadow database** (création d'objets) — interdit par le périmètre. L'absence
> d'échec signalée par `migrate status` et la correspondance manuelle ci-dessus
> couvrent le besoin. Aucune migration marquée « failed » n'a été rapportée.

---

## 8. Ordre & intégrité

- 16 répertoires, noms uniques, horodatages strictement croissants.
- Aucun doublon de nom ; `0001_init` trié correctement avant les suffixes numériques.
- Historique base : 15/16 appliquées, cohérent, sans migration orpheline/failed.

---

## 9. Découplage build ↔ migrations (CORRIGÉ)

**Ancienne chaîne (risquée) :** `git push main` → build Vercel →
`node scripts/migrate-deploy.mjs` → `npx prisma migrate deploy` (jusqu'à 4×, sans
timeout) → `next build --webpack`. Chaque build pouvait donc muter la base.

**Nouvelle chaîne (sûre) :**

```
Vercel / CI build :  npm ci → postinstall `prisma generate` → next build --webpack → deploy
Migration (explicite, hors build) : npm run db:migrate:deploy
```

- `build` **n'invoque plus** `migrate deploy` / `migrate dev` / `db push` / SQL
  (preuve §17 : log de `npm run build`).
- La seule voie de mutation est la commande explicite `db:migrate:deploy`.
- **`VERCEL_AUTO_MIGRATION = DISABLED`**, **`BUILD_CAN_MUTATE_DB = NO`**.
- Les migrations committées ne s'appliquent plus d'elles-mêmes : `20261015000000_add_business_hours`
  restera **PENDING** jusqu'à une exécution intentionnelle.

> **`postinstall` conservé** : `prisma generate` ne touche pas la base et reste
> nécessaire pour générer le client au build. Générer ≠ migrer.

---

## 10. Points d'attention (pré-vol)

1. **Découverte §6** : migrations 20261013/20261014 déjà en prod (cadrage à
   corriger avec l'utilisateur).
2. **`DIRECT_URL` absent** : le runner migration est désormais **fail-closed** —
   sans `DIRECT_URL`, et avec un `DATABASE_URL` poolé (`pgbouncer=true`),
   `db:migrate:deploy` **refuse** de s'exécuter (voir §16). Configurer `DIRECT_URL`
   (connexion directe non poolée Nhost) avant de migrer.
3. **`spawnSync`** : **corrigé** — timeout borné + kill (voir §16).
4. **Dépréciation `package.json#prisma`** (Prisma 7) → migrer vers `prisma.config.ts`.
5. **`prisma/dev.db`** (SQLite) : relique inutilisée avec le provider PostgreSQL.
6. **Artefacts `node_modules`** : `@prisma/.client-Boo7TE7p/` (install partielle) et
   `node_modules/prisma/query_engine-windows.dll.node` (racine du paquet) —
   cosmétiques, sans impact.
7. **`.env.utf16-backup`** : fichier backup hors périmètre (encodage).
8. **Résiduel — `push-db.js`** (racine) : `npx prisma db push --accept-data-loss`
   (il retire `pgbouncer`/`schema` et force `connection_limit=1`). **Hors build**,
   mais c'est une voie manuelle de mutation destructive. À retirer ou durcir
   séparément (hors périmètre de cette mission). Autres scripts DB racine
   (`test-db.js`, `test-prisma.mjs`, `query-users.js`) : usage manuel.

---

## 11. Revue du shim de types `@redis-iris/agent-memory`

- Le paquet installé (`@redis-iris/agent-memory@0.1.1`) **ne fournit aucun `.d.ts`**
  (uniquement des `.d.ts.map`) ; son `package.json#types` pointe vers un fichier
  **inexistant** → l'import était typé `any` implicite (TS7016 sous `strict`).
- Un shim `types/@redis-iris/agent-memory.d.ts` (non suivi) avait été ajouté :
  `declare module … { const x: any; export = x; export default x; }`.
  Or le **runtime exporte `AgentMemory` en named export** (vérifié :
  `require(...)` → `keys=…,AgentMemory` ; `typeof AgentMemory = function` ; pas de
  `default`). `lib/hermes-memory.ts` importe bien `{ AgentMemory }`.
- Le shim (default-only) était donc **incorrect** et provoquait l'unique erreur
  `TS2614`. **Correction minimale** (triviale, isolée) appliquée :

  ```ts
  declare module '@redis-iris/agent-memory' {
    export const AgentMemory: any;
  }
  ```

- Résultat : `tsc --noEmit` → **0 erreur**. Le shim est typé `any` (perte de typage
  assumée ; le paquet n'expose pas de types utilisables en l'état).

`REDIS_IRIS_TYPE_SHIM = CORRIGÉ.`

---

## 12. Verdicts

| Clé | Valeur |
|---|---|
| `PRISMA_CLI` | **OK** (blocage = contention CPU, résolu) |
| `PRISMA_ENVIRONMENT` | **OK** |
| `SCHEMA_VALID` | **PASS** |
| `PRISMA_GENERATE` | **PASS** |
| `BUSINESS_HOUR_CLIENT` | **AVAILABLE** |
| `SERIALIZABLE_ENUM` | **AVAILABLE** |
| `TSC` | **PASS (0 erreur)** |
| `MIGRATIONS_TOTAL` | **16** |
| `SQL_SAFETY` | **PASS** |
| `DB_CONNECTIVITY` | **OK** au moment de l'audit ; **DÉGRADÉ (P1001 transitoire)** au re-contrôle (§6) |
| `MIGRATIONS_APPLIED` | **15 / 16** (dernier état fiable, cette session) |
| `MIGRATION_PENDING` | `20261015000000_add_business_hours` |
| `MIGRATION_APPLIED` (4A.2) | **NO** |
| `SCHEMA_DRIFT` | Non évalué via shadow DB (hors périmètre) — historique en phase |
| `VERCEL_AUTO_MIGRATION_RISK` | OUI historiquement — **déjà réalisé** (20261013/14 en prod) |
| `VERCEL_AUTO_MIGRATION` | **DISABLED** (build découplé, §9) |
| `BUILD_CAN_MUTATE_DB` | **NO** (preuve §17) |
| `EXPLICIT_MIGRATION_COMMAND` | **READY** (`npm run db:migrate:deploy`, durci §16) |
| `MIGRATION_CONNECTION` | **DIRECT_URL** (requis ; absent actuellement → fail-closed) |
| `REDIS_IRIS_TYPE_SHIM` | **CORRIGÉ** |

---

## 13. Recommandation finale

### **SAFE_TO_PREPARE_DEPLOY = OUI**

Justification : CLI réparée/opérationnelle, schéma valide, client régénéré
(`businessHour` + `Serializable` disponibles), `tsc` propre, historique 15/16
cohérent, **aucun SQL destructif**, migration 4A.2 purement additive (nouvelle
table + index + FK), et **build découplé** (aucune mutation de base au déploiement).

**Réserves / conditions :**
1. **Corriger le cadrage** : 20261013 et 20261014 sont **déjà en base** (contredit
   l'hypothèse initiale). À valider avec l'utilisateur avant tout nouveau geste.
2. **Configurer `DIRECT_URL`** (connexion directe non poolée) avant d'exécuter
   `db:migrate:deploy` — sinon le runner refusera (fail-closed, §16).
3. La migration 4A.2 ne sera **plus** appliquée automatiquement : l'exécuter
   explicitement **avant** de déployer du code qui dépend de `BusinessHour`
   (ordre recommandé : migration → vérif → déploiement, §15).
4. Traiter séparément le résiduel `push-db.js` (§10.8).

Aucune action bloquante de type `BLOCKED_BY_DATABASE` ou
`BLOCKED_BY_PRISMA_ENVIRONMENT` : l'environnement Prisma est sain (la base a
répondu pendant l'audit ; voir la note de connectivité transitoire §6).

---

## 14. Actions effectuées / NON effectuées

**Effectuées (locales, hors base) :**
- `prisma validate` (lecture seule) — PASS.
- `prisma generate` (écrit uniquement `node_modules/@prisma/client` + `node_modules/.prisma/client`) — PASS.
- `prisma migrate status` (lecture seule) — 15/16 (puis P1001 transitoire au re-contrôle).
- `tsc --noEmit` (3 passes) — de 2 erreurs à **0**.
- Nettoyage de **7** fichiers `*.tmp*` résiduels dans `node_modules/.prisma/client`.
- Correction du shim `types/@redis-iris/agent-memory.d.ts`.
- **Découplage build ↔ migrations** : `package.json` (`build`, `db:migrate`,
  `db:migrate:deploy`) ; durcissement `scripts/migrate-deploy.mjs` ; ajout
  `scripts/test-migrate-deploy.mjs` (15 assertions, PASS).
- **Validation statique** : `tsc --noEmit` (exit 0), `eslint` sur scripts modifiés
  (exit 0), `git diff --check` (seules des lignes pré-existantes de fichiers
  mobiles non touchés signalées).
- **Preuve build** : `npm run build` → log sans aucune invocation Prisma (§17).

**NON effectuées (conformément au périmètre) :**
- Aucun `prisma migrate deploy` / `migrate dev` / `db push` / `migrate reset` / `db seed`.
- Aucune requête SQL d'écriture ; aucune application de migration.
- Aucun commit, push, déploiement.
- Aucune modification des fichiers de travail sans lien (Expo/mobile `apps/`,
  `packages/`, `components/mobile/**`, `eslint.config.mjs`, `tsconfig.json`).

---

## 15. Processus de déploiement des migrations (recommandé)

Découplé du build applicatif. Ordre **schéma d'abord, code ensuite** :

1. **Préparer** : créer la migration localement (`prisma migrate dev` en dev ou
   édition manuelle + `prisma migrate diff`), la **relire** (§5 sûreté SQL).
2. **Vérifier l'état** (lecture seule) : `npx prisma migrate status` — attendu
   « up to date » ou liste des migrations pending.
3. **Appliquer explicitement** : `npm run db:migrate:deploy` (jamais via le build).
   - Requiert `DIRECT_URL` (sinon échec fail-closed, §16).
   - Idempotent : ré-exécutable sans rejouer les migrations déjà appliquées.
4. **Vérifier post-migration** : `npx prisma migrate status` doit indiquer toutes
   les migrations appliquées ; contrôle optionnel des tables (`BusinessHour`).
5. **Déployer l'application** (Vercel) — build sans migration ; le code qui dépend
   du nouveau schéma est déployé **après** la migration.

> **Règle d'or** : ne jamais déployer de code dépendant d'un schéma non encore
> migré. Migration → vérification → déploiement.

---

## 16. Durcissement du runner (`scripts/migrate-deploy.mjs`)

| Aspect | Avant | Après |
|---|---|---|
| Connexion | `DATABASE_URL` (poolé `pgbouncer=true`) | **`DIRECT_URL` requis** ; échec fail-closed si seul un URL poolé est présent |
| Timeout | **aucun** | **120 000 ms** + `killSignal: SIGTERM` (bornage réel du `spawnSync`) |
| Tentatives | 4 fixes | **3**, avec **délai 15 s** entre essais |
| Classification | succès/échec binaire | `OUTCOME` : `SUCCESS`, `DB_UNREACHABLE`, `TIMEOUT`, `PRISMA_ERROR`, `UNKNOWN_FAILURE` |
| Retry | systématique | **uniquement** sur `DB_UNREACHABLE` / `TIMEOUT` (pas sur erreur Prisma = pas de rejeu inutile) |
| Testabilité | logique inline | helpers exportés (`resolveMigrationUrl`, `looksPooled`, `classifyMigrationResult`) + `main` gardé |

Tests unitaires purs : `scripts/test-migrate-deploy.mjs` (**15 assertions, PASS**).
Fail-closed vérifié contre le `.env` réel : `ok=false`,
`reason=pooled_requires_direct` (aucune connexion base déclenchée).

> **`MIGRATION_CONNECTION = DIRECT_URL`.** Le runner **ne se rabat pas** sur la
> connexion poolée pour les migrations (sûreté > commodité).

---

## 17. Preuve que le build ne mute pas la base

- `npm run build` exécute `next build --webpack` : le log de build ne contient
  **aucune** occurrence de `prisma`, `migrate`, `migrate-deploy`, `db push` ou
  `Migration` (recherche `Select-String` — résultat : *NONE*).
- Le build a **compilé avec succès** (« ✓ Compiled successfully ») avant d'être
  interrompu par l'outil pendant la phase TypeScript post-compilation (pas un
  échec de build ; `tsc` est par ailleurs à 0 erreur).
- `postinstall` = `prisma generate` (génération de code uniquement, **pas** de
  connexion base).

**`BUILD_CAN_MUTATE_DB = NO`.**

---

## 18. Stratégie Vercel / CI / protection contre les exécutions concurrentes

- **Vercel (aujourd'hui)** : build = `next build --webpack` uniquement. Aucun
  `buildCommand` dans `vercel.json`. Les déploiements ne touchent plus la base.
- **Migration (aujourd'hui)** : étape **manuelle explicite** (`db:migrate:deploy`)
  déclenchée intentionnellement, hors chaîne de build.
- **CI (futur, optionnel)** : un **job dédié** exécutant `db:migrate:deploy`, avec
  `DIRECT_URL`, **verrou de concurrence** (`concurrency` GitHub Actions) et
  `timeout-minutes`. **Jamais** dans le build de plusieurs instances.
- **Protection concurrence** : `prisma migrate deploy` est *best-effort* face aux
  exécutions simultanées (advisory lock Postgres), mais la stratégie retenue
  évite structurellement le problème :
  - une **seule** exécution de migration à la fois (étape manuelle unique, ou job
    CI avec `concurrency` qui annule/attend les autres) ;
  - **aucune** migration dans un build que Vercel/Vercel-like peut lancer en
    parallèle sur plusieurs régions/instances ;
  - retry interne borné côté runner (§16) sans relancer une migration réussie.

> **Garantie** : le risque « plusieurs builds déclenchent chacun `migrate deploy` »
> est **éliminé** puisque le build n'invoque plus la migration.
