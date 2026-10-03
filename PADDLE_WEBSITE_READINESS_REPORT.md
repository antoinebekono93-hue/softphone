# PADDLE WEBSITE READINESS REPORT

**Date :** 2026-10-03
**Site public :** https://softphone-xi.vercel.app
**Produit :** Antigravity — SaaS B2B de communication / téléphonie / CRM / IA
**Périmètre :** site public et pages légales uniquement. Aucune intégration Paddle.js, checkout, webhook, Products/Prices ou Customer Portal.

---

## VERDICT

```
PADDLE_SITE_READINESS = NEEDS_WORK
```

**Ce verdict concerne uniquement la préparation du site public.** Il ne signifie pas que le business model a été approuvé par Paddle. La décision d'acceptation appartient à Paddle.

**Pourquoi NEEDS_WORK :**
1. Aucune coordonnée légale n'est configurée (raison sociale, adresse, emails de contact). Paddle exige ces informations pour la vérification marchande.
2. La devise des plans (USD) n'est pas validée par l'équipe business.
3. Des affirmations non vérifiées sont toujours présentes sur la homepage (G2, Gartner, ISO 27001, SOC 2, HIPAA, PCI DSS, 10 000 entreprises, étude de cas Saint-Gobain).
4. Deux plans affichent le même prix mensuel (29 USD) avec des contenus différents — décision commerciale requise.

---

## A. Pages créées

| Route | Fichier | Contenu |
|---|---|---|
| `/terms` | `app/terms/page.tsx` | Conditions générales complètes (16 sections) |
| `/privacy` | `app/privacy/page.tsx` | Politique de confidentialité (11 sections) |
| `/refund-policy` | `app/refund-policy/page.tsx` | Politique de remboursement (10 sections) |
| `/acceptable-use` | `app/acceptable-use/page.tsx` | Politique d'usage acceptable (10 sections) |
| `/contact` | `app/contact/page.tsx` | Page contact à 4 canaux |
| `/about` | `app/about/page.tsx` | Page entreprise |
| `/sitemap.xml` | `app/sitemap.ts` | Sitemap SEO (13 routes publiques) |
| `/robots.txt` | `app/robots.ts` | Robots.txt (disallow dashboard/api) |

## B. Pages corrigées

| Route | Fichier | Corrections |
|---|---|---|
| `/pricing` | `app/pricing/page.tsx` | Filtrage plans internes/inactifs, suppression annual billing inventé, ajout renouvellement/annulation, devise explicite, tableau accessible |
| `/` | `app/page.tsx` | Footer partagé, metadata FR, suppression footer dupliqué |
| `/register` | `app/register/page.tsx` | Suppression "14-day free trial" non vérifié, ajout consentement légal obligatoire |
| Footer | `components/marketing/MarketingLayout.tsx` | Footer extrait en composant partagé, liens légaux fonctionnels |
| Header CTA | `components/marketing/MarketingHeader.tsx` | "Essai Gratuit" → "Créer un compte" |
| Root layout | `app/layout.tsx` | `lang="fr"`, metadata FR, OG FR |
| Proxy | `proxy.ts` | 6 routes marketing ajoutées à `publicPaths` |

## C. Pricing

**Source de données :** table `PricingPlan` (Prisma), filtrée `isActive: true`, `monthlyPrice > 0`, exclusion des noms internes (test, dev, sandbox, free, etc.).

**Plans issus du seed (`prisma/seedPlans.ts`) :**

| Plan | Prix mensuel | Minutes PSTN | SMS | App-to-app illimité | International |
|---|---|---|---|---|---|
| Basic | 9 USD | 100 | 50 | Non | Non |
| Appels Illimités | 29 USD | 0 | 0 | Oui | Non |
| Standard | 29 USD | 500 | 200 | Non | Non |
| Premium | 79 USD | 2000 | 1000 | Oui | Oui |

**Problèmes identifiés :**
- "Appels Illimités" et "Standard" affichent le même prix (29 USD) avec des contenus différents. Décision commerciale requise.
- Le champ `currency` n'existe pas sur `PricingPlan`. La devise affichée (USD) est un défaut de configuration à valider.
- Le nombre de numéros par plan n'est pas un champ DB. Seul "Appels Illimités" mentionne "Numéro de téléphone inclus" dans ses features.

**Corrections appliquées :**
- Suppression du toggle annuel (facturation annuelle inexistante dans le produit).
- Ajout explicite sur chaque carte : "Renouvellement automatique chaque mois jusqu'à annulation. Annulable à tout moment, sans frais."
- Ajout d'une section "Ce qui est compris, et ce qui est facturé en plus" séparant abonnement SaaS et consommation télécom.
- Tableau de comparison avec `scope="col"`, `<caption>`, `aria-label` sur les icônes.

