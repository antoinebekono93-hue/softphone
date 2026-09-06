# TURN — Cloudflare Realtime (Appels APP_TO_APP)

Ce document décrit la configuration du relais TURN pour les appels internes
**APP_TO_APP** (WebRTC P2P natif, hors Telnyx/PSTN), via **Cloudflare Realtime
TURN** avec des **credentials temporaires** générés par API.

Architecture conservée (inchangée hors TURN) :

```
Browser ── Pusher (signaling) ──> RTCPeerConnection (média)
                                      ├─ STUN → connexion directe si possible
                                      └─ TURN → relay si connexion directe impossible
                                              (Cloudflare Realtime)
```

> Aucune vraie credential ne doit jamais atterrir dans ce document ni dans Git.
> Toutes les valeurs ci-dessous sont des exemples.
>
> Documentation officielle :
> https://developers.cloudflare.com/realtime/turn/
> https://developers.cloudflare.com/realtime/turn/generate-credentials/

---

## 1. Variables d'environnement (serveur uniquement)

Deux variables **serveur** (runtime) sont lues par la route
`/api/app-calls/ice-config` :

```
CLOUDFLARE_TURN_KEY_ID=<votre-turn-key-id>
CLOUDFLARE_TURN_API_TOKEN=<votre-api-token>
```

- `CLOUDFLARE_TURN_KEY_ID` : identifiant de la TURN Key Cloudflare.
- `CLOUDFLARE_TURN_API_TOKEN` : token API Cloudflare autorisant la génération
  de credentials TURN pour cette clé.

**Règles absolues :**

- Restent **exclusivement côté serveur**. Jamais dans le bundle frontend,
  jamais sous `NEXT_PUBLIC_*`.
- **Ne pas** créer de placeholder silencieux (`-e2e-not-used`, etc.) qui
  ferait croire que TURN est configuré.
- **Si les variables sont absentes**, la route retourne une erreur explicite
  côté serveur : `503 TURN_SERVICE_NOT_CONFIGURED` (aucun secret dans la
  réponse). Les appels fonctionnent alors en **P2P direct via STUN** (fallback).

### Dokploy (variables runtime du service)

| Variable | Type | Exemple (non réel) |
|---|---|---|
| `CLOUDFLARE_TURN_KEY_ID` | runtime (secret) | `abcd1234abcd1234abcd1234` |
| `CLOUDFLARE_TURN_API_TOKEN` | runtime (secret) | `abcdef0123456789…` |

Marquer les deux comme **secrets**, puis re-deployer pour recharger
l'environnement.

---

## 2. Création de la TURN Key Cloudflare

