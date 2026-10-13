# Rapport de sécurité — Webhook tool Telnyx AI (Phase 3)

Périmètre : authentification du webhook tool Telnyx, anti-rejeu, contrat de
body signé, isolation de tenant et pipeline read-only. Aucune base de données
requise pour les tests ; aucun assistant, numéro ou appel réel provisionné.

## A. Point d'entrée unique et modèle d'authentification

- Route unique : `POST /api/ai/tools/telnyx` (`app/api/ai/tools/telnyx/route.ts`).
  Une SEULE URL pour tous les outils. Jamais une route par outil.
- Transport : HTTPS (Plateforme). Aucun secret dans l'URL ; la route ne
  transporte que la path fixe `DEFAULT_AI_TOOL_WEBHOOK_PATH`
  (`lib/ai-tools/telnyx-definitions.ts`).
- Authentification : signature Ed25519 officielle Telnyx sur le corps brut.
- Le nom d'outil et l'identité de l'assistant ne sont PAS des entrées HTTP ;
  ils voyagent dans le body signé (voir G).

## B. Primitive de signature (unique)

- Fichier : `lib/ai-tools/webhook/signature.ts`.
- Schéma vérifié : Ed25519 sur `"{telnyx-timestamp}|{raw_body}"` en UTF-8,
  exactement tel que documenté (guide « AI assistant backend » Telnyx Edge).
- Entêtes : `telnyx-signature-ed25519` (une ou plusieurs signatures base64
  séparées par des espaces — rotation de clé gérée) et `telnyx-timestamp`.
- Implémentation : `crypto.verify(null, data, keyObject, signature)` (OpenSSL
  EVP_DigestVerify, comparaison constante côté OpenSSL). Aucune dépendance
  ajoutée.
- Une seule primitive d'authentification d'écriture : il n'existe pas de
  seconde variante concurrente dans le flux AI.
- Clé publique acceptée en base64 brute (32 octets, enveloppée en SPKI DER) OU
  en PEM. Toute autre longueur/format ⇒ refus.
- Une signature Ed25519 VALIDE, vérifiée contre la clé publique Telnyx de
  confiance, prouve : (a) l'INTÉGRITÉ du payload (aucune altération après
  signature), et (b) l'AUTHENTICITÉ du signataire — seul le détenteur de la clé
  privée correspondante (Telnyx) peut produire une signature acceptée. Un tiers
  ne connaissant que la clé publique ne peut PAS forger une signature.
- Fail-closed : toute anomalie (entête manquant, timestamp illisible, fenêtre
  d'horloge, clé invalide, signature non conforme) renvoie `ok:false`. Aucun
  chemin ne retourne « vrai » par défaut.
- Hypothèse de confiance restante : `TRUSTED_PUBLIC_KEY_CONFIGURATION /
  KEY_ROTATION` (voir C et P1).

### Constat connexe (hors périmètre Phase 3)

`telnyx@7.2.0` (`node_modules/telnyx/resources/webhooks.js`) n'expose que
`unsafeUnwrap` / `unwrap`. `unwrap` s'appuie sur `standardwebhooks` (HMAC-SHA256
sur `msgId.timestamp.payload`, entêtes `webhook-id`/`webhook-signature`/
`webhook-timestamp`) — schéma DIFFÉRENT du Ed25519 `{timestamp}|{payload}` de
Telnyx, donc inutilisable pour ces webhooks. Par ailleurs `constructEvent`
(référencé dans `app/api/webhooks/telecom/route.ts` et
`app/api/webhooks/whatsapp/route.ts`) n'est déclaré nulle part dans le SDK
installé et `getConfiguredTelnyxClient()` retourne `any` (donc non contrôle
par TS). Recommandation : vérifier/fiabiliser ces deux routes séparément ; ce
n'est pas corrigé ici (hors périmètre).

## C. Gestion de la clé publique

- Source unique : `getConfiguredTelnyxPublicKey()` (`lib/telnyx.ts`),
  God Mode (`SystemSettings.telnyxPublicKey`) prioritaire, fallback env
  `TELNYX_PUBLIC_KEY`. Aucune clé codée en dur (vérifié).
