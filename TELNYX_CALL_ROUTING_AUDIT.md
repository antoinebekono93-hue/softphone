# Audit — Routage des appels Telnyx vs. implémentation réelle (préparation production)

**Date :** 2026-10-03
**Périmètre :** Routage des appels vocaux (Call Control, webhooks, limites, config Voice App).
**Méthode :** Confrontation de l'implémentation du référentiel avec la documentation officielle Telnyx (Voice API fundamentals, Commands & Resources, Webhooks, Sending Commands, Command Retries, Dials Per Second, OpenAPI `/calls`, Call Control Applications). Sources consultées :
- https://developers.telnyx.com/docs/voice/programmable-voice/voice-api-fundamentals.md
- https://developers.telnyx.com/docs/voice/programmable-voice/voice-api-commands-and-resources.md
- https://developers.telnyx.com/docs/voice/programmable-voice/voice-api-webhooks.md
- https://developers.telnyx.com/docs/voice/programmable-voice/sending-commands.md
- https://developers.telnyx.com/docs/voice/programmable-voice/receiving-webhooks.md
- https://developers.telnyx.com/docs/voice/programmable-voice/command-retries.md
- https://developers.telnyx.com/docs/voice/programmable-voice/dials-per-second-limit.md
- https://developers.telnyx.com/api-reference/call-commands/dial.md (OpenAPI `/v2/calls`)
- https://raw.githubusercontent.com/team-telnyx/openapi/master/openapi/spec3.json (référence)

---

## 1. Architecture de routage actuelle (ce qui est réellement en place)

| Surface | Implémentation | Fichier |
|---|---|---|
| Voice App / connexion unique | `connection_id` = `SystemSettings.telnyxConnectionId` sinon `TELNYX_SIP_CONNECTION_ID` | `lib/telnyx.ts:42-49`, `lib/pstn-forwarding.ts:163-165`, `app/api/workers/dialer/route.ts:17-25` |
| Clé API opérationnelle | God Mode → fallback env, rotation auto | `lib/telnyx.ts:30-59` |
| Clé publique ED25519 (webhooks) | God Mode → fallback env | `lib/telnyx.ts:42-50` |
| Média humain (navigateur) | WebRTC SDK natif (SIP credential par user, provisionnées) | `contexts/TelnyxContext.tsx:251,542`, `app/api/telnyx/token/route.ts:98-106` |
| Média AI | Transfert Call Control vers trunk SIP LiveKit | `app/api/webhooks/telecom/route.ts:501-505` |
| Répondeur | Call Control `answer` + `speak` + `startRecording` | `lib/pstn-voicemail.ts:41,70,98` |
| Forwarding (APP_THEN_FORWARD / FORWARD) | Dial avec `link_to` + `bridge_on_answer` | `lib/pstn-forwarding.ts:168-179` |
| Campagne vocale (dialer) | `POST api.telnyx.com/v2/calls` brut + AMD premium | `app/api/workers/dialer/route.ts:92-107` |
| Webhooks entrée | Poser un point unique `/api/webhooks/telecom` (voix + SMS + commandes + vérifs) | `app/api/webhooks/telecom/route.ts` |
| Raccrochage durée max (toutes jambes, y c. WebRTC) | Cron watchdog `pstn-calls-timeout` | `app/api/cron/pstn-calls-timeout/route.ts:12-41` |

Style retenu : **pure Call Control** (pas de TeXML), **un seul compte/un `connection_id`**, **arbitrage serveur** de la facturation et du routage. C'est un choix légitime et documenté (le guide officiel recommande Call Control pour ce type de flux).

---

## 2. Paramètres de routage Telnyx → statut d'implémentation

### 2.1 `POST /v2/calls` (Dial) — forwarding `lib/pstn-forwarding.ts:168-179`