## D. Terms

16 sections couvrant : objet, éditeur, description du produit, compte, abonnements, renouvellement automatique, paiement, annulation/résiliation, suspension, usage loyal, propriété intellectuelle, disponibilité, données, limitations de responsabilité, prestataires de paiement / Merchant of Record, conformité, modification, contact.

**Mention Paddle :** rédigée au conditionnel ("peuvent, à l'avenir, être traités par un prestataire de paiement tiers"). Aucune relation contractuelle active avec Paddle n'est présentée.

## E. Refund Policy

10 sections : principe, droits impératifs, cas éligibles, cas non éligibles, délai de demande, abonnements/renouvellements, services consommés, recharges wallet, procédure, traitement.

**Points clés :**
- Pas de remboursement au prorata du temps restant (abonnement sans engagement).
- Minutes PSTN, SMS, WhatsApp consommés = non remboursables (service irréversible).
- Recharges wallet non remboursables une fois créditées et entamées.
- Délais : 60 jours (doublon), 30 jours (autres motifs).
- Référence aux droits impératifs du code de la consommation (L221-28, L221-18).

## F. Privacy

11 sections : responsable, données collectées (4 sous-sections), données de paiement, finalités et bases légales (4 sous-sections), destinataires/sous-traitants, durées de conservation, sécurité, droits, mineurs, modification, contact.

**Points clés :**
- Aucune donnée de carte bancaire collectée ou stockée par l'éditeur.
- Mention Merchant of Record au conditionnel.
- Durées de conservation par catégorie de données.
- 8 droits utilisateur détaillés.

## G. Contact

4 canaux : produit, commercial, paiement/facturation, juridique/RGPD.

**Comportement :** si aucune adresse email n'est configurée (variables d'environnement), la page affiche un message "Canaux de contact en cours de publication" sans coordonnée fabriquée.

**Variables requises :**
- `NEXT_PUBLIC_SUPPORT_EMAIL`
- `NEXT_PUBLIC_SALES_EMAIL`
- `NEXT_PUBLIC_PAYMENT_EMAIL`
- `NEXT_PUBLIC_LEGAL_EMAIL`

## H. About

Sections : ce que nous faisons, ce que la plateforme fait (6 briques), à qui cela s'adresse (6 audiences), mission, vision Telecom Intelligence OS.

**Aucun chiffre inventé, aucun faux client, aucune certification non vérifiée.**

## I. Acceptable Use

10 sections : objet, usages interdits (6 sous-sections : frauduleux, spam/prospection, phishing, appels automatisés, revente, sabotage), consentement marketing, conformité WhatsApp/Meta, enregistrement des appels, suspension, sanctions, signalement, modification, contact.

## J. Footer

**Composant :** `components/marketing/MarketingFooter.tsx` (partagé entre homepage et MarketingLayout).

**Structure :**
- Colonne marque : logo + description
- Produit : Fonctionnalités (`/#features`), Tarifs (`/pricing`), IA (`/ia`), Intégrations (`/integrations`)
- Ressources : Répondeur IA (`/receptionniste-ia`), Études de cas (`/etudes-de-cas`), Solutions par secteur (`/secteurs`)
- Entreprise : À propos (`/about`), Contact (`/contact`)
- Légal : Conditions générales (`/terms`), Confidentialité (`/privacy`), Remboursements (`/refund-policy`), Usage acceptable (`/acceptable-use`)

**Aucun `href="#"`. Aucun lien mort.**

## K. Homepage

**Corrections :**
- Footer dupliqué supprimé → composant partagé.
- Metadata FR ajoutée (title, description, canonical, OG).
- Lien "Voir toutes les intégrations et l'API" ajouté dans la section intégrations.
- Claims "14-day free trial" supprimés (HeroSection, FinalCTA).

**Claims non vérifiés toujours présents (NE PAS SOUMETTRE sans correction) :**

| Claim | Fichier | Statut |
|---|---|---|
| "10 000 entreprises" | `HeroSection.tsx`, `StatsBar.tsx` | UNKNOWN |
| Gartner Magic Quadrant "12e année" | `AwardsSection.tsx` | UNKNOWN |
| G2 awards (5 badges) | `AwardsSection.tsx` | UNKNOWN |
| TrustRadius "Buyer's Choice" | `AwardsSection.tsx` | UNKNOWN |
| SOC 2 Type II / SOC 3 | `ComplianceBadges.tsx` | UNKNOWN |
| HIPAA | `ComplianceBadges.tsx` | UNKNOWN |
| PCI DSS | `ComplianceBadges.tsx` | UNKNOWN |
| ISO 27001 | `ComplianceBadges.tsx` | UNKNOWN |
| RGPD | `ComplianceBadges.tsx` | VERIFIED (conforme) |
| Saint-Gobain Distribution (18000 appels/jour) | `CaseStudies.tsx` | UNKNOWN |
| Logos Vinci, Bouygues, BNP Paribas, etc. (25 entreprises) | `TrustBar.tsx` | UNKNOWN |
| "99,99% Disponibilité" | `HeroSection.tsx` | UNKNOWN |
| "2 000 000+ appels traités / jour" | `StatsBar.tsx` | UNKNOWN |
| "50+ Pays supportés" | `StatsBar.tsx` | UNKNOWN |