- Clé absente ou non configurée ⇒ la route refuse (`503 TEMPORARILY_UNAVAILABLE`)
  via `publicKeyProvider` ; jamais de contournement.
- La clé n'est jamais renvoyée dans une réponse ni journalisée.
- Hypothèse de confiance : la clé publique configurée est bien celle de Telnyx
  (`TRUSTED_PUBLIC_KEY_CONFIGURATION`) et sa rotation est gérée
  (`KEY_ROTATION`). Cette configuration est un pré-requis de déploiement, hors
  du chemin de code : si une clé erronée/expirée est configurée, toutes les
  signatures légitimes sont refusées (fail-closed), mais aucune ne serait
  acceptée à tort.

## D. Fenêtre d'horloge (anti-rejeu temporel)

- `TELNYX_WEBHOOK_MAX_SKEW_SECONDS = 300` (5 minutes), appliqué dans les deux
  sens (trop ancien / trop futur). Valeur documentée, alignée sur la tolérance
  de la spec Standard Webhooks et l'exemple maxSkew de la doc Telnyx Edge.
- Timestamp non numérique ⇒ `INVALID_TIMESTAMP` ⇒ refus.
- Constants explicites, jamais arbitraires.

## E. Rejeu et idempotence

- Clé déterministe : `deriveTelnyxAIToolReplayKey(timestamp, rawBody)` =
  `sha256("{timestamp}|{rawBody}")`, préfixée `ai-tool:`.
- Claim durable via la table EXISTANTE `WebhookEvent` (provider `TELNYX`, type
  `ai_tool_webhook`) — `lib/telnyx-ai-tool-webhook-idempotence.ts`. Aucune
  seconde table créée.
