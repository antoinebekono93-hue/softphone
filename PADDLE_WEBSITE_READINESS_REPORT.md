# PADDLE WEBSITE READINESS REPORT

**Site** : https://softphone-xi.vercel.app (origine technique temporaire — le domaine Buster Call définitif la remplacera)
**Dépôt** : `C:\Users\Antoine\3D Objects\github\2`
**Périmètre** : site public de marketing uniquement (pages publiques, metadata, SEO, claims, identité légale, pricing). Aucun changement sur Telnyx, WebRTC, routage d'appels, wallet, facturation backend ou authentification. Aucun code Paddle.

---

## VERDICT

| Champ | Valeur |
|---|---|
| `BRAND` | **BUSTER_CALL** |
| `BRAND_IDENTITY_READINESS` | **READY** |
| `BUSINESS_CONTACT_READINESS` | **READY** |
| `LEGAL_ENTITY_NAME_READINESS` | **READY** |
| `LEGAL_ADDRESS_READINESS` | **READY** |
| `SUPPORT_CONTACT_READINESS` | **READY** |
| `RCCM_READINESS` | **WAITING_USER** |
| `TAX_ID_READINESS` | **WAITING_USER** |
| `LEGAL_EMAIL_READINESS` | **OPTIONAL_OR_WAITING_USER** |
| `SALES_EMAIL_READINESS` | **OPTIONAL_OR_WAITING_USER** |
| `BILLING_EMAIL_READINESS` | **OPTIONAL_OR_WAITING_USER** |
| `LEGAL_IDENTITY_READINESS` | **PARTIAL** |
| `CLAIMS_READINESS` | **READY** |
| `PRICING_CURRENCY` | **USD** |
| `CURRENCY_BUSINESS_VALIDATION` | **CONFIRMED** |
| `PRICING_PLAN_CONFLICTS` | **NONE** |
| `TECHNICAL_WEBSITE_READINESS` | **NOT_READY** |
| `TYPESCRIPT` | **PASS** (`npx tsc --noEmit` → exit 0, 0 erreur) |
| `BUILD` | **BLOCKED_BY_ENVIRONMENT** |
| `PADDLE_SITE_READINESS` | **WAITING_LEGAL_REGISTRATION** |

---

## BUSINESS_IDENTITY

| Champ | Valeur |
|---|---|
| Legal/operator name | **MERCO** |
| Brand | **Buster Call** |
| Country | **Cameroun** (Cameroon) |
| Address | **Kamkop 1** |
| City | **Bafoussam** |
| Support email | **antoinebekono93@gmail.com** |
| Business phone | **+237 698 105 696** |
| Registration number (RCCM) | **NOT_AVAILABLE** |
| Tax ID (NIU) | **NOT_AVAILABLE** |
| Sales email | **NOT_AVAILABLE** |
| Billing email | **NOT_AVAILABLE** |
| Legal email | **NOT_AVAILABLE** |

Aucune forme juridique (SARL / SAS / LTD / Inc. / LLC) n'est écrite, car elle n'a pas été fournie : le nom est rendu simplement « MERCO ». Formulation publique utilisée : « Buster Call est une marque exploitée par MERCO, basée à Kamkop 1, Bafoussam, Cameroun. »

---

## A. Brand

- `BRAND = BUSTER_CALL`. `siteConfig.brand = "Buster Call"` est l'unique source de vérité.
- « Antigravity », « Softphone Xi » et « Softphone-Xi » ne sont réintroduits nulle part comme nom produit visible.
- Le mot générique « softphone » reste utilisé uniquement comme terme descriptif/SEO.
- `node scripts/check-branding.js` → `PUBLIC_ANTIGRAVITY_OCCURRENCES = 0`, `PUBLIC_SOFTPHONE_BRAND_OCCURRENCES = 0`, `PUBLIC_TELNYX_BRAND_OCCURRENCES = 0`.

## B. Legal / operator name

- **MERCO**, écrit sans suffixe de forme juridique. Centralisé dans `siteConfig.legalEntity`.

## C. Address

- **Kamkop 1**, **Bafoussam**, **Cameroun**. Centralisé dans `siteConfig.companyAddress`, `siteConfig.city`, `siteConfig.country`.