| Paramètre Telnyx (OpenAPI) | Utilisé | Valeur | Conforme |
|---|---|---|---|
| `connection_id` | ✅ | connectionId app | ✅ |
| `to` | ✅ | `forwardToE164` | ✅ |
| `from` | ✅ | numéro géré du numéro | ✅ |
| `link_to` | ✅ | call_control_id de la jambe entrante | ✅ |
| `bridge_on_answer` | ✅ | `true` | ✅ |
| `prevent_double_bridge` | ✅ | `true` (valide sur Dial) | ✅ |
| `timeout_secs` | ✅ | `30` (min 5, max 600) | ✅ |
| `time_limit_secs` | ✅ | `clampForwardDuration(maxCallDurationSeconds)` (min 60 → ≥ min Telnyx 30) | ✅ |
| `command_id` | ✅ | `forwardCommandId` (uuid stable, dédup 60 s) | ✅ |
| `client_state` | ✅ | `{ outboundAttemptId, rateProfile, forwardParentCallLogId }` | ✅ |
| Retry propre si crash worker | ✅ | replay idempotent via `command_id` stable | ✅ |

**Verdict : le dial de forwarding est complet et conforme.**

### 2.2 `POST /v2/calls` — dialer campagne `app/api/workers/dialer/route.ts:92-107`

| Paramètre | Utilisé | Conforme |
|---|---|---|
| `to`, `from`, `connection_id` | ✅ | ✅ |
| `answering_machine_detection: 'premium'` | ✅ | ✅ |
| `time_limit_secs` | ✅ (`maxDurationSeconds ?? 3600`) | ✅ |
| `client_state` | ✅ (`{ outboundAttemptId, campaignId, contactId, rateProfile }`) | ✅ |
| `webhook_url` | ❌ (webhook du connection) | Optionnel — OK |
| **`command_id`** | ❌ **ABSENT** | ⚠️ **manquant** (voir P1-1) |

### 2.3 Appels WebRTC navigateur (humain)

- Étape serveur `POST /api/telnyx/preauthorize` → `preAuthorizeCall` (quota + hold de fonds) → `newCall()` SDK avec `clientState`/`id = attemptId` (`contexts/TelnyxContext.tsx:527-549`).
- Borne de durée : il n'existe **pas** de `time_limit_secs` pour des legs SIP WebRTC côté SDK ; c'est compensé par le cron `pstn-calls-timeout` qui raccroche toute jambe `IN_PROGRESS` au-delà de `maxCallDurationSeconds` (`app/api/cron/pstn-calls-timeout/route.ts:23-26`). ✅ couvre également les jambes app->browser.

### 2.4 Transfert IA vers LiveKit `app/api/webhooks/telecom/route.ts:501-505`

| Paramètre Transfer (OpenAPI) | Utilisé | Conforme |
|---|---|---|
| `to` | ✅ (SIP URI LiveKit) | ✅ |
| `custom_headers` | ✅ (`X-Agent-*`, `X-Call-Log-Id`, `X-Organization-Id`) | ✅ |
| **`command_id`** | ❌ | ⚠️ manquant (voir P0-2) |
| **`client_state`** | ❌ | ⚠️ manquant (voir P0-2) |
| **`time_limit_secs`** | ❌ | ⚠️ manquant (voir P0-2) |

---

## 3. Webhooks — conformité au contrat Telnyx

### 3.1 Vérification de signature ✅
En-têtes lus : `telnyx-signature-ed25519` + `telnyx-timestamp` ; vérif ED25519 via `telnyx.webhooks.constructEvent(rawBody, signature, timestamp, publicKey)` ; 401 si signature manquante/invalide ; 503 si clé publique non configurée. (`app/api/webhooks/telecom/route.ts:981-1003`). Conforme aux docs (headers `Telnyx-Signature-Ed25519`, `Telnyx-Timestamp`, `User-Agent: telnyx-webhooks`).

### 3.2 Enveloppe et déduplication ✅
- L'objet traité est `data` de l'enveloppe v2 (`constructEvent(...).data`) : `data.event_type`, `data.payload`, `data.id` (`route.ts:126,143,1004`).
- Dédup sur `data.id` via table `WebhookEvent` + violation P2002 (`route.ts:128-141`) — exactement la bonne pratique documentée (« dédupe on event id »).
- ⚠️ **Condition implicite** : l'enveloppe v2 (`webhook_api_version=2` sur la connexion) est **requise**. En v1, `data.id` est absent (shape legacy `webhook_id` à plat) → le handler rejette en 400 → événements perdus. **À vérifier dans Mission Control** (cf. P0-3).

