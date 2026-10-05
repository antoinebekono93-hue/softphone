# RÉSULTATS DE VALIDATION LIVE — REALTIME / CALL / AUDIO

**Date :** 3 octobre 2026
**Statut :** **LIVE VALIDATION NON EXÉCUTABLE PAR L'AGENT — PHASE 1 BLOQUÉE**
**Verdict :** `REALTIME_CALL_AUDIO_LIVE_VALIDATION` = **PENDING** (inchangé)

---

## AVERTISSEMENT D'INTÉGRITÉ

Aucune valeur `PASS` n'a été inventée ci-dessous. Les scénarios 1 à 12 exigent des
appareils physiques, deux comptes utilisateurs authentifiés, une coupure réseau
réelle, un navigateur réel et (pour 8 et 9) des appels PSTN payants. Un agent CLI
sans accès navigateur, sans device et sans comptes ne peut pas les exécuter.

Les seuls constats ci-dessous sont **réellement exécutés** et reproductibles.

---

## 1. PHASE 1 — SCÉNARIOS 1 à 7

| Test | Scénario | Verdict | Raison |
| :--- | :--- | :--- | :--- |
| TEST_01 | APP_TO_APP même réseau | **NOT_RUN** | 2 devices + 2 comptes authentifiés requis |
| TEST_02 | APP_TO_APP réseaux différents | **NOT_RUN** | 2 réseaux physiques distincts requis |
| TEST_03 | Cloudflare TURN forcé (`relay`) | **NOT_RUN — outillage désormais prêt** | Mode relay forcé **ajouté** (opt-in strict). L'exécution exige toujours un navigateur réel |
| TEST_04 | Reconnexion après perte réseau | **NOT_RUN** | Coupure réseau physique sur device requis |
| TEST_05 | Permission micro refusée | **NOT_RUN** | État de permission navigateur réel requis |
| TEST_06 | Autoplay audio bloqué | **NOT_RUN** | Politique autoplay navigateur réel requise |
| TEST_07 | Mute / unmute répété | **NOT_RUN** | Appel actif réel requis |

**`REALTIME_FREE_PATH_VALIDATION` = `PENDING`** — aucun des 7 scénarios n'a pu être exécuté.

---

## 2. PREUVES TECHNIQUES RÉELLEMENT OBTENUES

Suites offline exécutées sur le code source. Ce sont des tests de logique, **pas**
des tests de media réel : ils ne valident aucun flux audio.

| Suite | Résultat | Assertions |
| :--- | :--- | :--- |
| `scripts/test-app-call-signals.ts` | PASS | tous les tests |
| `scripts/test-app-call-session.ts` | PASS | tous les tests |
| `scripts/test-app-call-security.ts` | PASS | tous les tests |
| `scripts/test-app-call-observability.ts` | PASS | tous les tests |
| `scripts/test-ice-config.ts` | PASS | **83 passed, 0 failed** (62 → 83, 21 nouveaux) |
| `scripts/test-turn-api.ts` | PASS | 41 passed, 0 failed |
| `scripts/test-webrtc-negotiation.ts` | PASS | 46 passed, 0 failed |
| `scripts/test-webrtc-media.ts` | PASS | 27 passed, 0 failed |

**Total : 8/8 suites au vert.** `OFFLINE_TESTS = PASS`

### Incident de harness (corrigé sans modification de code)

`test-app-call-session.ts` et `test-app-call-security.ts` échouaient initialement
(`exit=1`) à l'import, via `lib/prisma.ts:6` → `lib/env-validation.ts:86-92` :
variables CORE absentes.

Correction : variables factices injectées **uniquement dans le processus de test**
(aucun fichier modifié, aucun secret réel utilisé) :
`DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY` (base64 valide 32 octets),
`CRON_SECRET`. Les deux suites passent ensuite.

