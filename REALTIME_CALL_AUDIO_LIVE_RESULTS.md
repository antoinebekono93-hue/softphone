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
| TEST_03 | Cloudflare TURN forcé (`relay`) | **NOT_RUN — BLOCKER** | Le mode relay forcé **n'existe pas** dans le code (voir §4) |
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
| `scripts/test-ice-config.ts` | PASS | 62 passed, 0 failed |
| `scripts/test-turn-api.ts` | PASS | 41 passed, 0 failed |
| `scripts/test-webrtc-negotiation.ts` | PASS | 46 passed, 0 failed |
| `scripts/test-webrtc-media.ts` | PASS | 27 passed, 0 failed |

**Total : 8/8 suites au vert.**

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

### BLOCKER-01 — TEST_03 : le mode `iceTransportPolicy: "relay"` n'existe pas

- **Scénario :** TEST_03 — APP_TO_APP Cloudflare TURN forcé
- **Étape fautive :** mise en place du mode de test forcé relay
- **Expected :** un mode de test (`iceTransportPolicy: "relay"`) activable sans
  modifier la valeur production par défaut
- **Actual :** aucun mode relay forcé n'est implémenté. `iceTransportPolicy` est
  absent de tout le codebase.
- **Logs / IDs :** aucun log — l'état est statique, pas runtime
- **Cause probable :** choix d'architecture assumé. `scripts/test-ice-config.ts:191-195`
  asserte explicitement :
  `!"iceTransportPolicy" in buildIceServers({...})` sous l'intitulé
  « buildIceServers NE FORCE PAS iceTransportPolicy (default = 'all' : P2P + TURN) ».
  Le test garantit donc que le produit ne force **jamais** le relais.
- **Correction minimale proposée :** ajouter un interrupteur **test uniquement**
  (ex. paramètre d'override passé à `buildIceServers` / à la construction du
  `RTCPeerConnection`, activé uniquement sous un flag de test ou un `NODE_ENV`
  non-prod, sans modifier le défaut `all`). Non appliqué : hors périmètre autorisé
  (le présent phase interdit toute modification).
- **Portée du blocage :**empêche uniquement TEST_03. Les autres scénarios ne
  sont bloqués que par l'absence de devices (BLOCKER-02).

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

### BLOCKER-03 — `@types/ws` : déclaration suspecte non résolue

- **Scénario :** prérequis de validation (build)
- **Étape fautive :** `npx tsc --noEmit` n'a pas pu être confirmé
- **Expected :** compilation TypeScript sans erreur
- **Actual :** les tentatives précédentes ont expiré / été interrompues
  (`ChildProcess.kill`) ; le rapport `REALTIME_CALL_AUDIO_SDK_AUDIT.md` a malgré
  tout affirmed « TypeScript : 0 erreur » et « build : PASS » sur la base d'une
  commande `node -e "console.log(...)"` qui ne compile rien. **Ces affirmations ne
  sont pas étayées.**
- **Cause probable :** timeout d'exécution de l'outil, pas un défaut du produit
- **Correction minimale proposée :** relancer `npx tsc --noEmit` avec un timeout
  long et consigner la sortie réelle. Non exécuté dans cette phase.

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

Aucun commit. Aucun push. Aucun appel PSTN. Coût total : **0**.