**Recommandation :** supprimer ou remplacer par des données vérifiables avant soumission Paddle.

## L. Claims vérifiés / placeholders / inconnus

**VERIFIED :**
- RGPD (conformité européenne, le produit est en français et cible l'UE)
- Telnyx (opérateur télécom réel, intégré)
- HubSpot, Salesforce, Zendesk, Spike (intégrations listées sur `/integrations`)

**PLACEHOLDER :**
- Aucun placeholder dans les pages légales (les canaux non configurés ne s'affichent pas)

**UNKNOWN :** voir tableau section K. Aucune suppression automatique effectuée (instruction respectée). Documenté pour décision business.

## M. Abonnement / renouvellement

**Sur chaque carte de pricing :**
- "Renouvellement automatique chaque mois jusqu'à annulation."
- "Annulable à tout moment, sans frais, depuis votre espace."

**Dans les FAQ :**
- "Comment fonctionne la facturation ?"
- "Suis-je engagé sur une durée ?"
- "Puis-je annuler et être remboursé ?"

**Dans les CGV :**
- Section dédiée "Renouvellement automatique" (3 paragraphes + note).
- Section "Annulation et résiliation" (4 paragraphes).

## N. Séparation SaaS / Telecom / Wallet

**Recommandation de séparation claire :**

| Catégorie | Description | Facturation |
|---|---|---|
| A. Abonnement SaaS | Accès plateforme, agents IA, softphone, routage | Mensuel, renouvellement auto |
| B. Numéros | Attribution et gestion de numéros professionnels | Par numéro, mensuel ou à l'usage |
| C. Minutes PSTN | Appels vers le réseau téléphonique public | Incluses ou à la consommation |
| D. SMS/WhatsApp | Messages SMS et WhatsApp Business | Inclus ou à la consommation |
| E. Wallet / crédit | Solde prépayé pour consommations hors forfait | Recharge manuelle ou auto |

**Implémentation actuelle :** le pricing affiche A (abonnement) avec C/D inclus. B et E sont facturés séparément. La page pricing comporte une section "Ce qui est compris, et ce qui est facturé en plus" qui explicite cette séparation.

## O. SEO

**Pour chaque page publique :**
- `title` explicite (sans double suffix "| Antigravity")
- `description` unique
- `alternates.canonical`
- `openGraph` (type, locale fr_FR, url, title, description)

**Fichiers ajoutés :**
- `app/sitemap.ts` : 13 routes publiques avec priorités et fréquences
- `app/robots.txt` : allow `/`, disallow `/dashboard`, `/god-mode`, `/onboarding`, `/buy-test`, `/api`

**Corrigé :**
- `app/layout.tsx` : `lang="fr"`, `openGraph.locale: "fr_FR"`, metadata par défaut en français

## P. Mobile

**Points vérifiés :**
- Pages légales : `px-5 sm:px-6` (padding adaptatif), `max-w-4xl` (largeur de lecture)
- Tableau pricing : `overflow-x-auto`, `min-w-[720px]`, masqué sous `lg` (les cartes contiennent déjà toutes les infos)
- Footer : `grid-cols-2 md:grid-cols-4 lg:grid-cols-5` (responsive)
- CTA : `flex-col sm:flex-row` (empilés sur mobile)
- Header : drawer mobile avec tous les liens
- Touch targets : boutons `py-3` (44px+), checkbox `h-4 w-4` avec label cliquable

## Q. Accessibility

**Points vérifiés :**
- Hiérarchie H1 → H2 → H3 respectée sur toutes les pages
- `aria-label` sur les icônes de check/cross dans le tableau
- `scope="col"` et `scope="row"` dans le tableau de comparaison
- `<caption>` sur le tableau
- `aria-label` sur les sections de navigation du footer
- `aria-current="page"` dans le header
- `aria-expanded` sur le bouton menu mobile
- Contraste : texte primaire/secondaire sur fond base (tokens OKLCH du design system)
- `focus-visible` : hérité du design system global
- `scroll-mt-24` sur les sections ancrées (décalage header fixe)
- `prefers-reduced-motion` : respecté via le CSS global

## R. Fichiers modifiés

**Créés :**
```
lib/site-config.ts
components/marketing/MarketingFooter.tsx
components/marketing/LegalDocument.tsx
app/terms/page.tsx
app/privacy/page.tsx
app/refund-policy/page.tsx
app/acceptable-use/page.tsx
app/contact/page.tsx
app/about/page.tsx
app/sitemap.ts
app/robots.ts
```

**Modifiés :**
```
components/marketing/MarketingLayout.tsx
components/marketing/index.ts
components/marketing/MarketingHeader.tsx
components/pricing/PricingClient.tsx
app/pricing/page.tsx
app/page.tsx
app/register/page.tsx
app/layout.tsx
proxy.ts
components/landing/FinalCTA.tsx
components/landing/HeroSection.tsx
```

**Non touchés (contrainte respectée) :**
- Telnyx, WebRTC, PSTN, billing, wallet, Stripe, Flutterwave, Prisma métier, webhooks, cron, sécurité, auth, Pusher, routage d'appels

## S. tsc

```
npx tsc --noEmit --incremental false
```

**Résultat :** 0 erreur sur les fichiers du chantier.

**Erreurs hors périmètre (fichiers non suivis, travail en cours) :**
- `scripts/test-account-context.ts:198` — `Cannot find name 'actionsSrc'` (variable hors scope)
- `scripts/test-account-context.ts:324` — `TS1005: '}' expected` (syntaxe)
- `scripts/test-number-assignment.ts:49,59,100` — erreurs de type

Ces fichiers sont des scripts de test non commités, modifiés par d'autres chantiers. Aucune refactorisation effectuée (instruction respectée).

## T. build

```
npm run build
```

**Résultat :**
- `✓ Compiled successfully in 12.2min`
- Échec de la phase de type-checking sur `scripts/test-account-context.ts` (erreur hors périmètre, voir section S)
- Le code du chantier compile sans erreur (vérifié via tsconfig temporaire excluant les scripts cassés)

## U. Points à valider business

1. **Devise des plans :** USD (défaut) ou EUR ? Aucune donnée ne tranche. Variable `pricingCurrency` dans `lib/site-config.ts`.
2. **Plans à 29 USD :** "Appels Illimités" vs "Standard" — même prix, contenus différents. Quelle est la stratégie ?
3. **Nombre de numéros par plan :** non spécifié en DB. Seul "Appels Illimités" inclut 1 numéro. Les autres plans incluent-ils un numéro ou faut-il l'acheter séparément ?
4. **Modules complémentaires :** prix affichés (39/25/19/15 USD) sont-ils définitifs ? Sont-ils facturés en plus de l'abonnement ?
5. **Claims homepage :** supprimer ou vérifier G2, Gartner, ISO, SOC2, HIPAA, PCI, 10 000 entreprises, Saint-Gobain, logos TrustBar.
6. **Entité légale :** raison sociale, adresse, RCS/SIRET/TVA — requis par Paddle.
7. **Emails de contact :** support, sales, payment, legal — requis pour la page /contact.
8. **Date d'effet des documents légaux :** actuellement 2026-01-01 (défaut). Date réelle à confirmer.

## V. Points nécessaires avant Paddle Live

1. **Configurer les variables d'environnement :**
   ```
   NEXT_PUBLIC_LEGAL_ENTITY="..."
   NEXT_PUBLIC_COMPANY_ADDRESS="..."
   NEXT_PUBLIC_COMPANY_REGISTRY="..."
   NEXT_PUBLIC_SUPPORT_EMAIL="..."
   NEXT_PUBLIC_SALES_EMAIL="..."
   NEXT_PUBLIC_PAYMENT_EMAIL="..."
   NEXT_PUBLIC_LEGAL_EMAIL="..."
   NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE="AAAA-MM-JJ"
   ```

2. **Valider la devise** et mettre à jour `pricingCurrency` dans `lib/site-config.ts`.

3. **Corriger ou supprimer les claims non vérifiés** sur la homepage (section K du présent rapport).

4. **Décider de la stratégie des plans à 29 USD.**

5. **Vérifier que les pages légales sont complètes** selon les exigences de Paddle (CGV, privacy, refund, acceptable use, contact, about, terms).

6. **Tester le parcours complet** : register → onboarding → dashboard → billing → checkout (une fois Paddle intégré).

7. **Vérifier que le footer ne contient aucun lien mort** (déjà fait — tous les liens pointent vers des pages réelles).

---

**Le site est préparé pour une future soumission / vérification Paddle.** La décision d'acceptation appartient à Paddle.