## D. Country

- **Cameroun** (valeur française affichée sur un site francophone).

## E. Support email

- **antoinebekono93@gmail.com** (`siteConfig.supportEmail`).
- Cet email n'est **pas** réutilisé comme email commercial, facturation ou juridique : ces canaux restent désactivés tant qu'aucune adresse dédiée n'existe.

## F. Phone

- **+237 698 105 696** (`siteConfig.supportPhone`).

## G. Missing registration fields

| Champ | État | Traitement public |
|---|---|---|
| RCCM / immatriculation | NOT_AVAILABLE | Omis, aucun placeholder |
| NIU / identifiant fiscal | NOT_AVAILABLE | Omis, aucun placeholder |
| TVA | NOT_AVAILABLE | Omis, aucun placeholder |
| Email commercial | NOT_AVAILABLE | Canal désactivé |
| Email facturation | NOT_AVAILABLE | Canal désactivé |
| Email juridique | NOT_AVAILABLE | Canal désactivé |

Aucune valeur fictive (RCCM, NIU, TVA, RCS, RM, forme juridique, email) n'a été générée. `missingLegalIdentityFields` reste **interne** : les pages publiques omettent un champ vide au lieu d'afficher « RCCM à venir » ou « NIU manquant ».

## H. Currency

- `PRICING_CURRENCY = USD`, `CURRENCY_BUSINESS_VALIDATION = CONFIRMED`.
- Aucune occurrence de `€` / `EUR` / `FCFA` / `XOF` sur les surfaces publiques de pricing (vérifié par recherche).

## I. Pricing

- `PRICING_PLAN_CONFLICTS = NONE` : les deux offres à 29 USD restent distinctes (CAS A), l'une orientée appels internes app-to-app, l'autre PSTN/SMS.
- Aucun prix ni plan modifié lors de cette passe.
- Vérification fonctionnelle de la route `/pricing` toujours à faire dans un environnement DB (voir §Q).

## J. Canonical domain

- Origine publique réelle : **https://softphone-xi.vercel.app** (temporaire).
- `PUBLIC_ORIGIN` a un fallback https ; aucun `localhost` exposé dans canonical / `og:url` / sitemap / structured data.
- Aucun domaine `bustercall.*` inventé comme origine fonctionnelle. Le futur domaine Buster Call remplacera `NEXT_PUBLIC_SITE_URL`, `APP_URL` et l'origine canonique.

## K. Sitemap

- `/sitemap.xml` → public, HTTP 200, `application/xml`, 13 URL publiques avec l'origine réelle.

## L. Robots

- `/robots.txt` → public, HTTP 200, `text/plain`, `Sitemap: https://softphone-xi.vercel.app/sitemap.xml`, exclusion de `/dashboard`, `/god-mode`, `/onboarding`, `/buy-test`, `/api`.
- Protection anti-régression ajoutée : `scripts/check-public-seo-routes.js` (`npm run check:seo`) vérifie en statique que `/sitemap.xml`, `/robots.txt` et `/manifest.json` restent hors de l'auth, qu'aucun `localhost` ne fuit et qu'un fallback https existe ; en mode `--url`, il fait aussi le contrôle HTTP live.

## M. Claims

- `CLAIMS_READINESS = READY`. Aucune certification (ISO, SOC2, HIPAA, PCI), aucun analyste (Gartner, G2), aucun logo client, aucun témoignage et aucune statistique de volumétrie sur les pages publiques rendues.
- Règle : toute affirmation sans preuve dans le dépôt est retirée ou rendue générique.

## N. Branding check

```
node scripts/check-branding.js
Files checked: 54 — Violations found: 0
PUBLIC_ANTIGRAVITY_OCCURRENCES = 0
PUBLIC_SOFTPHONE_BRAND_OCCURRENCES = 0
PUBLIC_TELNYX_BRAND_OCCURRENCES = 0
BUSTER_CALL_BRANDING = READY
```

## O. TypeScript

```
npx tsc --noEmit
→ exit 0
→ 0 erreur
```

Les erreurs précédentes étaient soit dans des types générés Next (`.next/**/types/validator.ts`, cache stale) soit dues à un client Prisma non régénéré (`PushSubscription` présent dans `schema.prisma` mais absent du client généré). Après `npx prisma generate`, plus aucune erreur.

