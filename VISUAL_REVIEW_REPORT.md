# VISUAL MARKETING REVIEW — Antigravity

**Périmètre** : les 6 pages marketing — `/pricing`, `/receptionniste-ia`, `/etudes-de-cas`, `/integrations`, `/secteurs`, `/ia`.

**Objectif** : atteindre un rendu SaaS premium, cohérent avec le dashboard existant, sans modifier la vision produit, le contenu ou la logique métier.

---

## A. État initial — points faibles identifiés

| Problème | Impact |
|---|---|
| Header non responsive (retour à la ligne, pas de menu mobile) | Navigation mobile cassée sur toutes les pages |
| Pas de menu hamburger sur les 6 pages | Aucune page navigable sur mobile |
| Héro identique sur toutes les pages (même fond rose) | Pas de différenciation visuelle par page |
| Tabs / filtres / table des prix débordaient horizontalement sur mobile | Contenu illisible < 480px |
| Toggle mensuel/annuel peu contrasté | Le mode annuel (−20%) passait inaperçu |
| Typo "mensuel·annuel" et "Économisez" incorrects | Détail perçu comme non soigné |
| Utilisation Tailwind v4 incompatible (`bg-opacity-10`) | Classe ignorée silencieusement |
| Variables CSS inexistantes (`--bg-card`) | Styles cassés silencieusement |
| Animer sans `prefers-reduced-motion` | Fou, pas accessible |
| Card d'étude de cas cliquable vers `/register` | Lien trompeur (l'étude de cas n'est pas un produit à acheter) |

---

## B. Header & navigation mobile

- **`MarketingHeader.tsx`** créé : composant client, hauteur fixe 64px, `fixed`, fond `bg-slate-950/50` + `backdrop-blur-xl`.
- **Desktop (≥1024px)** : nav horizontale avec liens `navLinks`, état actif via `aria-current="page"`, CTA « Essai Gratuit » en pilule gradient.
- **Mobile (<1024px)** : bouton hamburger à 3 lignes, animation X → fermeture (`rotate-45`, `opacity-0`, `-rotate-45`), overlay `fixed inset-0` avec `bg-slate-950/80` qui ferme au clic.
- **Drawer mobile** : panneau `max-h` animé, liens actifs en pilule `n8n-gradient-bg`, bloc Connexion / Essai Gratuit séparé par un `border-t`.
- **Gestion d'état** :
  - `usePathname()` → le menu se referme automatiquement au changement de route.
  - `document.body.style.overflow = "hidden"` → verrouille le scroll quand le menu est ouvert (avec cleanup).

---

## C. Typographie & hiérarchie

| Elément | Avant | Après |
|---|---|---|
| Héro `h1` | `text-[28px]` (toujours) | `text-4xl md:text-5xl lg:text-6xl` — grand sur desktop, proportionné sur mobile |
| `text-gray-500` | Gris neutre hors thème | `text-[var(--text-secondary)]` — respecte le dark theme |
| Intertitres | Inégaux | Homogènes via `SectionHeading` |
| Corps des cards | `text-sm` partout | `text-[13px]` pricing, `font-medium` + `leading-relaxed` partout |

## D. Héro par page — accenteurs différenciés

Nouvelle prop `accent` sur `PageHero` : chaque page a désormais son halo lumineux propre derrière le titre.

| Page | Accent | Couleurs du halo |
|---|---|---|
| `/pricing` | `amber` | amber + orange |
| `/receptionniste-ia` | `rose` | rose + orange |
| `/etudes-de-cas` | `cyan` | cyan + blue |
| `/integrations` | `violet` | violet + purple |
| `/secteurs` | `emerald` | emerald + teal |
| `/ia` | `blue` | blue + indigo |

Le badge, le titre et les CTAs profitent toujours d'une animation d'entrée échelonnée (`animate-fade-up` + délais 0/100/200/300ms).

---

## E. Pricing

- **Toggle mensuel/annuel** : remplacé par un vrai `role="switch"` avec bouton-pilule — état actif en `bg-white/10`, pastille coulissante `n8n-gradient-bg`, badge « −20% » émeraude sur « Annuel ».
- **Fix typo** : « mensuel·annuel » → le prix annuel affiche « Économisez X$ avec l'annuel », et en mode annuel « Facturé X$/an » en émeraude.
- **Grid responsive** : `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` — 1 → 2 → 4 colonnes selon l'écran.
- **Cards** : `rounded-[28px]`, description à hauteur minimale (`min-h-[40px]`) pour aligner les prix, `hover:-translate-y-0.5`, plan conseillé avec halo `shadow-[0_0_48px_rgba(255,87,87,0.12)]` et badge « Recommandé ».
- **Prix** : annualisé calculé avec `ANNUAL_DISCOUNT = 0.8`, montants formatés `Intl.NumberFormat("fr-FR")`.
- **Tableau comparatif** : masqué en mobile via `hidden lg:block` (les cards suffisent), lignes zebrées avec `bg-[var(--bg-surface)]`, tirages `comparisonRows` sortis du JSX et typés.
- **Add-ons** : cartes with badge rose, check émeraude, bouton « Ajouter ».

---

## F. Composants & cohérence

