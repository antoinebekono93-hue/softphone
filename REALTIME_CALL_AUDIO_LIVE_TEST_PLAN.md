# PLAN DE VALIDATION LIVE — REALTIME / CALL / AUDIO / WEBRTC

**Date :** 3 octobre 2026  
**Statut :** **PLAN PRÊT — EN ATTENTE DU GO POUR EXÉCUTION MANUELLE**  
**Règles d'or :** Aucun appel payant automatisé, aucun secret dans les logs, aucun commit/push.

---

## Verdicts Actuels
* `REALTIME_CALL_AUDIO_STATIC_READINESS` = **READY**
* `REALTIME_CALL_AUDIO_LIVE_VALIDATION` = **PENDING**

---

## Table des Matières des Scénarios
1. APP_TO_APP même réseau (Wi-Fi local)
2. APP_TO_APP réseaux différents (ex: Wi-Fi vs 4G / VPN)
3. APP_TO_APP Cloudflare TURN forcé (`iceTransportPolicy: relay`)
4. Reconnexion après coupure réseau temporaire
5. Permission microphone refusée
6. Autoplay audio bloqué (politique navigateur)
7. Mute / Unmute en cours d'appel
8. Appel PSTN sortant (App to PSTN via Telnyx)
9. Appel PSTN entrant (PSTN to App via Telnyx + Pusher)
10. Compatibilité Chrome Desktop
11. Compatibilité Chrome Android / PWA
12. Compatibilité Safari iOS / PWA

---

## 1. APP_TO_APP même réseau (Wi-Fi local)

* **Prérequis :** Deux navigateurs distincts (ou deux appareils) connectés au même réseau Wi-Fi, authentifiés avec deux comptes utilisateurs différents de la même organisation (ou inter-organisation si autorisé).
* **Étapes :**
  1. Ouvrir le workspace softphone sur l'appareil A et l'appareil B.
  2. Depuis l'appareil A, lancer un appel vers l'extension ou le nom d'utilisateur de B (via le carrousel/répertoire ou le bouton d'appel interne).
  3. Observer la sonnerie entrante sur l'appareil B.
  4. Cliquer sur "Répondre" sur l'appareil B.
  5. Parler dans les micros et vérifier la double communication audio.
  6. Raccrocher depuis l'un ou l'autre appareil.
* **Logs / IDs à observer :**
  - Console navigateur : `[WebRTC][STATE]`, `[WebRTC][ICE] connectionState=connected`, `[WebRTC][MEDIA] remoteTrackReceived`.
  - ID d'appel : `AppCallSession ID`.
* **Résultat attendu :** Établissement de l'appel P2P direct (candidats `host` ou `srflx` STUN), audio bidirectionnel fluide, fermeture propre sans résidu de flux.
* **Conditions PASS :** `connectionState` passe à `connected` en moins de 3 secondes, audio audible des deux côtés, fin d'appel immédiate sur les deux UI.
* **Conditions FAIL :** Timeout en `OFFERING` ou `RINGING`, absence d'audio, persistance de la session après raccrochage.
* **Informations à ne JAMAIS logger :** SDP complet, tokens Pusher, credentials TURN.
* **Coût éventuel :** 0 $ (APP_TO_APP illimité, pas de PSTN).

---

## 2. APP_TO_APP réseaux différents

* **Prérequis :** Deux appareils sur des réseaux étanches (ex: Appareil A sur Wi-Fi fixe, Appareil B sur partage de connexion 4G/5G).
* **Étapes :**
  1. Lancer un appel APP_TO_APP de A vers B.
  2. Accepter l'appel sur B.
  3. Vérifier l'établissement du flux via le relais TURN Cloudflare (si NAT strict) ou candidats STUN si compatibles.
* **Logs / IDs à observer :**
  - Console navigateur : types de candidats ICE (`candidateType=relay` ou `srflx`), `connectionState=connected`.
* **Résultat attendu :** Établissement réussi via les serveurs TURN Cloudflare configurés.
* **Conditions PASS :** Connexion établie malgré les pare-feux NAT, audio stable.
* **Conditions FAIL :** Échec de négociation ICE (`connectionState=failed`), absence de relais TURN fonctionnel.
* **Informations à ne JAMAIS logger :** Credentials TURN, tokens API Cloudflare, adresses IP privées en clair.
* **Coût éventuel :** 0 $.

---

## 3. APP_TO_APP Cloudflare TURN forcé (`iceTransportPolicy: relay`)

> **OUTILLAGE AJOUTÉ.** Un interrupteur **test-only** existe désormais
> (`resolveIceTransportPolicy` / `applyIceTransportPolicy` dans `lib/ice-config.ts`).
> Il rend ce scénario **exécutable**, mais ne prouve **rien** sur la connectivité
> tant qu'un navigateur réel n'a pas sélectionné un candidat `relay`.

