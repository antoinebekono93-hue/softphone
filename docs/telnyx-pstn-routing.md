# Routage PSTN Telnyx piloté par God Mode

## Source de vérité

La configuration applicative stockée dans `PhoneNumber` est la source de vérité
du routage entrant. Le forwarding natif du numéro chez Telnyx reste désactivé.
Telnyx transporte les appels et exécute les commandes envoyées par le backend ;
il ne choisit pas la destination de forwarding à la place de l'application.

## Correspondance God Mode / Telnyx

| God Mode | Donnée locale | Action Telnyx |
| --- | --- | --- |
| Connexion SIP/WebRTC | `SystemSettings.telnyxConnectionId` | Connexion du numéro et authentification des credentials WebRTC |
| Webhook primaire/secours | configuration de connexion | Événements Call Control v2 vers `/api/webhooks/telecom` |
| Profil vocal sortant | `PricingPlan` et configuration Telnyx | Autorise les destinations et porte le trafic PSTN sortant |
| Mode du numéro | `PhoneNumber.incomingRoutingMode` | Décision prise par le webhook backend |
| Destination | `PhoneNumber.forwardToE164` | Paramètre `to` de `client.calls.dial()` après préautorisation |
| Délai application | `PhoneNumber.ringAppSeconds` | Échéance durable traitée par le worker PSTN |
| Routage actif | `PhoneNumber.incomingRoutingEnabled` | Active ou neutralise la règle personnalisée |

## Flux réels

- `APP` : Telnyx reçoit le PSTN, envoie le webhook signé, le backend notifie
  l'utilisateur, et le média est traité par le SDK WebRTC.
- `FORWARD` : le backend contrôle plan, destination et wallet, crée une
  `CallReservation`, répond au leg entrant, puis appelle
  `client.calls.dial()` avec `link_to` et `bridge_on_answer`.
- `APP_THEN_FORWARD` : l'application sonne jusqu'à `ringAppSeconds`. Le worker
  réclame atomiquement l'appel encore en sonnerie et exécute le même forwarding.

## Garanties

- Destination canonique E.164.
- Isolation tenant et contrôle du propriétaire.
- Préautorisation avant toute création de leg PSTN payant.
- `command_id` stable et contraintes uniques contre les doubles appels.
- Restrictions internationales, listes autorisées/bloquées et limites de plan.
- Détection des boucles entre numéros gérés.
- Settlement ou libération idempotente de la réservation.
- Caller ID sortant limité au numéro Telnyx détenu par l'organisation.

## Exploitation

1. Dans `/god-mode/telnyx`, configurer la connexion active, les webhooks et le
   profil sortant.
2. Dans `/god-mode/numbers`, synchroniser les numéros. Cette opération rattache
   les numéros avec le SDK et désactive leur forwarding natif.
3. Sur chaque numéro, choisir `APP`, `FORWARD` ou `APP_THEN_FORWARD`, puis saisir
   la destination E.164 si nécessaire.
4. Déployer le processus `npm run worker:pstn-forward` sur un runtime permanent
   pour garantir les délais courts de `APP_THEN_FORWARD`.
5. Effectuer un appel contrôlé en staging avec un wallet plafonné, puis vérifier
   `CallLog`, `CallReservation` et les webhooks Telnyx.

## Documentation Telnyx

- Dial : https://developers.telnyx.com/api-reference/call-commands/dial
- Bridge : https://developers.telnyx.com/api-reference/call-commands/bridge-calls
- Commandes Voice : https://developers.telnyx.com/docs/voice/programmable-voice/sending-commands
- WebRTC Credential Connections : https://developers.telnyx.com/docs/voice/webrtc/auth/credential-connections
- Routage WebRTC / Call Control : https://developers.telnyx.com/docs/voice/webrtc/use-cases/outbound-dialer/index
