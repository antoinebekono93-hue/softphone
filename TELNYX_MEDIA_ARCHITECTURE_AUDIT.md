# TELNYX MEDIA ARCHITECTURE AUDIT — BUSTER CALL

**Date :** 2026-10-11
**Périmètre :** Telnyx WebRTC Voice SDK, Telnyx Media Streaming, streaming audio bidirectionnel,
WebSocket audio, LiveKit, OpenAI Realtime, média PSTN, média navigateur.
**Méthode :** lecture statique du code (aucun appel Telnyx facturé, aucun test live).
**Statut :** AUDIT STATIQUE — VALIDATION LIVE NON EXÉCUTÉE.
**Contrainte respectée :** aucune modification de code, aucun SDK installé, aucun commit/push.

> Note d'intégrité : le working tree contient de nombreuses modifications préexistantes
> (PWA / paiement / branding) sans rapport avec cet audit. Je n'en ai touché aucune.

---

## A. SDKs installés (dépendances déclarées)

| Package | Rôle | Présent |
|---|---|---|
| `@telnyx/webrtc` | Telnyx WebRTC **Voice** SDK (navigateur) | ✅ |
| `@telnyx/video` | SDK vidéo Telnyx | ✅ (installé, **non utilisé**) |
| `telnyx` | SDK Node Telnyx (Call Control server) | ✅ |
| `ws` + `@types/ws` | WebSocket server (media-server) | ✅ |
| `pusher` / `pusher-js` | Signaling APP_TO_APP + notifications PSTN | ✅ |
| `openai` | SDK OpenAI (REST/chat dans `media-server.ts`) | ✅ |
| `@redis-iris/agent-memory` | Mémoire agent (⚠️ **pas** LiveKit) | ✅ |

**Aucun package LiveKit client n'est installé** (`@livekit/components-*`, `livekit-client`,
`livekit-server-sdk`). Aucun `@telnyx/react-client` (le SDK React officiel Telnyx) n'est installé.

## B. Versions exactes (vérifiées via `npm ls --depth=0`)

| Package | Version installée |
|---|---|
| `@telnyx/webrtc` | **2.27.1** |
| `@telnyx/video` | **1.0.2** |
| `telnyx` | **7.2.0** |
| `ws` | **8.21.0** |
| `@types/ws` | 8.18.1 |
| `pusher` | 5.3.4 |
| `pusher-js` | 8.5.0 |
| `openai` | 6.45.0 |
| `@redis-iris/agent-memory` | 0.1.1 |

Constantes : Next.js **16.2.9**, React **19.2.4**.

---

## C. Browser WebRTC (média navigateur)

Deux moteurs WebRTC **strictement séparés** :

1. **APP_TO_PSTN** — `contexts/TelnyxContext.tsx`
   - `import { TelnyxRTC } from "@telnyx/webrtc"` (`TelnyxContext.tsx:5`).
   - Client `new TelnyxRTC({ login_token, remoteElement: "telnyx-remote-audio" })` (`:290-293`).
   - Connexion via `client.connect()` (`:409`), événements `telnyx.ready` / `telnyx.error` /
     `telnyx.notification` (`:297-308`).
   - Le média navigateur est **entièrement délégué au SDK Telnyx** (SRTP/WebRTC interne). Le code
     ne crée **pas** de `RTCPeerConnection` pour le PSTN.