### 3.3 Événements gérés vs. émis
| Événement | Géré | Usage |
|---|---|---|
| `call.initiated` | ✅ | création/réconciliation CallLog, routage entrant, push, forwarding, voicemail |
| `call.answered` | ✅ | bascule voicemail/AI (transfer) |
| `call.hangup` / `call.failed` | ✅ | stats, facturation, notifications, automations |
| `call.bridged` | ✅ | état forward/AI |
| `call.speak.ended` | ✅ | enchaînement greffe→recording |
| `call.recording.saved` | ✅ | URL + voicemail saved + push |
| `call.transcription` | ✅ | append transcription |
| `call.machine.premium.detection.ended` | ✅ | `amdResult` |
| `call.conversation_insights.generated` / `call.conversation.ended` | ✅ | summary AI |
| `message.received/sent/finalized`, `verification.*`, `number_order.*` | ✅ | SMS/MMS/vérifs/commandes |
| `call.dtmf.received`, `call.gather.ended`, `call.playback.*` | ❌ non géré | non émis (pas de IVR/gather) — OK |
| `call.machine.detection.ended` (AMD legacy) | ❌ | non émis (AMD premium seulement) — OK |
| `call.recording.error`, `call.refer.*`, `call.pay.*`, `streaming.*` | ❌ | hors périmètre actuel — OK |

### 3.4 Retry / validation de prise en compte
- Le handler ne répond 200 **qu'après traitement durable** ; sur erreur il répond 500 → Telnyx retry + dédup WebhookEvent (sémantique « at-least-once » propre, cf. commentaire `route.ts:1009-1011`). Conforme à l'esprit des docs (le contrat autorise 408/429/5xx retry, autres 4xx non retry).
- ⚠️ **Risque synchrone** : avec `webhook_timeout_secs` du portail (0–30 s) et `maxDuration=90`, un webhook lent déclenche duplicate retry / saut sur failover (idempotent, mais bruit + coût). Recommandation P1-5 (ack immédiat + async), et **configurer `webhook_event_failover_url`**.

---

## 4. Limites & fiabilité

| Règle Telnyx | Statut |
|---|---|
| `command_id` unique (UUIDv4), dédup 60 s | ✅ voicemail/forwarding/preauthorize | ⚠️ **absent** transfer (P0-2) et dialer (P1-1) |
| Retry immédiat sur 5XX / latence >500 ms | Y c. `after()` pour voicemail ; dial forwarding idempotent par `command_id` | ✅ |
| DPS limit 30/s (fenêtre 5 s, erreur `90103`) | Pas de paced global. Le dialer traite ≤10/rejet de file + 1 tentat dummy : risque faible, mais voir P1-2 pour la gestion du 429 | ⚠️ |
| Commandes sur leg mort → `422 « call is no longer active »` | Toutes les commandes finales sont `.catch(() => undefined)` ou un try/catch → OK | ✅ |
| Durée max des legs (défaut Telnyx 4 h) | Bornée par `time_limit_secs` (dial) + cron `pstn-calls-timeout` (toutes jambes) | ✅ |
| `webhook_event_failover_url` (deux tentatives consécutives) | **Non configurée** dans le code (non vérifiable côté code) | ❌ à faire au portail |

---

## 5. Conclusion de conformité

**L'essentiel du routage est correctement et réellement implémenté** : vérification ED25519, dédup événements, `command_id` stable + replay idempotent sur le forwarding, `client_state` utilisé comme discriminant, AMD premium, `time_limit_secs`, watchdog de durée, pilotage complet de la facturation (coût fournisseur, durée, MOS). Aucun paramètre « décoratif » : chaque paramètre envoyé à Telnyx est réel et documenté.

Toutefois, **4 trous doivent être traités avant mise en production sérieuse** (dont 2 à fort enjeu, P0).

---

## 6. Findings — priorités