- Un enregistrement déjà présent (`P2002`) ⇒ `DUPLICATE` ⇒ réponse `200`
  `{ ok:true, deduplicated:true }` (le handler n'est PAS ré-exécuté) +
  événement `AI_TOOL_WEBHOOK_REPLAY_REJECTED`.
- Portée : déduplique un rejeu STRICTEMENT identique (même body, même
  timestamp). Un retry Telnyx re-signé avec un nouveau timestamp n'est pas
  dédupliqué par cette clé (limitation documentée ci-dessous, section P).

## F. Traitement du body brut

- Le corps est lu une seule fois (`await req.text()`) et vérifié sur les OCTETS
  BRUTS. Aucune re-sérialisation/`JSON.parse` avant vérification.
- Limite de taille : `64 Kio` par défaut (`maxBodyBytes`) ; dépassement ⇒
  `413 INVALID_REQUEST` AVANT toute vérification cryptographique coûteuse.
- Aucune persistance du payload brut par défaut : seul l'`eventId` déterministe
  (+ provider + type) est écrit dans `WebhookEvent`.

## G. Identité et isolation de tenant

- Le body signé porte `assistant_id` (littéral injecté par
  `preset_body_fields`, valeur = `telnyxAssistantId` de l'employé) et `tool`
  (nom exact de la définition). Les deux sont couverts par la signature : ni
  le LLM ni un tiers ne peuvent les falsifier sans invalider la signature.
- Résolution serveur : `assistant_id` ⇒ `AIEmployee.telnyxAssistantId`
  (`resolveAuthorizedAssistant`, `lib/ai-tools/context.ts`). Le tenant, le
  provider (`TELNYX`) et l'état actif viennent de la ligne DB, jamais du body.
- Assistant inconnu ⇒ `404 NOT_FOUND`. Provider non TELNYX / inactif ⇒ refus.
- Toutes les lectures des handlers sont scopées par `organizationId` issu de la
  ligne DB : l'accès croisé entre tenants renvoie `NOT_FOUND` (test J).
- `organizationId` injecté (dans `arguments` ou à la racine) n'est jamais
  utilisé comme autorisation : rejeté par le parseur/contrôle des clés
  inconnues (test P).

## H. Pipeline d'autorisation (ordre de coût croissant)

`taille → clé publique → signature+fenêtre → claim idempotence → parse strict →
résolution outil (registre/allowlist) → risque READ_ONLY → exécution (résolution
d'identité + rate limit inclus)`.

- Outil inconnu ⇒ `404 NOT_FOUND`. Outil non activé ou non READ_ONLY ⇒
  `403 TOOL_NOT_ALLOWED`. Aucun outil d'écriture/communication/transfert
  n'est exposé (Phase 3).
- Le registre n'expose que des outils `READ_ONLY` (`lib/ai-tools/registry.ts`).
- Une signature invalide est refusée AVANT le claim et AVANT tout comptage
  rate-limit : elle ne consomme aucune ressource d'outil (test B2).

## I. Corrélation appel / conversation

- `conversation_id` (si présent, signé) est propagé en `telnyxConversationId`
  pour l'observabilité et la portée rate-limit. Il n'est JAMAIS une
  autorisation.
- `call_control_id` et `x-telnyx-call-control-id` : corrélation uniquement,
  jamais autorisation. Aucune corrélation n'est inventée (pas de mapping
  `call_control_id → conversation` en base aujourd'hui).

## J. Contrat d'erreur exposé à Telnyx / LLM

Codes stables uniquement ; jamais de stack, Prisma, URL DB, clé publique,
identifiant de tenant interne ni nom de fichier.

| Situation | HTTP | `error` |
|---|---|---|
| Body trop gros | 413 | `INVALID_REQUEST` |
| Clé publique indisponible / échec de claim | 503 | `TEMPORARILY_UNAVAILABLE` |
| Signature absente/invalide, fenêtre d'horloge | 401 | `UNAUTHORIZED` |
| JSON malformé, clé inconnue, contrat violé | 400 | `INVALID_REQUEST` |
| Arguments invalides | 400 | `INVALID_ARGUMENTS` |
| Assistant inconnu / donnée hors tenant / outil inconnu | 404 | `NOT_FOUND` |
| Outil non activé ou non READ_ONLY | 403 | `TOOL_NOT_ALLOWED` |
| Rate limit atteint | 429/503 | `TEMPORARILY_UNAVAILABLE` |
| Succès | 200 | `{ ok:true, result }` |

## K. Observabilité et journalisation

- Événements ajoutés (`lib/ai-tools/observability.ts`) :
  `AI_TOOL_WEBHOOK_RECEIVED`, `AI_TOOL_WEBHOOK_SIGNATURE_VALID`,
  `AI_TOOL_WEBHOOK_SIGNATURE_INVALID`, `AI_TOOL_WEBHOOK_REPLAY_REJECTED`,
  `AI_TOOL_WEBHOOK_AUTHORIZED` (+ `AI_TOOL_*` de la Phase 2).
- Payload = identifiants uniquement. Jamais la signature complète, le payload
  brut, un contact, un numéro complet, un email ou un secret. Le motif de rejet
  est un code grossier (`MISSING_SIGNATURE`, `TIMESTAMP_TOO_OLD`, …).
- Test « sans PII » : les événements ne contiennent ni nom, ni téléphone, ni
  email (Mbis).

## L. Rate limiting

- Réutilise `createAIToolRateLimiter` (Phase 2), exécuté à l'intérieur de
  `executeAIToolCall` APRÈS l'identité, l'allowlist et le gate READ_ONLY.
- Les requêtes à signature invalide n'atteignent jamais le limiteur.

## M. Fondation async (non déployée)

- Le point d'exécution est injectable (`deps.executeTool`). Un mode async
  consisterait à remplacer cet exécuteur par une mise en file + accusé de
  réception différé, sans toucher au reste du pipeline. Aucun outil n'est
  converti en async en Phase 3 (les outils read-only restent SYNC).
- Indicateurs futurs (documentés, non activés) : recherche externe, génération
  de rapport, réservation complexe, opérations tierces.

## N. Définitions d'outils Telnyx

- `buildTelnyxToolDefinitionsForEmployee` (`lib/ai-tools/telnyx-definitions.ts`)
  émet, pour tous les outils, la MÊME URL
  (`DEFAULT_AI_TOOL_WEBHOOK_PATH = /api/ai/tools/telnyx`), `method: POST`,
  `execution_mode: 'sync'`, `body_parameters` = schéma d'entrée, et
  `preset_body_fields = { assistant_id, tool }` (littéraux statiques signés).
- Builder PUR : il ne contacte jamais Telnyx et ne provisionne rien.
- Aucun secret dans l'URL ni dans les presets.

## O. Couverture de tests

- Phase 2 (inchangée, verte) : `npx tsx scripts/test-ai-tools.ts` →
  `AI TOOLS : COUVERTURE COMPLÈTE`.
- Phase 3 (nouvelle) : `npx tsx scripts/test-telnyx-ai-tool-webhook.ts` →
  `TELNYX AI TOOL WEBHOOK : COUVERTURE COMPLÈTE` — 36 assertions :
  signature valide/invalide/absente, timestamp absent/ancien/futur, body
  altéré, rejeu, assistant inconnu, isolation tenant, outil d'écriture refusé,
  read-only autorisé, JSON malformé, body surdimensionné, outil inconnu,
  `organizationId` injecté, absence de PII, endpoint unique + presets signés,
  noyau webhook sans Prisma. Clé Ed25519 réelle générée/signée via `node:crypto`.
- Validations : `prisma validate` (valide), `tsc --noEmit` (0 erreur),
  `eslint` (0 erreur), les deux suites au vert.

## P. Risques résiduels et hors périmètre

1. Confiance dans la clé publique (TRUSTED_PUBLIC_KEY_CONFIGURATION /
   KEY_ROTATION) : la signature Ed25519 prouve l'intégrité et l'authenticité du
   signataire (détenteur de la clé privée Telnyx). L'hypothèse restante n'est pas
   la vérification cryptographique (correcte) mais la CONFIGURATION de la bonne
   clé publique de confiance et sa ROTATION. Risque associé : une clé mal
   configurée/obsolète provoque un déni de service (toutes les signatures
   refusées), jamais une acceptation à tort ; une clé remplacée doit être
   propagée (God Mode ou TELNYX_PUBLIC_KEY) avant que Telnyx ne change de clé.
   L'exposition d'un éventuel abus reste bornée par : outils strictement
   READ_ONLY, isolation tenant issue de la DB, rate limiting, claim
   d'idempotence et audit.
2. Idempotence « métier » : un retry Telnyx re-signé (nouveau timestamp) n'est
   pas dédupliqué par la clé exacte ; il est rejoué. Acceptable pour des
   lectures read-only, à durcir AVANT tout outil à effet de bord (voir Phase
   4A : idempotence portée par le tool call id Telnyx + contrainte unique).
3. `constructEvent` (routes telecom/whatsapp) : méthode absente du SDK 7.2.0
   installé ; à vérifier indépendamment (voir B, constat connexe).
4. Timeout SYNC du webhook tool : non publié par Telnyx ; recommandation =
   répondre vite, et basculer en async pour les opérations lentes.

## Verdicts

- `TELNYX_TOOL_WEBHOOK_ENDPOINT` : READY — un point d'entrée unique, sans
  secret, réponses contrôlées.
- `TELNYX_SIGNATURE_VERIFICATION` : READY — Ed25519 `{timestamp}|{raw_body}`,
  primitive unique, fail-closed, sur bytes bruts.
- `TELNYX_REPLAY_PROTECTION` : READY — fenêtre 5 min deux-sens + claim
  `WebhookEvent` déterministe (limitation « retry re-signé » documentée).
- `TELNYX_TOOL_IDEMPOTENCE` : READY — table existante, P2002 absorbé,
  handler non ré-exécuté.
- `AI_TOOL_AUTHENTICATION` : READY — authentification webhook active et
  testée (Phase 3 clôt l'élément PARTIAL de la Phase 2). La signature Ed25519
  prouve l'intégrité et l'authenticité du signataire ; hypothèse restante :
  `TRUSTED_PUBLIC_KEY_CONFIGURATION / KEY_ROTATION` (sections C et P1).
- `READ_ONLY_AI_TOOL_PIPELINE` : READY — registre + allowlist + gate READ_ONLY
  + rate limit, aucun outil d'écriture exposé.