## P. Build

```
npm run build
→ prisma migrate deploy : OK cette passe (11 migrations, "No pending migrations")
→ next build : échec de compilation UNIQUEMENT sur next/font/google
   getaddrinfo ENOTFOUND fonts.googleapis.com
   `next/font` error: Failed to fetch `Inter` from Google Fonts.
   `next/font` error: Failed to fetch `JetBrains Mono` from Google Fonts.
   Build failed because of webpack errors
```

`BUILD = BLOCKED_BY_ENVIRONMENT`. La base a été joignable cette fois, les migrations ont été appliquées et la compilation Next a démarré : l'échec est un blocage réseau de l'environnement (Google Fonts inaccessible), pas une erreur de code ni de TypeScript. Aucune logique de build/migration n'a été modifiée et aucune sécurité DB n'a été contournée. `BUILD = PASS` ne sera déclaré qu'après un `npm run build` réellement terminé avec exit 0 (cas normal sur Vercel, où Google Fonts est accessible).

## Q. Pricing route verification

- `/pricing` n'a pas pu être rendue lors des contrôles locaux précédents (accès DB). La base est de nouveau joignable (migrations OK cette passe) mais la route n'a pas été re-testée en HTTP dans cette passe.
- Elle reste `force-dynamic`, type-checkée, et son contenu statique (libellés, audiences, FAQ, comparaison, devise USD) a été relu en source.
- **À valider en environnement DB** : rendu HTTP 200 et affichage correct des deux offres à 29 USD.

## R. Paddle readiness

- `PADDLE_SITE_READINESS = WAITING_LEGAL_REGISTRATION`.
- Aucun code Paddle (Checkout, API, webhooks, SDK, backend billing) n'a été ajouté. Ce chantier est strictement website / business identity / legal / pricing-public compliance.
- Blocages restants avant de déclarer READY : RCCM / immatriculation non fournis, NIU / tax ID non fournis, build complet non confirmé, `/pricing` non vérifiée en environnement DB.
- Si et seulement si le business décide d'introduire Paddle : choix du modèle Merchant of Record et cohérence avec le backend de facturation existant. Rien n'est implémenté.

## S. Files modified

Cette passe :
- `lib/site-config.ts` — identité réelle confirmée (MERCO / Buster Call / Cameroun / Kamkop 1 / Bafoussam / support email / téléphone), adresse multi-lignes, `publisherStatement`, séparation des emails, champs RCCM/NIU laissés vides.
- `components/marketing/LegalDocument.tsx` — `LegalIdentity` affiche l'identité réelle et omet les champs vides.
- `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/acceptable-use/page.tsx` — l'éditeur est désormais MERCO (et non Buster Call) ; mention « exploitée par MERCO ».
- `scripts/check-public-seo-routes.js` — nouveau garde anti-régression SEO.
- `package.json` — scripts `check:branding` et `check:seo`.
- `PADDLE_WEBSITE_READINESS_REPORT.md` — mis à jour.

Passe précédente (toujours effective) :
- `app/about/page.tsx`, `app/contact/page.tsx`, `app/refund-policy/page.tsx`, `app/layout.tsx`, `app/global-error.tsx`, `app/sitemap.ts`, `app/robots.ts`, `proxy.ts`, `components/landing/*`, `components/marketing/*`.
- `AUDIT_REPORT.md` — restauré byte-exact (tracked dans HEAD), non supprimé.

---

## Conclusion

Le site présente désormais honnêtement **Buster Call, opéré par MERCO, basé à Kamkop 1, Bafoussam, Cameroun**, avec un support réel (antoinebekono93@gmail.com, +237 698 105 696), sans inventer de société immatriculée, de RCCM, de NIU, d'email, de certification, ni de build validé.

L'identité principale (marque, opérateur, adresse, contact) est complète et prête. Le statut reste `PADDLE_SITE_READINESS = WAITING_LEGAL_REGISTRATION` pour deux raisons factuelles : le RCCM et le NIU ne sont pas disponibles, et le build complet n'a pas encore terminé avec exit 0 dans un environnement disposant de la DB et de l'accès Google Fonts.