### 🔴 P0-1 — Transfert IA vers LiveKit : risque de raccrochage/double facturation de la jambe B (À VÉRIFIER EN PROD)
`app/api/webhooks/telecom/route.ts` — branche `call.initiated` sortant, `UNMANAGED_CALLER_ID` (l. 350-421).
Le `transfer` LiveKit (l. 502-505) génère normalement un `call.initiated` pour la jambe B (`from` = numéro de l'appelant, `direction: outgoing`). Le handler appelle `findManagedPhoneNumber(from)` (l. 80-91) : si le `from` de la jambe B n'est **pas** un numéro géré, la jambe est raccrochée (`terminateProviderCall` l. 419-420) → l'appel IA tombe. Si le `from` est géré, une 2ᵉ CallLog OUTBOUND billable est créée → **double facturation** d'un même appel.
**À clarifier en bac à sable** : quel `from`/`connection_id` porte le `call.initiated` de la jambe B du transfer (le trunk LiveKit est une autre connexion, créée via `app/dashboard/livekit/actions.ts:68`).
**Correctif défensif recommandé** : ignorer tout `call.*` dont `payload.connection_id !== connectionId` de l'app (ou dont l'`call_session_id` correspond à une session déjà suivie / `state: 'bridging'`) avant tout rejet. Le handler n'agit que sur la connexion qu'il pilote.

### 🔴 P0-2 — Transfer IA : `command_id`, `client_state`, `time_limit_secs` absents
`app/api/webhooks/telecom/route.ts:502-505`.
- `command_id` absent → un webhook dupliqué déclenche un **double transfer** (perte du flux média ou combat de signal).
- `client_state` absent → le `call.hangup` de la jambe A ne transporte plus `rateProfile` (le code compense par une requête DB en fallback, l. 672-681 — correct mais fragile).
- `time_limit_secs` absent → pas de borne fournisseur si LiveKit ne prend pas le leg.
**Fix :** `command_id: <uuid-ou-attemptId>-livekit-transfer`, `client_state` (`{ outboundAttemptId, rateProfile, callLogId }`), `time_limit_secs: clampForwardDuration(maxDurationSeconds)`.

### 🔴 P0-3 — Vérifier `webhook_api_version = 2` sur la Voice App
`app/api/webhooks/telecom/route.ts:1004` exige `event.id`. L'enveloppe v1 (sans `id`) est rejetée en 400. **Action portail** : s'assurer que la connexion (`connection_id`) est en API webhook v2 (recommandation officielle). Sinon, chaque call.* est perdu.

### 🟠 P1-1 — Dialer campagne : `command_id` manquant
`app/api/workers/dialer/route.ts:99-106`. Sans `command_id`, un retry réseau ou un doublon crash-recovery peut créer **2 legs facturés** pour le même recipient. **Fix :** `command_id: attemptId` (déjà utilisé comme `client_state.outboundAttemptId`).

### 🟠 P1-2 — Dialer : `429` (DPS `90103`) marque le recipient FAILED définitif
`app/api/workers/dialer/route.ts:108-111` → `results FAILED` (l. 137-143). La doc impose : sur `429/90103`, backoff ≥1 s + expo, jamais d'échec définitif. **Fix :** sur `90103`, requeue le recipient en `PENDING` avec un compteur de tentatives (plafond), ou encoder un simple backoff (ex. réessayer au prochain run du cron).

### 🟠 P1-3 — (Recommandation résilience) `webhook_event_failover_url` + timeout config
Le portail doit avoir : `webhook_event_url` = `https://<app>/api/webhooks/telecom`, `webhook_event_failover_url` défini, `webhook_api_version=2`, `webhook_timeout_secs` cohérent avec la durée de traitement (voire ≥60 s) pour limiter les retries parasites (renforce la remarque P0-3).

### 🟡 P2-1 — `server/media-server.ts` = code mort (ancienne archi Option A)
Plus aucune `stream_url` n'est émise (l'AI passe par le transfert LiveKit, `route.ts:468` « Option B »). Ce serveur WebSocket (+OpenAI Realtime) ne tourne d'ailleurs pas sous Vercel serverless. **À supprimer** (ou à documenter « legacy ») pour éviter tout malentendu de déploiement.

### 🟡 P2-2 — Cohérence des clés : proxy env-only vs God Mode
Certaines pages utilisent encore le proxy `telnyx` (clé env), ex. `app/dashboard/numbers/actions.ts:144` (`numberOrders.create`), alors que le cœur utilise `getConfiguredTelnyxClient`. En prod, la clé `TELNYX_API_KEY` d'env et la clé God Mode doivent être identiques, sinon divergence de compte. Aligner sur `getConfiguredTelnyxClient`.