→ **Finding P2 (dette d'ergonomie de test)** : ces deux suites ne sont pas
exécutables sansVariables d'environnement. À corriger dans une phase dédiée
(chargement d'un `.env.test` ou mode test dans `validateEnv`).

---

## 3. PHASE 2 — PSTN (non atteinte)

| Test | Verdict |
| :--- | :--- |
| TEST_08 — PSTN sortant | **NOT_RUN** |
| TEST_09 — PSTN entrant | **NOT_RUN** |

Phase 2 non démarrée : la Phase 1 n'est pas à PASS, conformément à la règle STOP.
Aucun appel payant déclenché. Coût incurred : **0**.

---

## 4. PHASE 3 — NAVIGATEURS (non atteinte)

| Test | Verdict |
| :--- | :--- |
| TEST_10 — Chrome desktop | **NOT_RUN** |
| TEST_11 — Chrome Android / PWA | **NOT_RUN** |
| TEST_12 — Safari iOS / PWA | **NOT_RUN** |

Aucune capacité « background / écran verrouillé » n'est déclarée : rien n'a été
prouvé sur device réel.

---

## 5. LIVE_TEST_BLOCKER

### BLOCKER-01 — TEST_03 : RESOLU sur l'outillage, reste NOT_RUN pour la preuve

- **Scénario :** TEST_03 — APP_TO_APP Cloudflare TURN forcé
- **État initial :** aucun mode `iceTransportPolicy: "relay"` dans le code.
  `scripts/test-ice-config.ts:194` asserte même que `buildIceServers` ne doit
  JAMAIS poser `iceTransportPolicy` (défaut `all`).
- **Correction appliquée :** option **test-only** isolée et pure
  (`resolveIceTransportPolicy` + `applyIceTransportPolicy` dans `lib/ice-config.ts`),
  câblée dans `contexts/AppCallContext.tsx`.
  - défaut = `"all"` et clé **absente** (le test `5a` d'origine est inchangé) ;
  - `"relay"` exige un flag **build-time** `NEXT_PUBLIC_APP_CALL_FORCE_RELAY`
    (inliné au build → non pilotable depuis l'URL) ;
  - **refus systématique si `NODE_ENV === "production"`** ;
  - `iceServers` (donc les credentials TURN) jamais modifié : ils viennent toujours
    du serveur via `/api/app-calls/ice-config` ;
  - aucun secret introduit.
- **Preuve :** `scripts/test-ice-config.ts` passe de **62 → 83 tests, 0 échec**
  (21 nouveaux : défaut `all`, opt-in `relay`, refus production, parsing strict,
  absence de fuite de secret).
- **Limite honnête :** ceci rend `TURN_RELAY_TEST_AVAILABLE = READY`
  (**l'outillage existe**). Cela ne prouve **aucune** connectivité.
  `TURN_RELAY_CONNECTIVITY = NOT_RUN`.
- **BLOCKER-01-bis :** `CLOUDFLARE_TURN_KEY_ID` et `CLOUDFLARE_TURN_API_TOKEN` sont
  **absents** de `.env` et `.env.local`. Sans eux, TEST_03 ne peut pas fonctionner
  (fallback STUN). Prérequis à fournir par l'opérateur.

### BLOCKER-02 — Tous scénarios : absence d'accès device / navigateur / comptes

- **Scénario :** TEST_01, 02, 04, 05, 06, 07, 08, 09, 10, 11, 12
- **Étape fautive :** non applicable — l'exécution n'a jamais pu démarrer
- **Expected :** 2 devices + 2 comptes authentifiés, coupure réseau physique,
  navigateur réel, et pour 8/9 un numéro PSTN de test
- **Actual :** l'agent ne dispose d'aucun navigateur, d'aucun device, d'aucun
  compte utilisateur authentifié, et d'aucun numéro PSTN
- **Logs / IDs :** sans objet
- **Cause probable :** limite d'environnement de l'agent CLI
- **Correction minimale proposée :** exécution manuelle ou pilotée par un
  opérateur humain selon `REALTIME_CALL_AUDIO_LIVE_TEST_PLAN.md`, avec relevés de
  logs manuels. Aucune correction code nécessaire.

### BLOCKER-03 — TypeScript et build :.obtenus réellement

- **TypeScript :** `npx tsc --noEmit` → **exit 0**, sortie vide.
  `TYPESCRIPT = PASS`. Deux erreurs `TS2339` avaient d'abord été détectées dans mes
  nouveaux tests (signature générique trop restrictive) et corrigées avant ce run.
- **Build :** `npm run build` → **exit 1**, `BUILD = FAIL`.
  Cause exacte : `scripts/migrate-deploy.mjs` échoue en amont sur
  `P1001 Can't reach database server` (base Nhost injoignable depuis cet
  environnement). **`next build` n'est jamais atteint** via ce script, donc cet
  échec ne dit rien sur la compilation.
- **Build direct (sans migration) :** `npx next build --webpack` → **exit -1**,
  bloqué par l'absence de DNS externe (`getaddrinfo ENOTFOUND fonts.googleapis.com`)
  puis mort avant la fin.
- **Verdict honnête :** le build **n'est pas validé**. `BUILD = FAIL`, motif
  environnement (DB injoignable + pas de réseau externe), pas erreur de code
  observée. Un build ne peut être déclaré PASS que dans un environnement disposant
  de la base et d'un accès réseau.

### BLOCKER-04 — Intégrité Git : mes modifications ont été committées par un tiers

- Je n'ai exécuté **ni `git commit` ni `git push`**.
- Un processus concurrent (agent PWA) a committé et **balayé mes fichiers non
  committés** dans ses propres commits :
  - `1500842 feat(pwa): phase 2…` → `contexts/AppCallContext.tsx`, `lib/ice-config.ts`
  - `3e58ac1 fix(pwa): fix ts compiler errors…` → `scripts/test-ice-config.ts`
- État : **3 commits en avance sur `origin/main`, non poussés.**
- **Risque :** la version committée de `applyIceTransportPolicy` est la signature
  génériquefaulty (`TS2339`). Le correctif est **non committé** (working tree).
  Pousser HEAD tel quel casserait `tsc`. Je n'ai rien poussé.

---

## 6. VERDICTS FINAUX

```
APP_TO_APP_SAME_NETWORK      = NOT_RUN
APP_TO_APP_CROSS_NETWORK     = NOT_RUN
CLOUDFLARE_TURN_RELAY        = NOT_RUN  (mode relay forcé absent du code)
NETWORK_RECOVERY             = NOT_RUN
MIC_PERMISSION_HANDLING      = NOT_RUN
AUTOPLAY_HANDLING            = NOT_RUN
MUTE_LIFECYCLE               = NOT_RUN
TELNYX_OUTBOUND              = NOT_RUN
TELNYX_INBOUND               = NOT_RUN
CHROME_DESKTOP               = NOT_RUN
ANDROID_PWA                  = NOT_RUN
IOS_PWA                      = NOT_RUN
```

```
REALTIME_CALL_AUDIO_STATIC_READINESS = READY   (inchangé, sur la base de l'audit statique)
REALTIME_CALL_AUDIO_LIVE_VALIDATION  = PENDING (inchangé)
```

## 7. STATUTS NORMALISÉS

```
OFFLINE_TESTS             = PASS
TYPESCRIPT                = PASS
BUILD                     = FAIL   (infra : DB Nhost injoignable + DNS externe absent)

TURN_RELAY_TEST_AVAILABLE = READY
TURN_RELAY_CONNECTIVITY   = NOT_RUN

APP_TO_APP_LIVE           = NOT_RUN
TELNYX_OUTBOUND_LIVE      = NOT_RUN
TELNYX_INBOUND_LIVE       = NOT_RUN

REALTIME_CALL_AUDIO_LIVE_VALIDATION = PENDING
```

Aucun commit de ma part. Aucun push. Aucun appel PSTN. Coût total : **0**.