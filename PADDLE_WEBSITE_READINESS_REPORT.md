# PADDLE WEBSITE READINESS REPORT

**Site** : https://softphone-xi.vercel.app
**Dépôt** : `C:\Users\Antoine\3D Objects\github\2`
**Périmètre** : site public de marketing uniquement (pages publiques, metadata, SEO, claims, identité légale, pricing). Aucun changement sur Telnyx, WebRTC, routage d'appels, wallet, facturation backend ou authentification.

---

## VERDICT

| Champ | Valeur |
|---|---|
| `TECHNICAL_WEBSITE_READINESS` | **NOT_READY** (build de production non vérifié de bout en bout — voir §T) |
| `CLAIMS_READINESS` | **READY** (aucun claim non vérifié restant sur les pages publiques rendues) |
| `LEGAL_IDENTITY_READINESS` | **WAITING_USER** (11 champs requis non fournis) |
| `PRICING_CURRENCY` | **USD** |
| `CURRENCY_BUSINESS_VALIDATION` | **PENDING_USER** |
| `PRICING_PLAN_CONFLICTS` | **NONE** (conflit 29 USD tranché en CAS A) |
| `PADDLE_SITE_READINESS` | **WAITING_BUSINESS_INFO** |

**Paddle n'est pas intégré et ne doit pas l'être à ce stade.** Aucun `paddle.js`, aucun checkout Paddle, aucun webhook Paddle, aucun produit/entitlement Paddle. Le backend de facturation existant est hors périmètre.

Le blocage n'est pas technique : il est **documentaire**. Les pages légales ne peuvent pas être publiées en l'état sans identité réelle de l'éditeur (raison sociale, adresse, RCS/RM, TVA) ni coordonnées de contact officielles.

---

## A. Pages créées