1. Dashboard Cloudflare → Realtime → onglet TURN
   (https://dash.cloudflare.com/?to=/:account/calls).
2. Créer une **TURN Key**. C'est un secret long-terme, **serveur uniquement**,
   qui permet de générer des credentials TURN courts (éphémères) et de les
   révoquer.
3. Renseigner l'**ID** dans `CLOUDFLARE_TURN_KEY_ID`.

## 3. Création du token API

1. Dashboard Cloudflare → My Profile → **API Tokens** → Create Token.
2. Accorder la permission qui autorise la création/révocation de credentials
   TURN Realtime (permission Calls/TURN).
3. Copier le token dans `CLOUDFLARE_TURN_API_TOKEN`.

> Le token API n'est **jamais** conservé côté client, loggé, ni persiste en DB.

---

## 4. Architecture (implémentée)

```
Browser ── GET /api/app-calls/ice-config ──> Next.js
        <────── { iceServers } (temporaires) ──┐
                                               │
                                   Next.js (serveur uniquement)
                                     │ Authorization: Bearer {API_TOKEN}
                                     ▼
                          POST rtc.live.cloudflare.com/v1/turn/keys/{KEY_ID}
                              /credentials/generate-ice-servers
                                     │ { ttl }
                                     ▼
                                   201 { iceServers }   ← source des iceServers
```

- La **route** est dynamique (`dynamic = "force-dynamic"`) et répond avec
  `Cache-Control: no-store` pour éviter toute mise en cache des credentials.
- Elle retourne **uniquement** `{ iceServers }` : ni TURN_KEY_ID, ni token,
  ni variables d'environnement, ni headers Cloudflare, ni détails internes.

Modules :

- `lib/ice-config.ts` : couche **PURE** de normalisation/validation
  (sélection des URLs stun:/turn:/turns:, filtrage des URLs invalides et des
  credentials embarqués `@`, **filtrage du port 53**, déduplication, rejet des
  TURN sans username/credential, liste STUN de secours). Importable côté
  client (aucune fuite possible).
- `lib/turn-cloudflare.ts` : **serveur uniquement** — client Cloudflare TURN,
  calcul du TTL (`getTurnCredentialTtl`), orchestration de la route
  (`buildTurnIceConfig`), erreurs typées sans secret.
- `app/api/app-calls/ice-config/route.ts` : auth (401), lecture env serveur,
  durée max d'appel du plan, appel Cloudflare, réponse `{ iceServers }`.

---

## 5. TTL

Fonction pure `getTurnCredentialTtl(maxCallDurationSeconds)` :

- base = `maxCallDurationSeconds` du `PricingPlan` de l'organisation
  (fallback 1 h si indisponible) ;
- + **marge** `TURN_TTL_MARGIN_SECONDS` (600 s) pour couvrir sonnerie et
  négociation ;
- borné : `TURN_TTL_MIN_SECONDS` (10 min) ≤ TTL ≤ `TURN_TTL_MAX_SECONDS` (24 h).

Exemples :

| maxCallDurationSeconds | TTL |
|---|---|
| (indisponible) | 1 h 10 min |
| 1 800 | 40 min |
| 3 600 | 1 h 10 min |
| 7 200 | 2 h 10 min |
| 43 200 | 12 h 10 min |

**Renouvellement pendant une session** : Cloudflare permet de rafraîchir les
credentials d'une session WebRTC existante via
`RTCPeerConnection.setConfiguration()`. Pour cette première implémentation,
le TTL choisi (marge de 10 min sur la durée maximale d'appel prévue) est
suffisant pour toute la durée d'un appel : **aucun refresh automatique n'est
nécessaire**. Si à l'avenir une durée d'appel approchait le TTL, la bonne
approche est (1) re-fetch `/api/app-calls/ice-config` puis (2)
`pc.setConfiguration(nouvelleConfig)` avant un `restartIce()`.

**Comportement ICE restart** : le mécanisme existant
(`pc.restartIce()` → `createOffer({ iceRestart: true })` → signaling) est
inchangé. La configuration Cloudflare y est compatible (URLs RFC 7064
standard, mêmes credentials valides pendant la session, cache client
`iceConfigRef` conservé). Aucune refonte nécessaire.

---

## 6. Comportement STUN / TURN (filtrage)

Cloudflare retourne une liste contenant :

- `stun:stun.cloudflare.com:3478` (+ port alterné `:53`) ;
- `turn:turn.cloudflare.com:3478?transport=udp` (+ `:53`) ;
- `turn:turn.cloudflare.com:3478?transport=tcp` (+ `:80`) ;
- `turns:turn.cloudflare.com:5349?transport=tcp` (+ `:443`).

Filtrage appliqué par `lib/ice-config.ts` (documenté, sans inventer d'URL) :

- **port 53 filtré** : documenté comme bloqué par Chrome/Firefox et susceptible
  de timeouter (nous utilisons trickle ICE, mais on évite le timeout) ;
- URLs invalides / schémas hors-WebRTC (`http:`, etc.) → rejetées ;
- URLs avec credentials embarqués (`user:pass@host`) → rejetées ;
- doublons → retirés ;
- entrée TURN **sans** `username`/`credential` → écartée (inutilisable) ;
- entrée STUN seule → conservée (aucun credential requis).

Conservé après filtrage : **STUN**, **TURN UDP**, **TURN TCP**, **TURN TLS**.

### Fallback STUN

- Si les variables Cloudflare sont absentes **ou** si l'API TURN est
  momentanément indisponible : la liste de secours **STUN-only** est servie
  (`stun:stun.cloudflare.com:3478`, + STUN Google en redondance). ICE peut
  continuer en P2P direct.
- Le fallback STUN n'est **jamais** présenté comme TURN : si TURN n'est pas
  disponible, la réponse ne contient aucune URL `turn:`/`turns:` et aucun
  username/credential inventé. Client et logs savent que TURN est absent.

---

## 7. Sécurité

- Aucun secret (`CLOUDFLARE_TURN_KEY_ID`, `CLOUDFLARE_TURN_API_TOKEN`) :
  - dans le **client bundle** ni sous `NEXT_PUBLIC_*` ;
  - dans `console.log` / logger / `UsageLog` / `AppCallSession` ;
  - dans les **réponses d'erreur** de la route (codes machine uniquement) ;
  - dans les **tests** (l'appel Cloudflare est toujours mocké) ;
  - dans les **screenshots E2E** ni la doc.
- Les credentials TURN temporaires retournés au navigateur sont sensibles
  mais nécessaires à WebRTC (authentification au relais) : ils transitent par
  la réponse API authentifiée et la `RTCConfiguration`. Ils ne sont **jamais
  persistes en DB**.
- Endpoint `/api/app-calls/ice-config` : authentification requise (401 sinon).
- Erreurs Cloudflare mappées de façon contrôlée (aucun secret, aucun header) :
  `AUTH → 502 TURN_AUTH_FAILED`, `429 → 503 TURN_RATE_LIMITED`,
  `5xx → 502 TURN_UPSTREAM_ERROR`, réseau → `502 TURN_UNREACHABLE`,
  malformée → `502 TURN_INVALID_RESPONSE`.

## 8. Rotation / révocation

- **Révocation** : chaque credential temporaire peut être révoqué avant son
  TTL :
  `POST https://rtc.live.cloudflare.com/v1/turn/keys/{KEY_ID}/credentials/{USERNAME}/revoke`
  (avec `Authorization: Bearer {API_TOKEN}`).
- **Rotation** du token API : renseigner un nouveau
  `CLOUDFLARE_TURN_API_TOKEN` et re-deployer (les credentials déjà émis
  restent valides jusqu'à leur TTL).

## 9. Dépannage

- `503 TURN_SERVICE_NOT_CONFIGURED` : les variables serveur sont absentes →
  les renseigner dans Dokploy (et vérifier qu'elles ne sont pas
  `NEXT_PUBLIC_*`).
- `502 TURN_AUTH_FAILED` : token API invalide/révoqué ou mauvais `KEY_ID`.
- `503 TURN_RATE_LIMITED` : limite Cloudflare atteinte (429). Réessayer plus
  tard.
- `502 TURN_UNREACHABLE` : problème réseau sortant du serveur vers
  `rtc.live.cloudflare.com`.
- Après configuration, vérifier : navigateur authentifié → DevTools → Network
  → `GET /api/app-calls/ice-config` doit contenir les URLs `turn:`/`turns:`
  Cloudflare (sans `:53`) + `stun:`.

## 10. Validation locale rapide (sans navigateur)

```bash
npx tsx scripts/test-ice-config.ts   # couche pure (validation + filtrage)
npx tsx scripts/test-turn-api.ts     # TTL + client Cloudflare mocké + route
npx tsx scripts/test-webrtc-media.ts
npx tsx scripts/test-webrtc-negotiation.ts
npx tsx scripts/test-app-call-signals.ts
npx tsx scripts/test-app-call-session.ts
npx tsx scripts/test-call-routing.ts
npx tsc --noEmit
```

## 11. Ancien TURN statique

Les anciennes variables `TURN_URLS` / `TURN_USERNAME` / `TURN_CREDENTIAL`
(credentials statiques) ont été **retirées** de la route et de ce document
(grep final effectué : plus aucune référence en production). Les fonctions
pures `parseTurnUrls` / `buildIceServers` de `lib/ice-config.ts` sont
conservées comme utilitaires génériques couverts par les tests.