### 🟡 P2-3 — Finesse d'affichage (optionnel, non bloquant)
`from_display_name` / `privacy(id)` non utilisés sur les dials sortants (l'affiché = le numéro). Aucun impact routage.

---

## 7. Check-list de mise en production

Coût estimé : **P0-1 est le seul point à caractère bloquant** (à valider par un test de transfer réel en bac à sable). Les autres sont des durcissements rapides.

- [ ] **P0-1** : Tester un appel AI inbound complet, observer le `call.initiated` de la jambe B (payload complet : `from`, `connection_id`, `call_session_id`, `state`) ; si besoin ajouter le filtre `connection_id`/session dans `processEvent`.
- [ ] **P0-2** : Ajouter `command_id`, `client_state`, `time_limit_secs` au `transfer` (`route.ts:502-505`).
- [ ] **P0-3** : Vérifier au portail `webhook_api_version = 2` (et `webhook_timeout_secs`, `webhook_event_failover_url`).
- [ ] **P1-1/P1-2** : `command_id: attemptId` sur le dialer + gestion du 429 `90103` (requeue/backoff).
- [ ] **P2-1** : supprimer `server/media-server.ts` (ou le marquer `legacy`).
- [ ] **P2-2** : aligner tous les usages sur `getConfiguredTelnyxClient`.
- [ ] Re-tester en bac à sable : forwarding simple, APP_THEN_FORWARD + voicemail, AI, campagne, WebRTC humain (sortant entrant), puis vérifier le double-billing des legs.

---

## Verdict global

**PAS AVANTAGEUX de bloquer** : le routage est **conforme et réel** dans ses briques principales (signature, dédup, idempotence, forwarding, bornes de durée, facturation). Les correctifs P0-2/P1 sont des additions paramétriques triviales ; **P0-1 nécessite un test réel** pour lever l'ambiguïté sur la jambe B du transfer (l'enjeu est une coupure d'appel AI ou une double facturation en production).

---

# Mise à jour — 2026-10-03 : correctifs P0/P1 appliqués (statique) + verdicts

## 8. Correctifs appliqués (sans push, sans commit, sans appel Telnyx réel)

| # | Fichier | Changement | Statut |
|---|---|---|---|
| 1 | `lib/telnyx-call-routing.ts` *(nouveau, pur, 0 dépendance Prisma/env)* | classifieur `classifyTelnyxCallInitiated` + builders déterministes + gardes | ✅ |
| 2 | `lib/campaign-dialer-policy.ts` *(nouveau, pur)* | idempotence `command_id` + politique retry transitoire du dialer | ✅ |
| 3 | `app/api/webhooks/telecom/route.ts` | P0-1 (classification + jambe enfant), P0-2 (params transfer), P0-3 (diagnostic v1), gardes child `answered`/`hangup` | ✅ |
| 4 | `app/api/workers/dialer/route.ts` | P1-1 (`command_id` déterministe), P1-2 (requeue 429/90103 borné, messageId réutilisé) | ✅ |
| 5 | `lib/telnyx.ts` | `getConfiguredTelnyxConnectionId()` (God Mode → env) | ✅ |
| 6 | `scripts/test-telnyx-call-routing.ts` *(nouveau)* + `package.json` (`test:telnyx-call-routing`) | 45 assertions offline (A–I) — **45 PASS** | ✅ |
| 7 | `TELNYX_CALL_ROUTING_AUDIT.md` | ce document | ✅ |

> **`npx tsc --noEmit`** : aucun défaut rapporté sur les fichiers ci-dessus. Deux erreurs restent dans `app/terms/page.tsx` (fichier hors périmètre, non touché).

### 8.1 Résolution des findings

| Finding | Correctif | Verdict |
|---|---|---|
| 🔴 **P0-1** jambe B raccrochée / double bill | Classifieur explicite : seul un `client_state` de type `AI_LIVEKIT_TRANSFER` **sur notre `connection_id`** et **avec source vérifiée en base** devient `TRANSFER_CHILD_LEG` → jamais la garde `UNMANAGED_CALLER_ID`, jamais de 2ᵉ réservation. Sortant non classé → `UNKNOWN` **fail-closed** (aucune action). Entrant non géré → conserve le terminate `UNMANAGED_DESTINATION` (comportement d'origine). | ✅ **APPROUVÉ_STATIQUE** — **VALIDATION_LIVE_EN_ATTENTE** |
| 🔴 **P0-2** transfer sans params | `command_id` déterministe `transfer:{callControlId}:{purpose}:{hash16(target)}`, `client_state` (jambe source) + `target_leg_client_state` (jambe enfant, base64 JSON sans secret), `time_limit_secs: clampForwardDuration(plan)`. **noms exacts vérifiés dans le SDK installé telnyx@7.2.0** (`node_modules/telnyx/resources/calls/actions.d.ts`). | ✅ **APPLIQUÉ** |
| 🔴 **P0-3** enveloppe v2 | Diagnostic structuré `TELNYX_UNSUPPORTED_WEBHOOK_VERSION` (type seul, jamais payload/secret) + 400 `{"error":"TELNYX_WEBHOOK_V2_REQUIRED"}`. **Aucune compat v1** (volontaire). | ✅ **APPLIQUÉ** *(config portail `webhook_api_version=2` reste à vérifier)* |
| 🟠 **P1-1** `command_id` dialer | `campaign:{campaignId}:{recipientId}:{attemptId}` ; `attemptId` (UUID) **persisté dans `messageId`** → retry transitoire réutilise le même `command_id` (un seul leg par tentative logique). | ✅ **APPLIQUÉ** |
| 🟠 **P1-2** 429/`90103` → FAILED | `isTransientDialFailure` (429/5xx/90103) → requeue `RETRY_1..RETRY_3` (borné, backoff jitter ≤ ~2 s) avec `messageId` conservé ; `RETRY_3` épuisé ou 4xx autre → `FAILED` + `messageId` réinitialisé. **Sans migration de schéma.** | ✅ **APPLIQUÉ** |
| 🟠 **P1-3** failover webhook | **NON configurable par code** → documenté `FAILOVER_WEBHOOK = NOT_CONFIGURED`. Action portail : `webhook_event_failover_url`, `webhook_timeout_secs`, `webhook_event_url`. | ⚠️ **ACTION_PORTAL** |
| 🟡 **P2-1** `server/media-server.ts` | Marqué **`LEGACY_DEAD_CODE_CANDIDATE`** (non supprimé — directive). Plus aucune `stream_url` émise (archi Option A obsolète). | 📌 **DOCUMENTÉ** |
| 🟡 **P2-2** clés env vs God Mode | Diversité documentée ; opérationnellement, exiger `TELNYX_API_KEY` env = clé God Mode. | 📌 **DOCUMENTÉ** |
| 🟡 **P2-3** `from_display_name` | Sans impact routage — non bloquant. | 📌 **DOCUMENTÉ** |

### 8.2 Modèle de débit des legs (le « double facturation » rendu explicite)

| Leg | Rôle | Réservation | Settlement | Facturé | Liens |
|---|---|---|---|---|---|
| **A** (entrant, `PSTN_INBOUND`) | appel client vers numéro géré | ✅ unique (`preAuthorizeCall`) | ✅ sur hangup A | ✅ `settlePstnCall` idempotent par callControlId | — |
| **B** (enfant du transfer, `direction=TRANSFER`, `callPurpose=AI_TRANSFER`) | média vers LiveKit | ❌ **jamais** | ❌ **jamais** | ❌ `isBilled=false` — coût = infra AI, **jamais re-facturé à l'organisation** | `parentCallLogId` → A, source vérifiée, `target_leg_client_state` |
| **C** (forward caller, `FORWARD`) | bridge forward | ✅ (le forward **est** facturé) | ✅ sur hangup C | ✅ | `parentCallLogId` → A, `forwardCommandId` stable |

- Jambe B : `call.hangup` → mise à jour stats **puis `return`** avant settlement/reservation/automation/Pusher.
- Lien A↔B par **`client_state` (est porté par `target_leg_client_state`)** + vérification **en base** de la jambe source (`direction=INBOUND`, même `call_control_id`) — **jamais uniquement** par `call_session_id` (trop dépendant d'un critère interprétable).
- Anti-rejeu : `WebhookEvent` (dédup P2002) + `command_id` déterministe (dédup Telnyx 60 s) + `parentCallLogId @unique` (P2002 → un seul enfant par parent). → **jamais 2 jambes B pour 1 transfert**.

### 8.3 Statuts A–Q

| Statut | Signification |
|---|---|
| **A** | Sortant géré normal → `OUTBOUND_MANAGED` (réservation conservée) |
| **B** | Jambe enfant reconnue (kind + connexion + source en base) → `TRANSFER_CHILD_LEG` |
| **C** | Jambe enfant → **jamais** la garde `UNMANAGED_CALLER_ID` |
| **D** | Jambe enfant → **zéro** réservation/settlement applicatif |
| **E** | Double webhook / replay → **un seul** transfer (dédup P2002 + `command_id`) |
| **F** | Même `call_session_id`, `client_state` incompatible → pas child (`UNKNOWN`) |
| **G** | Bon `client_state`, **mauvais `connection_id`** → `UNKNOWN` (fail-closed) |
| **H** | Rejoué → `command_id` identique ; nouvelle intention → différent |
| **I** | Dialer : `command_id` déterministe par tentative logique, retry transitoire borné (`RETRY_1..3`), permanent → `FAILED` |
| **J** | Enveloppe v1 → 400 `TELNYX_WEBHOOK_V2_REQUIRED` + diagnostic (pas de compat) |
| **K** | `FAILOVER_WEBHOOK = NOT_CONFIGURED` (portail) |
| **L** | `server/media-server.ts` = `LEGACY_DEAD_CODE_CANDIDATE` (non supprimé) |
| **M** | Divergence proxy env vs God Mode documentée |
| **N** | `from_display_name` non utilisé (non bloquant) |
| **O** | Nom des params transfer validés contre SDK installé 7.2.0 (pas de devinette) |
| **P** | Build bloqué tant que DB Nhost down (`scripts/migrate-deploy.mjs`) — repli `next build --webpack` en attente |
| **Q** | `CRON_SECRET` local ≠ Vercel (keepalive) — non bloquant chantier |

### 8.4 Verdicts

```
TELNYX_ROUTING_STATIC_READINESS = READY
TELNYX_ROUTING_LIVE_VALIDATION  = PENDING
```

Le dossier **statique** P0/P1 est fermé. La seule validation restante est **réelle** (jambe B en bac à sable, cf. §8.5) — volontairement **non automatisée** (aucun appel Telnyx facturé au CI, conformément au périmètre).

### 8.5 Plan de test réel (jambe B) — réservé au bac à sable, non exécuté

1. Caller externe **A** → numéro Telnyx géré (IA active) → attendre `call.initiated` + `call.answered` (jambe A).
2. Observer le `transfer` (logs `buildTelnyxTransferCommandId` → `command_id`) puis le `call.initiated` de la jambe **B** :
   - `connection_id` doit être le nôtre, `client_state` = base64 `{kind:'AI_LIVEKIT_TRANSFER',...}`.
   - Le handler doit classer `TRANSFER_CHILD_LEG` → CallLog B créée (`direction=TRANSFER`, `isBilled=false`, `parentCallLogId`=A) et **aucune** réservation supplémentaire.
3. `call.answered` B → `IN_PROGRESS` (pas de re-transfert vers LiveKit, pas de répondeur).
4. Raccrocher A → hangup A : settlement une seule fois ; hangup B : stats + `return` (pas de settle sur B).
5. **Critères PASS** : une seule réservation (A), un seul settlement, aucune garde `UNMANAGED`/`UNCLASSIFIED` sur B, jambes reliées par `parentCallLogId`, aucune 2ᵉ jambe B si le webhook est rejoué (double envoi).
6. Vérifier au portail : `webhook_api_version=2`, `webhook_event_url`, `webhook_event_failover_url`, `webhook_timeout_secs` (P0-3 / P1-3).

---

## Verdict actualisé (suite aux correctifs)

**`TELNYX_ROUTING_STATIC_READINESS = READY`.** Le routage est conforme, durci (classification explicite, idempotence transfer/campagne, retry borné, fail-closed), et la facturation des legs est explicite (A billée, B infra AI, C billée). `TELNYX_ROUTING_LIVE_VALIDATION = PENDING` : seul reste le test réel de la jambe B + les réglages portail (v2, failover, timeouts).