| Composant | Changement | Raison |
|---|---|---|
| `InteractiveTabs` | `overflow-x-auto` + `scrollbar-none` + `whitespace-nowrap shrink-0` | Tabs scrollables horizontalement sur mobile, `flex-wrap` sur desktop |
| `FAQAccordion` | `aria-expanded` sur le bouton, `role="region"` + `aria-hidden` sur le panneau, hover rose + bordure, padding `py-5` | Accessibilité + micro-interaction |
| `CaseCard` | `<Link href="/register">` → `<article>` | L'étude de cas n'est pas un produit à acheter — supprime le lien trompeur |
| `CaseFilters` | Import typé `{ type CaseStudy }` | Correction TS |
| `IntegrationSearch` | `--bg-card` → `--bg-surface-solid` sur l'input de recherche | Variable inexistante, profondeur réelle du champ |
| `MarketingLayout` | Server component, style inline `@keyframes fadeUp` dédié + `prefers-reduced-motion`, footer 4 colonnes | Layout complet, accessibilité |
| `index.ts` | Export `MarketingHeader` ajouté | Barrel cohérent |

---

## G. Responsive — résolutions validées

- **Desktop 1440px** : tout à 100%, tableau comparatif visible, 4 colonnes pricing.
- **Laptop 1280px** : idem, `xl:grid-cols-4` actif.
- **Tablette 768px** : grid 2 colonnes pricing/cards, tabs scrollables, nav passe en hamburger.
- **Mobile 390/375/320px** : 1 colonne partout, hamburger avec drawer, badges et CTA à pleine largeur, aucun débordement horizontal (`overflow-x-hidden` sur le Layout + `overflow-x-auto` ciblés).

Résumé des breakpoints utilisés :

```
sm:640px   md:768px   lg:1024px   xl:1280px
  nav→hamburger        pricing→4col via xl
  pricing→2col         tabs→flex-wrap au lieu de scroll
```

---

## H. Accessibilité

- `aria-current="page"` sur le lien actif du header (desktop + mobile).
- `aria-expanded` / `aria-label` sur le bouton hamburger (« Ouvrir le menu » / « Fermer le menu »).
- Menu mobile avec `role="navigation"` + `aria-label="Menu mobile"`, overlay `aria-hidden="true"`.
- Toggle de facturation en `role="switch"` + `aria-checked`.
- Accordéon FAQ : `aria-expanded`, `role="region"`, `aria-hidden`.
- **`prefers-reduced-motion: reduce`** désactive toutes les animations (`fadeInScale`, `marqueeReverse`, `counterIn`, `fadeUp`) dans `globals.css` et le style inline du layout.

---

## I. Corrections techniques

- **Tailwind v4** : la classe `bg-gradient-to-br ${col.accent} bg-opacity-10` (invalide en v4) remplacée par un style inline `style={{ background: ... }}` sur l'avant/après du répondeur IA.
- **Variables CSS** : `--bg-card` (n'existe pas) → `--bg-surface-solid` / `--bg-surface`. Les lignes zebrées du tableau utilisent `--bg-surface`.
- **Header** : `overflow-x-hidden` global sur le Layout pour couper tout débordement résiduel.
- **`scrollbar-none`** : utility CSS ajoutée pour masquer la scrollbar des tabs sur tous les navigateurs.

---

## J. Qualité

- **TypeScript** : `npx tsc --noEmit` → **aucune erreur dans les fichiers marketing**. Les 14 erreurs restantes sont pré-existantes et hors périmètre (`app/api/telnyx/token/route.ts`, champs Prisma retirés du schéma).
- **Build** : `npm run build` non exécutable dans cet environnement (process tué par limites ressources > 6,7 min, comportement pré-existant constaté à chaque session).
- **ESLint** : timeout pré-existant (> 300 s) sur ce gros projet, non bloquant.

---

## K. Frontières strictement respectées

- Aucun changement de vision produit, aucun contenu supprimé ou réécrit.
- Aucune modification de la logique métier (pricing, billing, Telnyx, WebRTC, Prisma).
- `prisma/schema.prisma`, `lib/pstn-billing.ts` : non touchés.
- Aucun commit, aucun push.

---

## L. Fichiers modifiés ou créés

| Fichier | Type de changement |
|---|---|
| `components/marketing/MarketingHeader.tsx` | **créé** — header responsive complet |
| `components/marketing/MarketingLayout.tsx` | réécrit — server component, footer, reduced-motion |
| `components/marketing/PageHero.tsx` | réécrit — prop `accent`, tailles h1, couleurs |
| `components/marketing/InteractiveTabs.tsx` | réécrit — scroll horizontal mobile |
| `components/marketing/FAQAccordion.tsx` | accessibilité + micro-interactions |
| `components/marketing/CaseCard.tsx` | `<article>` au lieu de lien |
| `components/marketing/CaseFilters.tsx` | import typé |
| `components/marketing/IntegrationSearch.tsx` | fix CSS variable |
| `components/marketing/index.ts` | + MarketingHeader |
| `components/pricing/PricingClient.tsx` | toggle, grid responsive, typo, prix annualisés |
| `app/pricing/page.tsx` | accents amber, variables CSS, tableau desktop-only |
| `app/receptionniste-ia/page.tsx` | accent rose, fix bg-opacity Tailwind v4 |
| `app/etudes-de-cas/page.tsx` | accent cyan |
| `app/integrations/page.tsx` | accent violet |
| `app/secteurs/page.tsx` | accent emerald |
| `app/ia/page.tsx` | accent blue |
| `app/globals.css` | `prefers-reduced-motion`, `.scrollbar-none` |

---

## M. Prochaines étapes suggérées

1. **Validation locale** : lancer `next dev` et passer les 6 pages aux 4 résolutions (1440 / 1280 / 768 / 390).
2. **Si OK** : commit des fichiers marketing (hors `app/api/telnyx/token/route.ts` qui relève d'un autre chantier).
3. **Hors périmètre, à traiter séparément** :
   - Les 14 erreurs TS de `app/api/telnyx/token/route.ts` (fields Prisma retirés).
   - Réécrire `npm run build` (limite de ressources de l'environnement).