### 3.0 Prérequis bloquants

1. **Credentials TURN Cloudflare configurés côté serveur** (absents de `.env` et
   `.env.local` au moment de l'audit → le test échouerait en falling back sur STUN) :
   - `CLOUDFLARE_TURN_KEY_ID`
   - `CLOUDFLARE_TURN_API_TOKEN`
   Ne jamais les afficher. Vérifier la présence par **nom de variable uniquement**.
2. `GET /api/app-calls/ice-config` doit renvoyer une entrée `turn:` **avec**
   `username` et `credential` (sinon `normalizeIceServers` la rejette et le client
   retombe sur STUN).
3. **Deux** utilisateurs APP_TO_APP sur deux appareils.

### 3.1 Activer le mode relay (test uniquement)

Le flag est `NEXT_PUBLIC_APP_CALL_FORCE_RELAY`, donc **inliné au build Next.js** :
il ne peut pas être basculé via une query string ni une entrée utilisateur, et il
est **ignoré si `NODE_ENV === "production"`**.

```bash
# .env.local — ajout LOCAL, à retirer ensuite
NEXT_PUBLIC_APP_CALL_FORCE_RELAY=true
```

Puis **redémarrer le serveur de dev** (`npm run dev`) : la variable est lue au build,
pas à chaud. Ne jamais committer cette ligne.

Valeurs acceptées : `true`, `1`, `on`, `yes`. Tout le reste → `all`.

### 3.2 Confirmer que le mode est RÉELLEMENT actif

Dans la console du navigateur, au moment de l'établissement de l'appel :

```
[ICE] icePolicy {"policy":"relay","relayForced":true}
[ICE] iceCandidate {"candidateType":"relay","protocol":"udp"}
```

- Si le log affiche `policy: "all"` / `relayForced: false` → **le mode n'est pas
  actif** (flag non lu au build, ou environnement `production`). STOP.
- Ne jamais logger le `credential` TURN.

### 3.3 Vérifier la candidate-pair sélectionnée (Chrome)

1. Ouvrir `chrome://webrtc-internals` **avant** de lancer l'appel.
2. Cocher **"Show ICE candidate pairs"** et **"Show local/remote IP addresses"**.
3. Lancer l'appel.
4. Dans la vue `iceCandidateStats`, retenir la **candidate pair sélectionnée**
   (`nominated: true` / `state: succeeded`) et lire :
   - `localCandidateType` / `remoteCandidateType` → **doivent valoir `relay`**.
5. Vérifier dans `candidate-pair` que le bytesSent/RTT sont non nuls → le relais
   transporte réellement le média.

**Ne pas recopier les IP/ports relay dans un ticket** : masquer par exemple
`172.64.x.x:3478` → `<relay Cloudflare>`. Les IPs relay Cloudflare sont publiques
mais sans valeur de diagnostic ici.

### 3.4 Vérifier l'audio bidirectionnel

- Micro A → haut-parleur B : audible.
- Micro B → haut-parleur A : audible.
- `connectionState` / `iceConnectionState` → `connected` / `completed`.
- Second `getUserMedia` non déclenché (un seul `localStream`).

### 3.5 Résultats

- **PASS** : `relayForced: true` **ET** candidate pair sélectionnée `relay` **ET**
  audio bidirectionnel réel **ET** hangup/cleanup propre.
- **FAIL** : le mode ne s'active pas ; ou la connexion échoue
  (`iceConnectionState: failed`) ; ou seul du STUN/hôte est sélectionné ; ou
  l'audio est unidirectionnel.

### 3.6 Désactiver le mode test (obligatoire)

```bash
# supprimer/commenter la ligne, puis redémarrer
# NEXT_PUBLIC_APP_CALL_FORCE_RELAY=true
```

Vérifier après redémarrage : le log redevient `policy: "all"` /
`relayForced: false`, et **la clé `iceTransportPolicy` est absente** de la
configuration de la PeerConnection (défaut navigateur P2P + TURN).

### 3.7 Sécurité

- `CLOUDFLARE_TURN_KEY_ID` / `CLOUDFLARE_TURN_API_TOKEN` : **serveur uniquement**,
  jamais de `NEXT_PUBLIC_*`, jamais dans un log, jamais dans le bundle client.
- Les credentials TURN temporaires (`username`/`credential`) transitent vers le
  navigateur par nécessité WebRTC, ne sont jamais persistés, et ne doivent pas
  être journalisés.
- Coût : **0 $** (bande passante relais Cloudflare uniquement, pas de minute PSTN).

> **Ce test ne vaut PAS validation live TURN.** Il prouve que l'outillage est
> correct ; `TURN_RELAY_CONNECTIVITY` reste `NOT_RUN` tant qu'un opérateur n'a pas
> exécuté ces étapes et fourni les relevés.

---

## 4. Reconnexion après coupure réseau temporaire

* **Prérequis :** Un appel APP_TO_APP actif entre A et B.
* **Étapes :**
  1. Couper le Wi-Fi de l'appareil A pendant 5 secondes, puis le rétablir.
  2. Observer le comportement de la PeerConnection (détection de déconnexion, tentative de recovery / ICE restart).
* **Logs / IDs à observer :**
  - Console : `connectionState=disconnected` → `connecting` → `connected`, ou `iceConnectionState=failed` avec déclenchement d'un ICE restart.
* **Résultat attendu :** L'appel se rétablit automatiquement sans intervention utilisateur si la coupure est brève, ou se termine proprement par un message d'erreur si la coupure dépasse le timeout.
* **Conditions PASS :** Rétablissement de l'audio ou fermeture propre sans plantage React.
* **Conditions FAIL :** Gel infini de l'UI en état `CONNECTING`, fuite du flux micro ouvert en arrière-plan.
* **Informations à ne JAMAIS logger :** Secrets.
* **Coût éventuel :** 0 $.

---

## 5. Permission microphone refusée

* **Prérequis :** Appareil dont les permissions micro sont bloquées au niveau du navigateur pour l'origine du site.
* **Étapes :**
  1. Tenter de lancer un appel APP_TO_APP ou PSTN.
  2. Observer la réaction de l'interface lors de l'appel à `getUserMedia`.
* **Logs / IDs à observer :**
  - Console : `[WebRTC][MEDIA] microphoneDenied`, classification `permission-denied`.
* **Résultat attendu :** L'appel n'est pas lancé, une alerte claire (`toast`) invite l'utilisateur à autoriser le micro dans les réglages du navigateur.
* **Conditions PASS :** Message d'erreur explicite, pas d'exception non catchée, retour à l'état `idle`.
* **Conditions FAIL :** Blocage silencieux, écran figé, tentative d'émission d'offre sans flux audio local.
* **Informations à ne JAMAIS logger :** Données personnelles.
* **Coût éventuel :** 0 $.

---

## 6. Autoplay audio bloqué (politique navigateur)

* **Prérequis :** Simuler ou rencontrer une restriction d'autoplay du navigateur (ex: navigation sans interaction préalable).
* **Étapes :**
  1. Recevoir ou établir un appel sans interaction préalable sur la page.
  2. Vérifier si le navigateur bloque l'élément `<audio>` distant.
* **Logs / IDs à observer :**
  - Console : `[WebRTC][MEDIA] audioPlayFailed`.
  - UI : Apparition de l'indicateur d'avertissement et du bouton de déblocage audio (`requestAudioUnlock`).
* **Résultat attendu :** L'appel est connecté mais l'audio distant est en attente. Un clic sur le bouton de déblocage relance la lecture immédiatement.
* **Conditions PASS :** Détection du blocage par la politique du navigateur, affichage du moyen de déblocage, reprise audio au clic.
* **Conditions FAIL :** Erreur fatale plantant l'application, absence de moyen de déblocage.
* **Informations à ne JAMAIS logger :** N/A.
* **Coût éventuel :** 0 $.

---

## 7. Mute / Unmute en cours d'appel

* **Prérequis :** Un appel actif (APP_TO_APP ou PSTN).
* **Étapes :**
  1. Cliquer sur le bouton "Mute" du softphone.
  2. Vérifier que le correspondant n'entend plus rien.
  3. Cliquer sur "Unmute".
  4. Répéter l'opération 3 fois de suite.
* **Logs / IDs à observer :**
  - Console : `[WebRTC][MEDIA] localMute` / `localUnmute`, état de `track.enabled`.
* **Résultat attendu :** Le mute désactive instantanément la piste audio (`track.enabled = false`) sans réinitialiser la PeerConnection ni renégocier le SDP. L'unmute rétablit la piste.
* **Conditions PASS :** Mute instantané, aucune reconnexion WebRTC visible dans les logs, reprise immédiate au un-mute.
* **Conditions FAIL :** Renégociation WebRTC déclenchée au mute, coupure brève de la liaison, désynchronisation de l'état UI.
* **Informations à ne JAMAIS logger :** N/A.
* **Coût éventuel :** 0 $ (ou coût PSTN standard si testé sur ligne Telnyx).

---

## 8. Appel PSTN sortant (App to PSTN via Telnyx)

* **Prérequis :** Un numéro Telnyx provisionné et configuré sur le compte, avec un solde suffisant au wallet.
* **Étapes :**
  1. Saisir un numéro de téléphone externe valide dans le dialpad du softphone.
  2. Lancer l'appel (`routeCall` → `makeCall`).
  3. Observer la préautorisation, la création de l'appel Telnyx et la sonnerie.
  4. Décrocher sur le téléphone externe.
  5. Raccrocher.
* **Logs / IDs à observer :**
  - Console / Serveur : `call_control_id`, `call_session_id`, logs de préautorisation de facturation.
* **Résultat attendu :** L'appel sonne sur le téléphone externe, l'audio bidirectionnel s'établit via Telnyx WebRTC, et le raccrochage clôture correctement la session et impute le ledger.
* **Conditions PASS :** Établissement réussi, audio clair, facturation correcte, nettoyage complet à la fin.
* **Conditions FAIL :** Refus de préautorisation inattendu, absence de sonnerie, persistance de l'appel côté Telnyx après raccrochage navigateur.
* **Informations à ne JAMAIS logger :** Clé API Telnyx, JWT SIP complet, numéros complets dans les logs de production (masquage requis).
* **Coût éventuel :** **Payant** (tarifs standard Telnyx par minute selon la destination). *Ne lancer qu'en cas de validation live explicite.*

---

## 9. Appel PSTN entrant (PSTN to App via Telnyx + Pusher)

* **Prérequis :** Un téléphone externe appelant le numéro Telnyx associé à l'agent connecté.
* **Étapes :**
  1. Appeler le numéro de téléphone depuis une ligne externe.
  2. Observer l'apparition de l'interface d'appel entrant sur le softphone (déclenché par le webhook Telnyx + Pusher `pstn:incoming`).
  3. Répondre à l'appel (`answerCall` → corrélation exacte `callControlId` + SDK `answer()`).
  4. Parler, puis raccrocher.
* **Logs / IDs à observer :**
  - Console / Serveur : `[CALL_INCOMING_PUSHER_RECEIVED]`, `[CALL_INCOMING_SDK_LINKED]`, `callControlId`.
* **Résultat attendu :** L'UI d'appel entrant apparaît instantanément, la corrélation avec le SDK Telnyx s'effectue sans erreur, le décrochage établit l'audio.
* **Conditions PASS :** Notification Pusher reçue, corrélation SDK réussie, audio bidirectionnel opérationnel.
* **Conditions FAIL :** Appel entrant ignoré, UI invisible, erreur de corrélation `callControlId`, absence d'audio après décrochage.
* **Informations à ne JAMAIS logger :** Secrets de webhook Telnyx, identifiants complets.
* **Coût éventuel :** **Payant** (frais d'appel entrant Telnyx). *Ne lancer qu'en cas de validation live explicite.*

---

## 10. Compatibilité Chrome Desktop

* **Prérequis :** Google Chrome à jour sur macOS / Windows / Linux.
* **Étapes :** Exécuter les tests 1, 7 et 8.
* **Résultat attendu :** Support natif complet de toutes les fonctionnalités (getUserMedia, WebRTC, setSinkId, AudioContext, Web Audio Visualizer).
* **Conditions PASS :** 100% des flux et APIs natifs opérationnels.

---

## 11. Compatibilité Chrome Android / PWA

* **Prérequis :** Smartphone Android avec Chrome ou PWA installée.
* **Étapes :** Tester l'émission/réception d'appels APP_TO_APP et la gestion des permissions micro.
* **Résultat attendu :** Demande de permission micro native, gestion correcte du mode veille/verrouillage (dans les limites des restrictions PWA mobiles), audio stable.
* **Conditions PASS :** Fonctionnement fluide sur mobile Android.

---

## 12. Safari iOS / PWA

* **Prérequis :** iPhone / iPad avec iOS récent (Safari ou PWA ajoutée à l'écran d'accueil).
* **Étapes :**
  1. Lancer un appel APP_TO_APP.
  2. Vérifier la gestion du geste utilisateur pour l'audio (`AudioContext` / autoplay).
* **Résultat attendu :** Demande de permission micro affichée par WebKit, nécessité d'un appui utilisateur explicite pour débloquer l'audio si requis par iOS.
* **Conditions PASS :** Appel fonctionnel sur iOS avec respect des contraintes WebKit.
* **Conditions FAIL :** Crash de Safari lors de l'initialisation de la PeerConnection ou blocage total de l'audio sans possibilité de déblocage.

---

## Résumé des Verdicts Finaux

* `REALTIME_CALL_AUDIO_STATIC_READINESS` = **READY**
* `REALTIME_CALL_AUDIO_LIVE_VALIDATION` = **PENDING**