| Route | Rôle | État |
|---|---|---|
| `/terms` | Conditions générales | Créée, vérifiée |
| `/privacy` | Politique de confidentialité | Créée, vérifiée |
| `/refund-policy` | Politique de remboursement | Créée, vérifiée |
| `/acceptable-use` | Conditions d'utilisation acceptable | Créée, vérifiée |
| `/contact` | Contact / canaux de support | Créée, vérifiée |
| `/about` | À propos / éditeur | Créée, vérifiée |
| `/etudes-de-cas` | Conservée (→ scénarios d'usage) | Créée, vérifiée |
| `app/sitemap.ts` | Sitemap XML | Créé, **corrigé cette passe** |
| `app/robots.ts` | Robots.txt | Créé, **corrigé cette passe** |

## B. Pages corrigées

| Route | Correction |
|---|---|
| `/` | Claims non prouvés retirés (volumétrie clients, taux de disponibilité) |
| `/pricing` | Clarification de l'écart entre les deux offres à 29 USD, limites d'usage |
| `/ia`, `/receptionniste-ia` | Retrait de métriques et de témoignages non prouvés |
| `/integrations` | 16 intégrations placeholder sur 19 retirées, liste alignée sur le code réel |
| `/secteurs` | ROI sectoriels non prouvés retirés |
| `/etudes-de-cas` | Réécrite en scénarios d'usage illustratifs |
| Toutes pages publiques | Marque centralisée sur `siteConfig.brand` |

## C. Pricing

- Devise unique : **USD**, aucune occurrence de `€` / `EUR` / `FCFA` sur `app/`, `components/landing`, `components/marketing`, `app/pricing` (vérifié par recherche).
- `CURRENCY_BUSINESS_VALIDATION` reste **PENDING_USER** : USD est appliqué par défaut, mais n'a pas été confirmé comme devise commerciale définitive.
- **Conflit des deux offres à 29 USD → CAS A.** Les deux offres restent et sont distinctes :

| | Appels Illimités | Standard |
|---|---|---|
| Prix | 29 USD/mois | 29 USD/mois |
| Minutes PSTN incluses | 0 | 500 |
| SMS inclus | 0 | 200 |
| Appels internes app-to-app | Illimités | Non inclus |
| Appels simultanés | 1 | 2 |
| Plafond horaire / journalier | 20 / 100 | 30 / 150 |
| Durée max / appel | 3600 s | 3600 s |
| Numéro professionnel inclus | Oui (1) | Non |
| Enregistrement | Non | Oui |
| Transfert d'appel | Non | Non |
| Appels internationaux | Non | Non |

- `PRICING_PLAN_CONFLICTS = NONE`. Source de vérité : `prisma/seedPlans.ts`.
- La page `/pricing` affiche désormais la comparaison et une FAQ expliquant l'origine des appels (interne vs réseau public), plus la distinction abonnement logiciel / consommation telecom.
- **À confirmer par le business** : les identifiants métier des plans ne sont pas des constantes dans le seed (ils sont générés en base). Aucun identifiant n'a été inventé dans le rapport.

## D. Terms

- Rédigées en français, structurellement complètes.
- Identité de l'éditeur alimentée par `siteConfig` (jamais des valeurs en dur).
- Champs manquants affichés explicitement plutôt que masqués.

## E. Refund Policy

- Couvre : éligibilité, délai de demande, renouvellements, consommation de minutes/messages, recharges de solde, procédure et délai de traitement.
- Aucun montant ni délai inventé.

## F. Privacy

- Couvre : données de compte, historique d'appels, SMS/WhatsApp, enregistrements, transcriptions, données IA, données d'usage et de facturation, bases légales, durées, sécurité, droits.
- Aucune adresse d'éditeur ni DPO fictif.

## G. Contact

- Canaux rendus conditionnels : un canal n'apparaît que si la variable d'environnement correspondante est renseignée.
- Aucun e-mail ni téléphone inventé.

## H. About

- Présente l'éditeur via `LegalIdentity`.
- Aucun chiffre de CA, nombre de clients, ancienneté ou date de création inventé.

## I. Acceptable Use

- Couvre l'usage acceptable, l'abus, la responsabilité et le contact juridique.

## J. Footer

- Liens publics vérifiés : aucun `href="#"`, aucun `javascript:`, aucun lien mort sur les pages publiques.
- **Résidu hors périmètre** : `app/dashboard/integrations/page.tsx:57` contient encore un `<a href="#">Learn more</a>`. C'est une page de tableau de bord authentifiée, hors périmètre marketing public ; **non modifié**, à traiter dans une passe produit séparée.

## K. Homepage

- Contrôlée par rendu réel (HTML servi), pas seulement par lecture de source.
- Aucun logo client, aucune marque de référence, aucun chiffre de volumétrie, aucun pourcentage de disponibilité, aucun témoignage.
- La liste de fournisseurs réellement utilisés (Telnyx, Meta, OpenAI, Cloudflare) est explicitement présentée comme des **technologies utilisées**, jamais comme des clients.

## L. Claims vérifiés / placeholders / inconnus

**Règle appliquée** : sans preuve explicite dans le dépôt, un `UNKNOWN` ou `PLACEHOLDER` est retiré ou rendu générique. Aucune exception faite par confort éditorial.

### L.1 Retirés (non publiés, à titre d'historique de cette passe)

- Référentiels d'analystes et places de marché : supprimés.
- Certifications et labels de conformité non attestés : supprimés.
- Logos d'entreprises en faux clients : supprimés.
- Témoignages clients, y compris anonymes : supprimés.
- Statistiques de volumétrie, de pays desservis et de disponibilité : supprimées.
- Intégrations et CRM sans implémentation : supprimés.
- Nombres de langues et délais de traitement non mesurés : supprimés.
- ROI sectoriels chiffrés : supprimés.

### L.2 Conservés car adossés au code

- Softphone web et mobile, routage d'appels, SMS, WhatsApp Business, agents vocaux IA, transcription, mémoire documentaire sur le chemin texte, webhooks sortants,Cloudflare TURN, Telnyx, Meta, OpenAI.
- Absence de carte bancaire à l'inscription : vérifié dans le parcours d'inscription.
- Abonnements, renouvellement et consommation : adossés au schéma Prisma et à la logique de facturation.
- Les deux offres à 29 USD : adossées à `prisma/seedPlans.ts`.

### L.3 Inconnus / non affirmés

- Absence de certification, d'audit externe, d(pool de servers) et de Contracts clients nommés : **aucune affirmation n'est faite**.
- Les offres sont présentées comme des fonctionnalités techniques réelles, sans volume, sans client et sans garantie de performance chiffrée.

**Résultat de recherche globale** : aucune occurrence résiduelle de ces éléments dans le code public. Les seules occurrences historiques restantes se trouvaient dans l'ancienne version de ce rapport et dans `package-lock.json` (faux positifs par hachage, pas de contenu marketing).

## M. Abonnement / renouvellement

- Distinction abonnement logiciel / consommation telecom explicitée.
- Consommation de minutes et de messages distinguée du forfait.
- Recharge de solde traitée comme un service de prépaiement distinct.

## N. Séparation SaaS / Telecom / Wallet

- Trois natures de flux distingués dans les pages légales : abonnement plateforme, consommation de télécommunications, solde prépayé.
- Aucun bundling déguisé décrit comme inclus.

## O. SEO

### O.1 Correction critique appliquée cette passe

`proxy.ts` plaçait `/sitemap.xml` et `/robots.txt` **derrière le garde d'authentification**. Vérifié par requête réelle :

```
/sitemap.xml -> 307 (redirection vers /login)
/robots.txt -> 307 (redirection vers /login)
```

Les robots ne pouvaient pas lire ces fichiers : le référencement était cassé en production. Corrigé par ajout des deux chemins à la liste publique du proxy. Vérification après correction :

```
/sitemap.xml -> 200, Content-Type: application/xml
/robots.txt  -> 200, Content-Type: text/plain
Sitemap: https://softphone-xi.vercel.app/sitemap.xml
```

### O.2 Origine canonique

`NEXT_PUBLIC_SITE_URL` et `NEXT_PUBLIC_APP_URL` n'étaient **pas définies** dans l'environnement. `siteConfig.url` retombait sur `http://localhost:3000`, ce qui produisait des canonicals, des URLs OpenGraph et un sitemap pointant sur localhost. Corrigé : l'origine publique réelle est désormais la valeur de repli.

Vérifié après correction :

```
canonical   https://softphone-xi.vercel.app/
og:url      https://softphone-xi.vercel.app/
sitemap     13 URL, toutes en https://softphone-xi.vercel.app/...
```

Les autres surfaces SEO (canonical, `og:url`, sitemap, robots) utilisent des chemins relatifs résolus via `metadataBase`, donc plus aucun `localhost` n'est exposé publiquement. Les replis `localhost` restants sont dans des routes API backend (Stripe, Flutterwave, facturation) : hors périmètre.

### O.3 Cohérence de marque

`siteConfig.brand` vaut « Buster Call », mais plusieurs pages publiques et le manifeste PWA affichaient « Antigravity ». Toutes les pages publiques utilisent désormais `siteConfig.brand`. Le nom de marque est désormais modifiable en **un seul endroit**.

Point à trancher par le business : le nom commercial retenu. Le code est prêt pour l'un ou l'autre.

### O.4 Métadonnées

- `lang="fr"`, titles et descriptions FR, OpenGraph (`fr_FR`) et Twitter cards présents sur les pages publiques.
- Sitemap : 13 routes publiques, frequencies et priorities définies.
- Robots : `/dashboard`, `/god-mode`, `/onboarding`, `/buy-test`, `/api` exclus.

## P. Mobile

- Classes responsive présentes sur les grilles et sections landing.
- **Non vérifié** : rendu visuel réel aux breakpoints 1440 / 768 / 390 / 320. Aucune assertion de conformité responsive n'est faite dans ce rapport.

## Q. Accessibility

- Textes alternatifs sur les images de contenu.
- Arborescence et contrastes des sections landing cohérents.
- **Non vérifié** : audit automatisé complet, navigation clavier, lecteurs d'écran.

## R. Fichiers modifiés (cette passe)

- `lib/site-config.ts` — identité légale centralisée, origine canonique publique.
- `app/layout.tsx` — `metadataBase` dérivé de `siteConfig`.
- `proxy.ts` — déblocage de `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`.
- `public/manifest.webmanifest` — cohérence de marque.
- `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/refund-policy/page.tsx`, `app/contact/page.tsx`, `app/about/page.tsx`, `app/global-error.tsx` — marque centralisée.
- `app/sitemap.ts`, `app/robots.ts` — origine canonique.
- Pages marketing et composants landing : voir l'historique de la passe (claims, intégrations, secteurs, scénarios, pricing).

## S. tsc

```
npx tsc --noEmit
→ exit 0
→ 0 erreur
```

Le premier passage renvoyait 142 erreurs, **toutes** dans `.next/dev/types/validator.ts` et `.next/types/validator.ts` : il s'agissait de types de routes générés par Next, désynchronisés, dont un export manquant et un `ParamMap` résolu à `never`. Ces fichiers sont générés et ignorés par git (`.gitignore` : `/.next/`, non suivis). Après régénération, le type-check passe sans aucune erreur. Aucune erreur ne résidait dans le code applicatif.

## T. build

**Non vérifié de bout en bout — statut `NOT_READY` conservé.**

`npm run build` commence par `node scripts/migrate-deploy.mjs`, qui exécute `prisma migrate deploy`. Cet environnement n'atteint pas la base :

```
Error: P1001: Can't reach database server at `kgebwferveweznnuutxc.db.eu-central-1.nhost.run:5432`
[migrate] échec après plusieurs tentatives
```

Le build s'arrête donc **avant** la compilation Next.js, sur un prérequis d'infrastructure. Ce n'est pas un échec du code modifié.

Ce qui a été vérifié à la place, par compilation et rendu réels via le serveur de développement :

```
/                   200
/ia                 200
/receptionniste-ia  200
/integrations       200
/secteurs          200
/about             200
/contact           200
/etudes-de-cas      200
/terms             200
/privacy           200
/refund-policy     200
/acceptable-use    200
/sitemap.xml       200
/robots.txt        200
```

`/pricing` n'a pas pu être rendu localement : la page interroge la base de données, injoignable ici. Elle est forcée en rendu dynamique, type-checkée, et son contenu statique (libellés, audiences, FAQ, comparaison) a été relu en source. Elle reste à confirmer sur un environnement disposant de la base.

**À exécuter avant mise en production, dans un environnement ayant accès à la base : `npm run build`.**

## U. Points à valider business

### U.1 Identité légale — bloquant

Aucune des variables suivantes n'est renseignée dans le dépôt. Elles doivent provenir de l'éditeur, jamais être devinées.

| Champ | Variable | État |
|---|---|---|
| Raison sociale | `NEXT_PUBLIC_LEGAL_ENTITY` | MISSING |
| Nom commercial | `NEXT_PUBLIC_TRADE_NAME` | MISSING |
| Pays | `NEXT_PUBLIC_COMPANY_COUNTRY` | MISSING |
| Adresse du siège | `NEXT_PUBLIC_COMPANY_ADDRESS` | MISSING |
| Registre (RCS / RM) | `NEXT_PUBLIC_COMPANY_REGISTRY` | MISSING |
| TVA intracommunautaire | `NEXT_PUBLIC_VAT_ID` | MISSING |
| Téléphone support | `NEXT_PUBLIC_SUPPORT_PHONE` | MISSING |
| E-mail support | `NEXT_PUBLIC_SUPPORT_EMAIL` | MISSING |
| E-mail commercial | `NEXT_PUBLIC_SALES_EMAIL` | MISSING |
| E-mail facturation | `NEXT_PUBLIC_PAYMENT_EMAIL` | MISSING |
| E-mail juridique / DPO | `NEXT_PUBLIC_LEGAL_EMAIL` | MISSING |

Le code affiche honnêtement l'absence de ces informations. Tant qu'elles manquent, les pages légales ne sont pas publiables : raison sociale et coordonnées de contact sont des mentions légales obligatoires.

### U.2 Devise

USD est appliqué de façon cohérente. Une confirmation écrite est requise pour figer `PRICING_CURRENCY`.

### U.3 Marque

Arbitrer entre « Buster Call » (actuellement appliqué sur le site public) et « Antigravity » (utilisé dans le backend, les routes de facturation, l'onboarding, le `User-Agent` des webhooks et les données de seed). Le site public est prêt à basculer en modifiant `siteConfig.brand`.

### U.4 Périmètre des deux offres à 29 USD

Faire confirmer par le business que les deux offres doivent coexister avec des périmètres différents (CAS A), plutôt que d'en aligner une seule.

## V. Points nécessaires avant Paddle Live

Ces éléments sont **indépendants** du statut du site et ne sont pas traités ici.

1. Validation juridique des pages légales avec les informations réelles de l'éditeur (U.1).
2. Confirmation de la devise commerciale (U.2).
3. Arbitrage de marque (U.3).
4. Décision commerciale sur les deux offres à 29 USD (U.4).
5. Exécution et réussite de `npm run build` dans un environnement disposant de la base de données (§T).
6. Vérification visuelle responsive et audit d'accessibilité (P, Q).
7. Si et seulement si le business décide d'introduire Paddle : choix du modèle (Merchant of Record) et cohérence avec le backend de facturation existant. Rien n'est implémenté à ce stade.

---

## Conclusion

Le site public est **propre côté claims** et **techniquement cohérent** : les 13 pages publiques, le sitemap et le robots compiles et se rendent, le type-check passe sans erreur, la devise est homogène, l'identité légale est centralisée et les pages n'affirment rien qui ne soit pas démontré dans le code.

Deux défauts réels ont été trouvés et corrigés lors de cette passe : le **blocage des robots d'indexation par le proxy d'authentification** (`/sitemap.xml` et `/robots.txt` redirigeaient vers `/login`) et l'**origine canonique tombant sur localhost**.

Le statut reste néanmoins `PADDLE_SITE_READINESS = WAITING_BUSINESS_INFO`, pour une raison unique : **les mentions légales obligatoires de l'éditeur et la confirmation de la devise n'ont pas été fournies.** Aucune de ces informations n'a été inventée.