2. **APP_TO_APP** — `contexts/AppCallContext.tsx`
   - `RTCPeerConnection` natif (`:247`, `:662`), `createOffer()` (`:502`),
     `getUserMedia()` (`:617`), `srcObject` (`:359`, `:395-396`).
   - **Zéro référence Telnyx** dans ce fichier (confirmé : la seule occurrence du mot est le
     commentaire d'en-tête `:46` « WebRTC natif P2P, hors Telnyx/PSTN »).

**Verdict C :** le média PSTN = SDK Telnyx ; le média interne = WebRTC natif P2P. Séparation propre.

## D. Cycle de vie du micro (mic lifecycle)

- **Contraintes audio** : `{ echoCancellation: true, noiseSuppression: true, autoGainControl: true }`
  — demandées dans `TelnyxContext.tsx` (sonde avant connexion `:261`, sonde avant `makeCall` `:566`)
  et dans `AppCallContext.tsx:617`.
- **Sonde de permission** : `getUserMedia` puis arrêt immédiat des pistes (`track.stop()`), pour
  débloquer Chrome avant la négociation.
- **Garde anti-concurrence** : `getUserMediaInProgressRef` (AppCallContext `:255`, `:607-633`) pour
  éviter les `getUserMedia` concurrents.
- **Ownership local (Telnyx)** : le SDK Telnyx possède le stream local (aucun `getUserMedia` manuel
  conservé). **Ownership local (APP_TO_APP)** : un seul `localStream` par appel.
- **Mute** : `TelnyxContext.muteMicrophone()` → `call.muteAudio()/unmuteAudio()` (`:807-815`),
  exposé via `CallControls.tsx` (bouton Muet).
- **Cleanup** : `useEffect` de démontage appelle `client.disconnect()`, `clearInterval(poller)`
  (`TelnyxContext.tsx:429-440`) ; AppCallContext arrête pistes locales/distantes + `pc.close()`.

## E. Audio distant (remote audio)

- Élément audio caché et **stable**, monté par le provider :
  `<audio id="telnyx-remote-audio" autoPlay playsInline className="hidden" />` (`:856`).
- Le SDK Telnyx attache le `remoteStream` à cet élément via `remoteElement` (`:292`) et déclenche
  `play()`.
- **Autoplay** : détection du rejet dans un `setTimeout(…, 500)` → `audioPlayFailed` (`:367-372`) ;
  bouton « Activer le son » → `requestAudioUnlock()` (`:825-832`) appelant `el.play()`.
- Le contexte expose aussi `remoteStream` pour l'`AudioVisualizer` (`Softphone.tsx:213`).

## F. Média PSTN

- **APP_TO_PSTN** (sortant) : `useCallRouter` → `/api/call-route` (décision serveur) →
  `TelnyxContext.makeCall()` → `/api/telnyx/preauthorize` (réservation/quota + `clientState`) →
  `client.newCall({ destinationNumber, callerNumber, clientState, id, audio: true, video: false })`
  (`:592-599`).
- **PSTN_TO_APP** (entrant) : le média arrive **exclusivement via le SDK Telnyx**.
  Pusher (`pstn:incoming` sur `private-user-{userId}`) ne sert qu'à **afficher l'UI de sonnerie**
  (`TelnyxContext.tsx:444-504`) ; `answerCall()` attend le `Call` SDK corrélé par `callControlId`
  puis appelle `call.answer()` (`:619-665`). Repli serveur `/api/telnyx/answer` si `answer()` échoue.
- Corrélation stricte par `callControlId` (`lib/pstn-correlation.ts`), registre SDK + candidats.

## G. Telnyx Media Streaming

**AUCUNE occurrence** dans le code applicatif de : `stream_url`, `start_streaming`,
`stop_streaming`, `media_stream`, `streaming.start`, `stream_track`, `bidirectional`.
(Recherche globale : seules occurrences = dans les rapports `.md`, jamais dans le code `.ts/.tsx`.)

- La commande Telnyx `start_streaming` (Voice API Media Streaming) **n'est jamais émise**.
- `server/media-server.ts` implémente le **côté récepteur** du protocole Media Stream Telnyx
  (`event: start` / `media` / `stop`, payload G.711 µ-law base64) sur `ws://…/media` — mais
  **rien ne lui envoie de `stream_url`** : aucun `start_streaming` côté webhook.

**Verdict G :** Telnyx Voice API Media Streaming = **NOT_IMPLEMENTED** (côté émission).

## H. Support bidirectionnel (media-server)

`server/media-server.ts` est, **dans son code**, un pont bidirectionnel :
- Telnyx → OpenAI : `event: media` → `input_audio_buffer.append` (`:401-409`).
- OpenAI → Telnyx : `response.audio.delta` → `telnyxWs.send({ event: 'media', … })` (`:88-104`).
- Barge-in : `input_audio_buffer.speech_started` → Telnyx `clear_media` + `conversation.item.truncate`
  (`:193-215`).
- Codecs : **G.711 µ-law** (`input_audio_format`/`output_audio_format: "g711_ulaw"`, `:267-268`).

Mais ce pont est **non branché** : pas de producteur (`start_streaming`), non importé par
l'application, non déployé sur Vercel (Dockerfile Fly séparé). Voir K.

**Verdict H :** BIDIRECTIONAL_MEDIA = **NOT_IMPLEMENTED en pratique** (code legacy inactif).

## I. LiveKit

Architecture réellement câblée pour l'IA : **transfert Call Control vers un trunk SIP LiveKit**,
PAS un SDK LiveKit, PAS un WebSocket média.

- `app/api/webhooks/telecom/route.ts` (événement `call.answered`, `:608-696`) :
  si `phoneNumber.aiEmployee.isActive` → `telnyx.calls.actions.transfer(callControlId, { to: LIVEKIT_SIP_URI, custom_headers, command_id, client_state, target_leg_client_state, time_limit_secs })`.
- `LIVEKIT_SIP_URI` lu via `process.env` (`:612`) ; **absent de `.env` / `.env.local`** (doit exister
  dans l'env de déploiement).
- Contexte agent transmis par en-têtes SIP `X-Agent-*`, `X-Organization-Id`, `X-Call-Log-Id`
  (le prompt complet n'est pas mis dans les headers — l'agent Python le recharge en DB).
- Kind de corrélation : `AI_LIVEKIT_TRANSFER` (`lib/telnyx-call-routing.ts:12`).
- **Provisioning** : page `app/dashboard/livekit` (« LiveKit sur Telnyx », BÊTA) — `actions.ts`
  `provisionLiveKitTenant` (POST `https://<region>.livekit-telnyx.com/provision`) et
  `bridgeLiveKitTelephony` (crée une FQDN connection + FQDN SIP `<region>.sip.livekit-telnyx.com`
  + assigne le numéro). Ce sont de vrais appels API Telnyx.

**Comparatif** :
- `Telnyx → LiveKit SIP → Agent IA (Python/LiveKit)` = **câblé et actif dans le code** (sous réserve
  de `LIVEKIT_SIP_URI` + agent déployé).
- `Telnyx → Media Streaming WebSocket → OpenAI Realtime` = **inactif / legacy**.

## J. OpenAI Realtime

- Utilisé **uniquement** dans `server/media-server.ts` :
  `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01` (`:66`),
  `input_audio_buffer.append`, `session.update` (voix, `server_vad`, whisper-1, tools),
  `response.audio.delta`, `response.function_call_arguments.done`, `conversation.item.truncate`.
- Le SDK `openai@6.45.0` est par ailleurs utilisé côté REST (ex. analyse de transcription
  `gpt-4o-mini`, `:451-472`).
- Ce pont Realtime **n'est atteignable par aucun flux média** (pas de `stream_url`). Il est
  **legacy**.

**Verdict J :** OPENAI_REALTIME_BRIDGE = **LEGACY** (code présent, flux média absent).

## K. Code mort / legacy

| Élément | Statut |
|---|---|
| `server/media-server.ts` (573 lignes) | **LEGACY_DEAD_CODE** — non importé par l'app ; référencé uniquement par `package.json` (`dev:ws`), `Dockerfile.media-server`, `fly.toml` (`antigravity-media-server`). Implémente l'ancienne archi « Option A » (Media Streaming WS ↔ OpenAI Realtime). |
| `@telnyx/video@1.0.2` | **Dépendance morte** — aucun import. |
| `server/pstn-forward-worker.ts` | Worker de polling forwarding/voicemail (hors média) — utilisé via `worker:pstn-forward`. |
| `@redis-iris/agent-memory` | Mémoire agent Redis (≠ LiveKit). |

Preuves : `grep "media-server"` → uniquement docs / `package.json` / Dockerfile / fly.toml.
Aucun `import … media-server` dans `app/`, `lib/`, `components/`.

⚠️ Incohérence documentaire : `TELNYX_CALL_ROUTING_AUDIT.md §P2-1` le classe
`LEGACY_DEAD_CODE_CANDIDATE`, tandis que `REALTIME_CALL_AUDIO_SDK_AUDIT.md §11` le classe
`ACTIVE`. **Le code tranche : aucun producteur `stream_url`, aucun import → legacy inactif.**

## L. Sécurité

- Webhook Telnyx : signature **ED25519** vérifiée (`telnyx-signature-ed25519` / `telnyx-timestamp`),
  dédup `WebhookEvent` (P2002). Enveloppe v2 exigée.
- `client_state` de transfert : base64 JSON **sans secret** (ids uniquement).
- TURN Cloudflare : `CLOUDFLARE_TURN_KEY_ID` / `CLOUDFLARE_TURN_API_TOKEN` **serveur uniquement**,
  credentials temporaires, jamais en `NEXT_PUBLIC_*` (`app/api/app-calls/ice-config/route.ts`,
  `lib/turn-cloudflare.ts`).
- Token Telnyx WebRTC : généré côté serveur, credential par utilisateur, rotation atomique
  (`app/api/telnyx/token/route.ts`).
- `media-server.ts` : `OPENAI_API_KEY` via env, jamais exposé ; attention le code legacy charge
  dynamiquement des modules (`../lib/tools/*.js`) — chemins `.js` sur des sources `.ts` en dev `tsx`
  (risque de casse si réactivé sans build).
- Aucun secret exposé côté client détecté dans le périmètre média.

## M. Composants manquants

1. **Producteur Telnyx Media Streaming** : aucune commande `calls.actions.start_streaming`
   (`stream_url`, `stream_codec`) → le serveur WS n'est jamais alimenté.
2. **`LIVEKIT_SIP_URI`** absent des env locales (`.env.local`) : le chemin IA est
   fonctionnellement inopérant en local ; à vérifier sur Vercel.
3. **Agent LiveKit Python** (STT Telnyx / LLM / TTS) : documenté dans l'UI mais non présent dans ce
   dépôt (à déployer séparément).
4. **SDK LiveKit client** : non requis par l'archi SIP retenue (à décider si migration).
5. **Credentials TURN Cloudflare** absents de `.env.local` (à configurer en déploiement).
6. Aucun codec préférentiel n'est imposé côté client Telnyx (défaut SDK Opus/PCMU) ; le legacy
   media-server impose G.711 µ-law côté OpenAI Realtime.

## N. Architecture recommandée

**Cible conservée (déjà en place) :**
```
APP_TO_APP :  Browser ── RTCPeerConnection (natif) ── Pusher (signaling) ── Cloudflare TURN
APP_TO_PSTN:  Browser ── @telnyx/webrtc (TelnyxRTC) ── Telnyx ── PSTN
PSTN_TO_APP:  PSTN ── Telnyx ── SDK Telnyx Call ── <audio id="telnyx-remote-audio"> (browser)
AI Voice   :  PSTN ── Telnyx Call Control ── transfer SIP ── LiveKit SIP ── Agent IA (Python)
```
**À retirer / rationaliser :**
- Archiver/supprimer `server/media-server.ts` (ainsi que `Dockerfile.media-server`, `fly.toml`,
  script `dev:ws`) une fois confirmé qu'aucun déploiement Fly ne tourne — sinon le marquer
  explicitement `LEGACY` en tête de fichier.
- Retirer `@telnyx/video` (inutilisé).
- Documenter `LIVEKIT_SIP_URI` et l'agent LiveKit comme prérequis de l'IA vocale.
- **Ne pas** réintroduire Telnyx Media Streaming WS + OpenAI Realtime : l'archi SIP LiveKit est
  plus simple à opérer et déjà câblée.

---

## Verdicts finaux

```
TELNYX_WEBRTC_SDK        = ACTIVE
TELNYX_MEDIA_STREAMING   = ABSENT
BIDIRECTIONAL_MEDIA      = ABSENT
LIVEKIT_BRIDGE           = PARTIAL
OPENAI_REALTIME_BRIDGE   = LEGACY
```

Justifications synthétiques :
- **TELNYX_WEBRTC_SDK = ACTIVE** — `@telnyx/webrtc@2.27.1` réellement utilisé (connexion, appels
  sortants/entrants, mute, DTMF, audio distant).
- **TELNYX_MEDIA_STREAMING = ABSENT** — aucune commande `start_streaming`/`stream_url` nulle part.
- **BIDIRECTIONAL_MEDIA = ABSENT** — le pont bidirectionnel n'existe que dans un fichier legacy non
  branché et non déployé.
- **LIVEKIT_BRIDGE = PARTIAL** — transfert SIP + provisioning câblés, mais dépendent d'une env
  (`LIVEKIT_SIP_URI`) et d'un agent externes absents en local.
- **OPENAI_REALTIME_BRIDGE = LEGACY** — code complet mais sans flux média entrant.

## Recommandation finale

**EXTEND** le pont **LiveKit SIP** (chemin IA actif, à fiabiliser : vérifier `LIVEKIT_SIP_URI` en
prod, finaliser l'agent Python) **+ REMOVE_LEGACY** `server/media-server.ts` (et `@telnyx/video`) —
sans toucher au moteur Telnyx WebRTC (KEEP) ni à APP_TO_APP (KEEP natif/Pusher/TURN).
