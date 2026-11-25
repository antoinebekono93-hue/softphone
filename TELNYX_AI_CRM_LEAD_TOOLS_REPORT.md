# Rapport — Phase 4B : outils d'écriture CRM `create_lead` / `update_lead`

Statut : **IMPLÉMENTÉ, VALIDÉ (revue en attente)**. Deux outils d'écriture
CRM ajoutés, strictement scopés tenant et accordés explicitement. Aucun
provisioning Telnyx, aucun appel externe, aucun commit.

> **Aucune migration de schéma n'est requise** (`PHASE_4B_SCHEMA_MIGRATION =
> NOT_REQUIRED`) : le modèle canonique de lead est `Contact`, qui porte déjà la
> contrainte `@@unique([organizationId, phone])`
> (`prisma/schema.prisma:259`). La base est déjà à `16/16` migrations.

## 1. Audit CRM (rappel)

- **Modèle de lead canonique = `Contact`** (`schema.prisma:214`). Champs
  exploitables : `name?`, `company?`, `email?`, `phone`, `notes?`, `leadScore?`,
  `sentiment?`, `escalationStatus?`, `optedOut`, `isVip`. Contrainte
  `@@unique([organizationId, phone])` (ligne 259) ⇒ l'unicité par téléphone et
  par organisation est **garantie par la base**.
- `Lead` : **DOES_NOT_EXIST** (aucun modèle). `CANONICAL_LEAD_MODEL = Contact`.
- `Opportunity` : existe (`schema.prisma:732`) ; `stage` est une **chaîne
  libre** (`String @default("NEW")`, ligne 735), sans enum ni modèle `Stage` /
  `Pipeline`.
- `InternalNote` : existe (`schema.prisma:753`) mais **exige un `authorId`
  User** ⇒ impropre à une note IA ; l'historique IA est écrit dans
  `Contact.notes` (additif).

Conséquences de design retenues : deux outils **séparés** (`create_lead`,
`update_lead`, jamais un upsert implicite) ; identité = téléphone normalisé ;
anti-doublon = contrainte unique DB ; `stage`/`Pipeline` **non exposés** (pas
d'énumération sûre).

## 2. Implémentation

### 2.1 Autorisation explicite (jamais implicite)

- Nouvelle permission `AIToolPermission = 'leads:write'`.
- `grantedPermissionsFor` accorde `leads:write` **uniquement** si
  `'create_lead'` **ou** `'update_lead'` ∈ `AIEmployee.allowedWriteTools`
  (`LEAD_WRITE_TOOLS`). Les permissions read-only et write ne sont pas
  fusionnées.
- `buildToolDefinitionsForPermissions` continue de filtrer par permission :
  l'outil n'apparaît dans `allowedTools` que si `leads:write` est accordée.
  Un assistant sans grant ne voit pas les outils et se les voit refuser
  (`NOT_ALLOWED`, aucune écriture tentée).

### 2.2 `create_lead` (`riskLevel=WRITE`)

`lib/ai-tools/handlers/leads.ts`. Entrées (liste blanche stricte,
`additionalProperties:false`) : `phone` (**requis**), `name?`, `company?`,
`email?`, `notes?`.

Ordre : `AI_LEAD_CREATE_REQUESTED` → écriture présente → rejet clés inconnues →
normalisation téléphone → validation champs (longueurs, email) → refus d'un
« lead vide » (téléphone sans **aucun** détail identifiant) → création →
`AI_LEAD_CREATED`. DTO de sortie `LeadDTO = { id, name }` ; jamais d'objet
Prisma, jamais de téléphone/`notes`/`organizationId`.

- **Isolation** : `organizationId` provient **exclusivement** de la ligne
  `AIEmployee` (DB). Tout `organizationId` en argument est rejeté
  (`rejectUnknownKeys`).
- **Normalisation** : `lib/phone-number.ts` (`readPhone`) ; stockage du format
  canonique E.164.
- **Anti-doublon** : reposant sur `@@unique([organizationId, phone])`. Si un
  lead du **même tenant** porte déjà ce numéro → `LEAD_ALREADY_EXISTS` avec
  `details.leadId` (aucune seconde ligne). Un **autre tenant** n'est jamais
  bloqué.

### 2.3 `update_lead` (`riskLevel=WRITE`)

Identité via `contact_id` (**préféré**) ou `phone`. Champs modifiables :
`name?`, `company?`, `email?`, `notes?`. `phone`, `optedOut`, `leadScore`,
`sentiment`, `escalationStatus`, `assignedUserId`, `stage`/`status` :
**non modifiables** (hors périmètre ; `additionalProperties:false` les rejette).

- **Résolution déterministe** par téléphone (`resolveLeadByPhone`) :
  0 correspondance → `LEAD_NOT_FOUND` ; 1 → procède ; >1 → `LEAD_AMBIGUOUS`
  (`details.matchCount`). Les formats legacy multiples
  (`+237…`, `237…`, `00237…`) sont recherchés via
  `phoneNumberLookupCandidates`.
- **Aucun champ fourni** / **aucune identité** → `INVALID_ARGUMENTS`.
- **Notes additives** : `appendNote` **ajoute** à l'historique existant, ne
  l'écrase jamais.
- `contact_id` d'un autre tenant → `LEAD_NOT_FOUND` (lecture scopée).

Le port d'écriture (`lib/ai-tools/leads.ts`) reste **pur** ; l'implémentation
Prisma (`lib/crm-writer-prisma.ts`) est **hors** de `lib/ai-tools` pour
préserver l'invariant « pas d'écriture Prisma dans lib/ai-tools » (test J1).

### 2.4 Idempotence & concurrence

- **Création** : l'INSERT atomique est le claim ; une violation d'unicité
  (`P2002`) est relue et renvoyée `DUPLICATE` (même lead), jamais un doublon.
  Le rejeu du **même** appel (même `idempotencyKey`) est court-circuité par le
  replay store.
- **Mise à jour** : transaction PostgreSQL **SERIALIZABLE** + retry borné
  (`executeLeadUpdate`, max 4 tentatives, backoff exponentiel). La lecture de
  `notes` et l'écriture sont dans la même transaction ⇒ **aucune perte** de note
  en écriture concurrente. Épuisement ⇒ `UNAVAILABLE` → `TEMPORARILY_UNAVAILABLE`
  (aucune erreur DB brute).

### 2.5 Erreurs, audit, rate limit

- Codes ajoutés : `LEAD_NOT_FOUND`, `LEAD_ALREADY_EXISTS`, `LEAD_AMBIGUOUS`,
  `INVALID_STAGE`, `WRITE_TOOL_NOT_ALLOWED`. Détails bornés (`leadId?`,
  `matchCount?`).
- Mapping HTTP webhook : `LEAD_NOT_FOUND` → 404 ; `LEAD_ALREADY_EXISTS` → 409 ;
  `LEAD_AMBIGUOUS` → 409 ; `INVALID_STAGE` → 400 ; `WRITE_TOOL_NOT_ALLOWED` →
  403.
- Événements (identifiants uniquement, **sans PII**) :
  `AI_LEAD_CREATE_REQUESTED/_CREATED/_CREATE_DUPLICATE/_CREATE_FAILED`,
  `AI_LEAD_UPDATE_REQUESTED/_UPDATED/_UPDATE_NOT_FOUND/_UPDATE_AMBIGUOUS/
  _UPDATE_FAILED`.
- Rate limiter d'écriture distinct (`writeRateLimiter`) réutilisé, inchangé.

## 3. Validations

- `npx tsc --noEmit` : **exit 0** (aucune erreur).
- `npx prisma validate` : **schéma valide**.
- `npx tsx` suites Phase 4B :
  - `scripts/test-ai-crm-lead-tools.ts` — **COUVERTURE COMPLÈTE** (42 PASS).
  - `scripts/test-ai-crm-lead-update.ts` — **COUVERTURE COMPLÈTE** (31 PASS).
  - `scripts/test-ai-crm-lead-concurrency.ts` — **COUVERTURE COMPLÈTE**
    (16 PASS).
- Régressions Phase 2/3/4A :
  - `scripts/test-ai-tools.ts` — **COUVERTURE COMPLÈTE**.
  - `scripts/test-ai-appointment-tool.ts` — **COUVERTURE COMPLÈTE**.
  - `scripts/test-ai-appointment-concurrency.ts` — **COUVERTURE COMPLÈTE**.
  - `scripts/test-ai-appointment-business-hours.ts` — **COUVERTURE COMPLÈTE**.
  - `scripts/test-telnyx-ai-tool-webhook.ts` — **COUVERTURE COMPLÈTE**.

### Couverture Phase 4B (détail)

- **create** : enregistrement/WRITE ; grant explicite ; refus read-only et
  grant non-lead ; création nominale (tenant + téléphone canonique + DTO
  borné) ; lead vide refusé ; téléphone/email invalides ; clé inconnue ;
  doublon → `LEAD_ALREADY_EXISTS` (+`leadId`) ; isolation tenant ; rate limit ;
  rejeu idempotent ; webhook 403/200 ; audit sans PII.
- **update** : id et téléphone (legacy) ; `LEAD_NOT_FOUND` ;
  `LEAD_AMBIGUOUS` (+`matchCount`) ; id d'un autre tenant ; aucune
  identité/aucun champ ; email invalide ; clé/champ interdit (`optedOut`) ;
  notes additives ; non-perte de note concurrente ; audit des échecs ; mapping
  404/409.
- **concurrence** : deux `create` simultanés même org+phone → 1 seule ligne ;
  formats équivalents ; isolation tenant ; rejeu ; deux `update` simultanés
  sans perte de note ; contention épuisée → `TEMPORARILY_UNAVAILABLE` ; conflit
  transitoire rejoué.

## 4. Verdicts (§37)

- `CANONICAL_LEAD_MODEL` : **DONE** — `Contact` (contrainte
  `@@unique([organizationId, phone])` déjà présente). Aucun modèle `Lead` /
  `Pipeline` / `Stage` créé.
- `AI_LEAD_WRITE_PERMISSION_MODEL` : **DONE** — `leads:write` via
  `AIEmployee.allowedWriteTools` (défaut vide) ; read-only et write non
  fusionnés ; grant jamais implicite.
- `CREATE_LEAD_TOOL` : **DONE** — enregistré `WRITE`, DTO borné, téléphone
  requis + au moins un détail identifiant, aucune donnée tenant en argument.
- `UPDATE_LEAD_TOOL` : **DONE** — identité id/téléphone déterministe (0/1/>1),
  champs sur liste blanche, notes additives, `phone`/`stage` non modifiables.
- `LEAD_DUPLICATE_HANDLING` : **READY** — anti-doublon par contrainte unique DB
  (`P2002` → `DUPLICATE` → `LEAD_ALREADY_EXISTS`), rejeu idempotent, jamais de
  fusion sur similarité de nom.
- `LEAD_TENANT_ISOLATION` : **READY** — `organizationId` toujours issu du
  serveur ; lecture/écriture scopées ; aucun accès inter-tenant ; doublon
  détecté **par organisation** uniquement.
- `LEAD_CONCURRENCY` : **READY** — création atomique (unique DB) ; mise à jour
  SERIALIZABLE + retry borné, sans perte de note ; échec contrôlé sinon.
- `LEAD_ERROR_CONTRACT` : **DONE** — codes dédiés + `details` bornés ; mapping
  HTTP 404/409/400/403 ; jamais d'erreur Prisma/SQL/stack.
- `LEAD_OBSERVABILITY` : **DONE** — cycle d'audit complet, identifiants
  uniquement, **sans PII**.
- `PHASE_4B_SCHEMA_MIGRATION` : **NOT_REQUIRED** — aucune modification de
  schéma ; `Contact` existant réutilisé.
- `PHASE_4B_FINAL_READINESS` : **READY** — `tsc` exit 0, `prisma validate`
  valide, suites 4B et régressions 2/3/4A toutes vertes, aucune écriture Prisma
  dans `lib/ai-tools` (J1).

## 5. Décision demandée

Revue de l'implémentation Phase 4B ci-dessus. Prochaines étapes possibles :
exposition en lecture de l'historique de notes, gestion d'un modèle
`Stage`/`Pipeline` normalisé, `assignedUserId`/`optedOut` sous permission
dédiée. **Aucun commit** tant que non demandé explicitement.
