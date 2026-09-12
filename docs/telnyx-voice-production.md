# Téléphonie Telnyx en production

Ce document décrit la configuration vocale pilotée depuis God Mode. Le portail
Telnyx n'est pas la source de vérité fonctionnelle : God Mode enregistre les
secrets opérationnels, applique les paramètres via l'API Telnyx et contrôle que
les numéros restent rattachés au backend.

## Architecture réelle

```text
Client WebRTC ── jeton court backend ── Telnyx WebRTC
      │                                  │
      └── autorisation d'appel backend   ├── réseau PSTN
                                         └── webhooks signés
                                                │
Numéro Telnyx ── connexion sélectionnée ────────┤
                                                ▼
                                  /api/webhooks/telecom
                                                │
                       Prisma / routage / facturation / Pusher
```

Le SDK WebRTC communique nécessairement avec l'infrastructure média Telnyx,
mais il ne reçoit jamais la clé API principale. Le backend contrôle le droit
d'appeler et délivre un credential temporaire. Les commandes sensibles
(answer, hangup, dial, transfer), l'achat de numéros et la configuration sont
effectués côté serveur avec le SDK ou l'API Telnyx.

## Paramètres disponibles dans God Mode

La page `/god-mode/telnyx` gère réellement :

- clé API V2 et clé publique Ed25519 des webhooks ;
- connexion SIP/WebRTC active utilisée par les numéros et les credentials ;
- webhook primaire, webhook de secours, API v1/v2 et délai de réponse ;
- activation, nom, anchor site, DTMF, SIP URI, SRTP et en-tête Contact NAT ;
- suppression du bruit, jitter buffer, RTCP et bruit de confort ;
- credentials push iOS/Android ;
- codecs entrants, limites de canaux, formats ANI/DNIS, ringback, PRACK,
  ISUP, SHAKEN/STIR, timeouts SIP et sonnerie simultanée ;
- profil sortant, limite de canaux, Caller ID E.164 et politique de
  remplacement, localisation, ringback, call parking et T.38 ;
- applications Call Control (webhooks, délais, profil sortant, SIP entrant) ;
- profils sortants (pays autorisés, débit maximal, plafond journalier,
  concurrence, activation et rattachement aux connexions) ;
- utilisateurs WebRTC et credentials téléphoniques individuels ;
- achat de numéros réels et rattachement des numéros existants ;
- routage entrant par numéro dans `/god-mode/numbers` : `APP`, `FORWARD` ou
  `APP_THEN_FORWARD`, destination E.164 et délai de sonnerie ;
- audit de production et dernières livraisons de webhooks vocaux.

Le coût dans les webhooks est forcé à `true` par le serveur : l'interface ne
peut pas le désactiver et casser silencieusement la facturation.

## Flux entrant

1. Le DID est rattaché à la connexion sélectionnée dans God Mode.
2. Le transfert natif du numéro Telnyx est désactivé. Le code décide seul du
   routage afin d'éviter deux sources de vérité.
3. Telnyx envoie `call.initiated` au webhook HTTPS v2.
4. La signature Ed25519 est vérifiée avant toute mutation.
5. L'événement est revendiqué par son `data.id` dans Prisma pour ignorer les
   doublons.
6. Le backend applique le mode du numéro : application, transfert PSTN direct,
   ou application puis transfert après le délai configuré.
7. `call.answered`, `call.bridged`, `call.hangup` et `call.failed` mettent à jour
   l'appel, règlent la facturation et publient la fin d'appel au navigateur.

Telnyx peut livrer les webhooks en double, simultanément ou dans le désordre.
Le traitement est donc idempotent et les commandes utilisent un `command_id`.

## Flux sortant

1. Le navigateur demande une autorisation au backend (destination E.164,
   forfait, wallet, limites et identité de l'appelant).
2. Le navigateur établit la session WebRTC avec son credential limité ; il ne
   connaît jamais la clé API principale.
3. La connexion doit être active et posséder un profil sortant actif.
4. Le pays doit être présent dans `whitelisted_destinations`, et le tarif ne
   doit pas dépasser `max_destination_rate`.
5. Le numéro Caller ID et sa politique sont transmis séparément dans
   `ani_override` et `ani_override_type`.
6. La fin distante produit `call.hangup`, ferme l'interface et déclenche le
   règlement idempotent par secondes réelles.

## Audit de production

Dans **God Mode → Telnyx → API Logs & Debug**, lancer **Audit téléphonique de
production**. L'audit interroge Telnyx en lecture seule et signale comme
bloquants :

- clé publique de signature absente ;
- connexion absente, inaccessible ou désactivée ;
- webhook primaire non HTTPS ou autre version que v2 ;
- coût d'appel absent des webhooks ;
- profil sortant non associé ;
- configuration Pusher incomplète pour la notification navigateur ;
- numéro relié à une autre connexion ;
- transfert natif Telnyx encore actif ;
- transfert local sans destination ;
- livraison récente d'un webhook vocal en échec.

Une URL de secours absente est un avertissement : elle n'empêche pas un appel, mais
réduit la tolérance aux incidents. Le bouton **Rattacher les numéros existants**
réapplique la connexion sélectionnée et désactive le transfert natif Telnyx.

## Déploiement

La migration `20260910000000_add_telnyx_public_key` doit être appliquée avant le
déploiement de cette version. La clé API, la clé publique et l'identifiant de
connexion peuvent être enregistrés dans God Mode ; les variables
`TELNYX_API_KEY`, `TELNYX_PUBLIC_KEY` et `TELNYX_SIP_CONNECTION_ID` restent des
solutions de secours.

Les notifications navigateur nécessitent également :

- `PUSHER_APP_ID`
- `PUSHER_SECRET`
- `NEXT_PUBLIC_PUSHER_KEY`
- `NEXT_PUBLIC_PUSHER_CLUSTER`

Les credentials APNS/FCM de la connexion servent aux applications mobiles
natives. Pour une PWA fermée ou suspendue, ils ne remplacent pas à eux seuls un
service push navigateur ; l'audit vérifie donc séparément le canal Pusher.

## Références officielles

- [Fondamentaux Voice API](https://developers.telnyx.com/docs/voice/programmable-voice/voice-api-fundamentals)
- [Réception des webhooks](https://developers.telnyx.com/docs/voice/programmable-voice/receiving-webhooks)
- [Webhooks Voice API](https://developers.telnyx.com/docs/voice/programmable-voice/voice-api-webhooks)
- [Commandes Voice API](https://developers.telnyx.com/docs/voice/programmable-voice/sending-commands)
- [Reprises de commandes](https://developers.telnyx.com/docs/voice/programmable-voice/command-retries)
- [Connexion par credentials](https://developers.telnyx.com/api-reference/credential-connections/create-a-credential-connection)
- [Profils vocaux sortants](https://developers.telnyx.com/api-reference/outbound-voice-profiles/create-an-outbound-voice-profile)
- [Livraisons de webhooks](https://developers.telnyx.com/api-reference/webhooks/list-webhook-deliveries)
- [Authentification WebRTC](https://developers.telnyx.com/docs/voice/webrtc/auth/credential-connections)
- [Notifications push WebRTC](https://developers.telnyx.com/docs/voice/webrtc/push-notifications?lang=api)
