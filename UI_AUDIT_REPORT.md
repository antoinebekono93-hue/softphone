# UI/UX AUDIT REPORT — Antigravity

**Périmètre :** Frontend complet (`app/` + `components/`), hors `app/api/`, `lib/`, `prisma/`, `server/`, `scripts/`.
**Méthode :** inspection statique (lecture + comptage via ripgrep), sans aucune modification de code.
**Date :** Septembre 2026
**Objet :** marché du chantier DESIGN SYSTEM / UI/UX. Livrable Phase A. Aucun code modifié.

---

## 1. Vue d'ensemble

| Indicateur | Valeur |
|---|---|
| Pages (fichiers `page.tsx`) | **83** |
| Routes dynamiques `[slug]` | **8** |
| Layouts racine | **5** (`app/layout.tsx`, `dashboard/layout.tsx`, `god-mode/layout.tsx`, `onboarding/layout.tsx`, `dashboard/messages/layout.tsx`) |
| Composants dans `components/` | **50** fichiers `.tsx` (dont 7 primitives `ui/`, 2 providers) |
| Framework | Next.js 16 App Router, React 19, Tailwind CSS v4 (config 100% CSS) |
| Lib d'icônes | `lucide-react` |
| Libs de toast en parallèle | `sonner` (12 fichiers) **+** `react-hot-toast` (10 fichiers) |
| Tokens CSS maison | `:root` + `[data-theme="dark"]` dans `app/globals.css`, utilisés ~**1 681** fois via `var(...)` |
| Classes palette brute (sans token) | **~1 910** |
| Classes shadcn héritées SANS définition | **99** |

---

## 2. Cartographie par zone

### 2.1 Marketing public (7 pages)
Layui : aucune `layout.tsx` marketing dédiée ; chaque page importe `MarketingLayout` + `MarketingHeader`.

| Route | Fichier | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Landing : HeroSection, TrustBar, ProductTabs, ProductShowcase, StatsBar, CaseStudies, AwardsSection, IndustrySolutions, ComplianceBadges, ThoughtLeadership, FinalCTA. Header = `MarketingHeader`. |
| `/pricing` | `app/pricing/page.tsx` | `PricingClient`, toggle mensuel/annuel inline dans le composant. |
| `/receptionniste-ia` | `app/receptionniste-ia/page.tsx` | Showcase avant/après, 9 `rounded-[px]`. |
| `/etudes-de-cas` | `app/etudes-de-cas/page.tsx` | `CaseFilters` + `CaseCard`. |
| `/integrations` | `app/integrations/page.tsx` | `IntegrationSearch` + CTA. |
| `/secteurs` | `app/secteurs/page.tsx` | Tabs secteurs inline + cards. |
| `/ia` | `app/ia/page.tsx` | Cards `rounded-[24px]`. |

### 2.2 Authentification / Onboarding (4 pages)
| Route | Fichier | Notes |
|---|---|---|
| `/login` | `app/login/page.tsx` | Inputs inline `rounded-xl px-4 py-3 text-[15px]`, 8 `text-[px]`. |
| `/register` | `app/register/page.tsx` | Idem, 10 `text-[px]`. |
| `/onboarding/...` (2) | `app/onboarding/` | Layout dédié, `text-[13/15px]`. |

### 2.3 Dashboard (55 pages)
Layout : `app/dashboard/layout.tsx` → `TopNavbar` (4 onglets : Téléphone / Voix / Social / IA & Agents) + `DashboardSidebar` (modules `phone`/`sms`/`whatsapp`/`voice`/`social`/`ai`).

Principales familles d'en-têtes de page constatées :
- **Standard :** `h1 text-3xl font-bold` + sous-titre `text-[var(--text-secondary)]` + container `max-w-7xl p-8`.
- `app/dashboard/team/page.tsx:25`, `verify/page.tsx:13`, `ai-team/page.tsx:31` → `font-extrabold md:text-4xl` (hors norme).
- `app/dashboard/analytics/revenue/page.tsx:44` → `h2` au lieu de `h1`.
- `voice-lab/page.tsx:4`, `tts/page.tsx:4` → `text-2xl` + pages **placeholder** (8 lignes).
- **18 pages délèguent tout à un client comp :** `ai-playground`, `call-logs`, `channels`, `contacts`, `crm`, `inbox`, `ivr`, `livekit`, `numbers`, `sequences`, `sms`, `sms-inbox`, `whatsapp-inbox`, `social-campaigns`, `whatsapp/connect`, `settings/billing`, `rag-memory`, `iot` → aucun `h1` au niveau page, chaque client gère son propre en-tête.
- Containers hétérogènes : `max-w-4xl/5xl/6xl/7xl` (12 pages non standard), paddings `p-4 md:p-8` / `p-6` / `p-8` / `py-8`.

### 2.4 God-Mode (16 pages)
Layout : `app/god-mode/layout.tsx` → `GodModeSidebar` + garde admin + wrapper `p-10 max-w-6xl`.
- Doubles wrappers : `god-mode/pricing/page.tsx` re-ajoute `p-8 max-w-5xl` ; `messaging/page.tsx`, `voice/page.tsx`, `esim/page.tsx` re-ajoutent `max-w-6xl mx-auto`.
- Tables god-mode : `glass-panel border-none rounded-2xl overflow-hidden shadow-2xl` (spin standard visible).
- Plus gros fichier du projet : `app/god-mode/telnyx/TelnyxHubClient.tsx` (**~1000 lignes / 87 Ko**).

### 2.5 Autre (1 page)
- `app/verify/page.tsx` — hors dashboard/god-mode, avec tabs inline `border-b-2` cyan.

---

## 3. État des lieux du design system existant (`app/globals.css`)

### 3.1 Ce qui existe et fonctionne
- **Tokens thème lumineux/dark :** `--bg-base`, `--bg-surface`, `--bg-surface-solid`, `--bg-surface-hover`, `--border-subtle`, `--border-glow`, `--text-primary`, `--text-secondary`, `--accent-primary`, `--accent-foreground`, `--accent-blue/green/purple`, `--success`, `--danger`, `--shadow-panel`, `--shadow-hover`.
- **Mappage partiel du `@theme` :** `--color-violet-400/500/600` et `--color-cyan-400/500/600` uniquement.
- **Classes utilitaires :** `.glass-panel`, `.glass-panel-premium` (backdrop blur), `.n8n-gradient-text`, `.n8n-gradient-bg`, `.apple-btn/.btn-primary/.btn-primary-gradient` (pill), `.btn-secondary`, `.badge-glass-green/red/blue/gray`, `.text-gradient`, `.animate-*` (marquee, counter, fade), `prefers-reduced-motion` présent.
- **Overrides globaux** `select, input`, `th`, `td`, `tr:hover td`, scrollbars.

### 3.2 Problèmes structurels de la source de vérité

| # | Problème | Preuve |
|---|---|---|
| 1 | **`@theme` incomplet :** 99 usages de classes shadcn sans token (`bg-card`, `text-muted-foreground`, `ring-ring`, `border-input`, `bg-primary`, `bg-secondary`, `bg-accent`…) → **styles vides au runtime** | `text-muted-foreground` ×65, `bg-card` ×11, `text-card-foreground` ×6, `ring-ring` ×6, `border-input` ×3, `bg-primary` ×3, `bg-secondary` ×2, `bg-accent` ×1, `text-accent-foreground` ×1, `text-secondary-foreground` ×1 |
| 2 | **Double classes identiques :** `.glass-panel` ET `.glass-panel-premium` = **stricte même règle CSS** | `globals.css:94-102` |
| 3 | **3 alias pour un même bouton pill :** `.apple-btn, .btn-primary, .btn-primary-gradient` partagent la même règle | `globals.css:127-141` |
| 4 | **Primitives `components/ui/` mi-câblées :** `button.tsx` ignore `variant`/`size` (toujours `apple-btn`) ; `card.tsx` utilise `bg-card/text-card-foreground` (orphelins) ; `input.tsx` utilise `border-input/text-muted-foreground/ring-ring` (orphelins) ; `badge.tsx` a une prop `variant` morte | `components/ui/{button,card,input,badge}.tsx` |
| 5 | **Deux identités de thème en conflit :** palette maison via `var(...)` (1681 usages) **vs** palette brute Tailwind (1910 usages) **vs** tokens shadcn fantômes (99). Aucune source de vérité unique. | comptages |

### 3.3 Inventaire des définitions techniques présentes
- Radius : uniquement les utilitaires Tailwind (`rounded-xl` dominant) + `.glass-panel` fixé à `16px` en dur.
- Typo : `font-family` système à l'échelle (`body`), pas d'échelle de classes définie.
- Boutons : via `.apple-btn/.btn-*/.n8n-gradient-bg` (pas de variantes/tailles structurées).
- Icônes : aucune convention (6 tailles détectées).

---

## 4. Matrice des incohérences — Classification P0 / P1 / P2 / P3

> **P0** = casse UX / critique · **P1** = incohérence très visible · **P2** = cohérence importante · **P3** = polish

### P0 — CRITIQUE (casse UX / contraste / a11y)

| ID | Problème | Preuves | Fichiers concernés |
|---|---|---|---|
| P0-1 | **99 tokens shadcn orphelins** → éléments rendus non stylés (fond/texte/border manquants) | 65 `text-muted-foreground`, 11 `bg-card`, 6 `ring-ring`, … | `components/ui/*`, `app/dashboard/tickets/page.tsx`, `sales`, `billing`, `inventory`, `campaigns`, `calls`, `settings/integrations`… |
| P0-2 | **Primitives `components/ui/` inutilisables telles quelles** (button sans variants, input/card avec tokens fantômes) | `components/ui/button.tsx:12`, `card.tsx:7`, `input.tsx:10` | `components/ui/` |
| P0-3 | **A11y critique :** seulement 18 `aria-label`, 2 `aria-expanded`, 7 `focus-visible:ring` (vs 85 `focus:ring`), 189 `text-white`, ~25 modales inline sans focus-trap ni fermeture clavier/fond | comptages ; `IncomingCall.tsx:42`, `ContactsClient.tsx:410`… | quasi tout le frontend |
| P0-4 | **2 librairies de toasts** → rendus/UX divergents | `sonner` ×12 vs `react-hot-toast` ×10 (`WorkflowEditorClient.tsx:21`, `SkillsModal.tsx:5`, `PipelineClient.tsx:7`…) | 22 fichiers |

### P1 — TRÈS VISIBLE (cohérence des composants)

| ID | Problème | Preuves | Fichiers concernés |
|---|---|---|---|
| P1-1 | **4 systèmes de boutons, 114 usages, formes/paddings différents partout** (`px-4 py-2 rounded-full` ↔ `px-8 py-4 rounded-full` ↔ `px-6 py-3 rounded-xl` ↔ icon `w-11 h-11`) | `apple-btn` ×11, `btn-primary` ×14, `btn-primary-gradient` ×37, `n8n-gradient-bg` ×36 | `marketing/*`, `landing/*`, `auth`, `dashboard/*`, `god-mode/*`, `crm/*`, `whatsapp/*` |
| P1-2 | **Cartes : 8 familles visuelles** (radius 32/24/20/2xl/xl + paddings p-8/p-6/p-5/p-3) | `ProductTabs.tsx:118` (32px), `ResourceCards.tsx:10` (24px), `IntegrationSearch.tsx:80` (20px), `god-mode/*` (2xl)… | `marketing/`, `landing/`, `god-mode/`, `dashboard/` |
| P1-3 | **~25 modales / drawers inline** sans composant partagé (copier-coller `fixed inset-0 z-50 bg-black/60`) | `ContactsClient.tsx:410,546`, `InboxClient.tsx:766`, `TemplatesClient.tsx:143`, `Social-campaigns/CampaignsClient.tsx:147`, `SequencesClient.tsx:136`, `PipelineClient.tsx:273,323`, `NumbersClient.tsx:132`, `SkillsModal.tsx:90`, `KnowledgeBaseModal.tsx:115`, `god-mode/*`, `iot/page.tsx:444,478,520`, `CrmApp.tsx:137`… | ~20 fichiers |
| P1-4 | **Badges/status : 4 systèmes** (badge-glass ×4, Badge ui sans variants, spans `rounded-full px-2 py-1`, pastilles fonds `*-500/10`) | `SmsDashboardClient.tsx:68`, `tickets/page.tsx:28`, `CallLogsClient.tsx:110`, `DashboardCharts.tsx:66` | dashboard + god-mode |
| P1-5 | **Tabs : 3 composants existants contournés + 7 implémentations inline** (2 familles visuelles : underline `border-b-2` vs pills) | underline : `SoftphoneWorkspace.tsx:72`, `Chatter.tsx:78`, `verify/page.tsx:57`, `iot/page.tsx:184`, `InventoryClient.tsx:17` ; pills : `TelnyxHubClient.tsx:399` | softphone, crm, dashboard, god-mode |
| P1-6 | **Typographie incohérente :** 92 `text-[px]` arbitraires (13/15/17px), en-têtes h2 vs h1, `text-2xl` vs `text-3xl`, `font-extrabold md:text-4xl` | `login/page.tsx`, `register/page.tsx`, `PricingClient.tsx` (8), `revenue/page.tsx:44`, `voice-lab/page.tsx:4`, `tts/page.tsx:4`, `team/page.tsx:25` | auth, dashboard, marketing |
| P1-7 | **Containers/paddings de page hétérogènes** (`max-w-4xl→7xl`, `p-4 md:p-8` / `p-6` / `p-8` / double wrapper god-mode) | 12 pages non standard, `god-mode/pricing/page.tsx` | dashboard (12+), god-mode (4) |

### P2 — COHÉRENCE IMPORTANTE

| ID | Problème | Preuves | Fichiers concernés |
|---|---|---|---|
| P2-1 | **Couleurs brute palette : ~1910 usages** (gray 309, emerald 288, cyan 210 dominants) + 104 hex/rgba hardcodés | ex. `WhatsAppInboxClient.tsx` (15 hex), `ChannelsClient.tsx` (8) | ~tous les clients dashboard |
| P2-2 | **43 `rounded-[px]` arbitraires** (20/24/28/32/40) hors échelle | `receptionniste-ia/page.tsx` (9), `ProductShowcase.tsx` (5), `billing/BillingClient.tsx` (3) | marketing (dominant) |
| P2-3 | **Aucun composant Empty / Spinner / Skeleton / PageHeader partagé** : 40+ `Loader2 animate-spin` inline, ~20 empty states « Aucun… » variés, 0 skeleton | `buy-test:190`, `SkillsModal:128`, `WorkflowEditorClient:325`, `tickets/page.tsx:69` | ~30 fichiers |
| P2-4 | **Inputs/selects : ~30 styles inline différents** (auth `rounded-xl text-[15px]`, god-mode `rounded-lg px-3 py-2`, numéros `bg-[#121212] font-mono`, `ui/input` shadcn) | `login/page.tsx:66`, `TenantsClient.tsx:153`, `god-mode/numbers/NumbersClient.tsx:332` | auth, god-mode, dashboard |
| P2-5 | **Icônes : 6 tailles** (w-4×262, w-5×138, w-3×83, w-6×60, w-8×53, w-7×5) sans logique | comptage | partout |
| P2-6 | **Transitions incohérentes :** 103 `transition-all` (perf) vs 314 `transition-colors`, durations 200/300/500/700 mélangées | comptage | partout |
| P2-7 | **Tables :** overrides globaux partiels + traitements spécifiques (god-mode `glass-panel border-none rounded-2xl shadow-2xl`) → rendus différents | `god-mode/users/page.tsx:25` vs pages dashboard | god-mode, dashboard |

### P3 — POLISH

| ID | Problème | Preuves |
|---|---|---|
| P3-1 | **Softphone :** `IncomingCall` vs `GlobalAppIncomingCall` quasi-doublons visuels (overlays `max-w-3xl` vs `max-w-md`) ; pas de composant `CallOverlay` partagé | `components/softphone/IncomingCall.tsx:42`, `GlobalAppIncomingCall.tsx:24` |
| P3-2 | **Sidebar legacy `components/dashboard/Sidebar.tsx`** (doublon de `app/dashboard/DashboardSidebar.tsx`, navige via callback au lieu des routes) | `components/dashboard/Sidebar.tsx` (non référencé par l'app) |
| P3-3 | **Pages placeholder / routes mortes :** `voice-lab`, `tts` (8 lignes), `ai-agents` (redirect), `ai-employees` (pas de `page.tsx`) | `app/dashboard/{voice-lab,tts,ai-agents,ai-employees}` |
| P3-4 | `rounded-full` (292) utilisé parfois sur des conteneurs (pas que pills/avatars) | comptage |

---

## 5. Fiches de correction (résumé par ID)

| ID | Correction proposée | Effort | Risque |
|---|---|---|---|
| P0-1/2 | **Réparer `@theme`** : mapper les tokens shadcn sur la palette maison (`--color-card→bg-surface`, `--color-muted-foreground→text-secondary`, `--color-input→border-subtle`, `--color-ring→accent`, `--color-primary→accent-primary`, `--color-secondary→bg-surface-hover`, `--color-accent→accent-primary`, `--color-destructive→danger`…). Corrige les 99 usages SANS toucher aux call-sites. Fiabiliser `Button`/`Card`/`Badge`/`Input` sur ces tokens. | S | Aucun (additif) |
| P0-3 | Ajouter composants `Modal`/`Drawer` (overlay + Esc + focus-trap + `aria-modal`), state rings `focus-visible`, `aria-label`/`aria-expanded` sur menus, nettoyage `text-white` sur fonds suspects, tailles tactiles ≥ 40px. | XL | Trimestre |
| P0-4 | Unifier sur **`sonner`** : migrer les 10 fichiers `react-hot-toast` (adaptateur `toast()` compatible). Supprimer la dépendance `react-hot-toast` de `package.json`. | M | faible |
| P1-1 | Créer `Button` (variants : primary/gradient/secondary/outline/ghost/destructive × tailles sm/md/lg), remplacer les 114 usages (btn-*/n8n-gradient-bg), conserver `.n8n-gradient-bg` comme util de fond CTA. | L | faible |
| P1-2 | Créer `Card` (variants default/premium/interactive/stat) avec échelle de radius uniforme ; remplacer les 8 familles. 1 token radius marketing `--radius-card-premium` (24–32px) pour préserver l'identité premium. | L | faible |
| P1-3 | Introduire `Modal`/`Drawer` partagé, remplacer les ~25 overlays inline. | L | faible |
| P1-4 | `Badge` avec variants `success/danger/info/neutral/warning` encapsulant les `badge-glass-*` ; mapping des statuts métier (ACTIVE/PAID/…). | M | faible |
| P1-5 | Composant `Tabs` (2 modes : underline / pills) ; remplacer les 7 inline. | M | faible |
| P1-6 | Échelle typo tokenisée ; mapping des `text-[13/15/17px]` ; en-têtes pages uniformes (h1 text-3xl). | L | faible |
| P1-7 | Standardiser container `max-w-7xl` (dash) / paddings `p-8`, retirer les doubles wrappers god-mode. | M | faible |
| P2-1/2/4/5/6/7 | Tokens de couleur/radius, composants Input/Select unifiés, tailles d'icônes (sm/md/lg), transitions → `transition-colors` par défaut, tables via composant `DataTable` léger. | XL | faible |
| P2-3 | Créer `EmptyState`, `Spinner`, `Skeleton`, `PageHeader` partagés ; remplacer les inline. | M | faible |
| P3-1/2 | Extraire `CallOverlay` shared (PSTN + app-to-app), retirer `components/dashboard/Sidebar.tsx` (vérif. aucune ref). | S | faible |
| P3-3 | Remplir ou masquer les pages placeholder (hors périmètre fonctionnel — signaler seulement). | — | — |

---

## 6. Spec du DESIGN SYSTEM CIBLE (Phase B)

> Principe : **« le même produit, parfaitement cohérent »** — conserver dark premium, glass, gradients, ton SaaS B2B. Pas de redesign d'identité.

### 6.1 Tokens (`app/globals.css` — `@theme` + `:root`)

```css
@theme {
  /* Mapping shadcn → palette maison (corrige les 99 orphelins) */
  --color-background: var(--bg-base);
  --color-foreground: var(--text-primary);
  --color-card: var(--bg-surface);
  --color-card-foreground: var(--text-primary);
  --color-muted: var(--bg-surface-hover);
  --color-muted-foreground: var(--text-secondary);
  --color-input: var(--border-subtle);
  --color-ring: var(--accent-primary);
  --color-primary: var(--accent-primary);
  --color-primary-foreground: var(--accent-foreground);
  --color-secondary: var(--bg-surface-hover);
  --color-secondary-foreground: var(--text-secondary);
  --color-accent: var(--accent-primary);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--danger);
  --color-destructive-foreground: #fff;
  /* Tokens radius */
  --radius-md: 8px;  --radius-lg: 10px; --radius-xl: 12px;
  --radius-2xl: 16px; --radius-3xl: 24px;
  --radius-card-premium: 28px; /* identité marketing */
  /* Tailles icônes */
  --icon-sm: 16px; --icon-md: 20px; --icon-lg: 24px;
}
```

### 6.2 Échelle de radius
| Contexte | Token | Exemple |
|---|---|---|
| contrôles fins (checkbox, code) | `rounded-md` | 8px |
| boutons / inputs | `rounded-lg` | 10px |
| cartes standard / panneaux | `rounded-xl` | 12px |
| conteneurs majeurs / modales | `rounded-2xl` | 16px |
| cartes marketing premium | `rounded-3xl` / `rounded-[var(--radius-card-premium)]` | 24–28px |
| pills / avatars / badges / toggles | `rounded-full` | — |

Suppression des `rounded-[20/24/28/32/40px]` dispersés au profit des tokens ci-dessus (marketing conserve l'expressivité via `radius-card-premium`).

### 6.3 Hiérarchie typographique
| Rôle | Classe cible |
|---|---|
| Display (hero marketing) | `text-5xl/6xl font-extrabold tracking-tight` |
| H1 page | `text-3xl font-bold tracking-tight` |
| H2 section | `text-2xl font-bold` |
| H3 carte | `text-lg font-semibold` |
| Body (dashboard) | `text-sm` |
| Body (marketing) | `text-base` |
| Small / helper | `text-sm text-[var(--text-secondary)]` |
| Label | `text-xs font-medium uppercase tracking-wide` |
| Caption | `text-xs text-[var(--text-secondary)]` |

Mapping des arbitraires : `text-[13px]→text-xs` (<12 en table) ou `text-sm` ; `text-[15px]→text-sm/base` ; `text-[17px]→text-base/lg` ; `text-[9/10/11px]→text-[10px]` uniquement si badge/caption.

### 6.4 Boutons (composant `Button`)
- **Base :** `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none`
- **Tailles :** `sm h-9 px-3 text-sm` · `md h-10 px-4 text-sm` · `lg h-11 px-6 text-base` · CTA marketing `lg px-8`
- **Variants :** `primary` (`bg-primary text-primary-foreground hover:opacity-90`) · `gradient` (`n8n-gradient-bg`) · `secondary` (`bg-secondary border border-subtle`) · `outline` (`border border-subtle bg-transparent hover:bg-surface-hover`) · `ghost` (`hover:bg-surface-hover`) · `destructive` (`bg-destructive text-white hover:bg-destructive/90`) · `icon` (carré, même hauteur que la taille)
- **Aliases conservés temporairement :** `.apple-btn`, `.btn-primary`, `.btn-primary-gradient`, `.btn-secondary` pointent vers la base du nouveau Button (compat), puis usages remplacés.

### 6.5 Composants partagés à créer (dans `components/ui/`)
`Button` · `Card` (default/premium/interactive/stat + `CardHeader/Title/Content/Footer` réparés) · `Badge` (variants status) · `Input` / `Textarea` / `Select` / `Label` / `Switch` · `Modal` / `Drawer` · `Tabs` (underline + pills) · `EmptyState` · `Spinner` · `Skeleton` · `PageHeader` / `SectionHeader` · `StatusBadge` (mapping statuts métier).

### 6.6 Conventions transverses
- **Icônes :** `sm`=w-4 · `md`=w-5 (défaut) · `lg`=w-6 · tailles supérieures réservées (avatars/branding).
- **Transitions :** `transition-colors` + `duration-200` par défaut (animations existantes conservées pour le marketing).
- **Toasts :** `sonner` uniquement (le `<Toaster richColors position="top-right">` racine est déjà en place dans `app/layout.tsx:30`).
- **Modales :** overlay `bg-black/50 backdrop-blur-sm`, panneau `rounded-2xl border border-subtle bg-surface shadow-2xl`, fermeture Esc + overlay + bouton X, `role="dialog" aria-modal="true"`.
- **Accessibilité :** focus visible systématique (`focus-visible:ring-2 ring-ring ring-offset-2`), `aria-label` sur boutons icône/menus, `aria-expanded` sur accordéons/menus, cibles tactiles ≥ 40×40px (mobile), respect `prefers-reduced-motion` (déjà en place pour les anims landing).

---

## 7. Stratégie d'exécution proposée (Phase B)

1. **B0 — Fondations (P0) :** réparer `@theme` + primitives `components/ui/*` + unifier toasts → `sonner`. *(Impact immédiat, additif, zéro régression.)*
2. **B1 — Primitives (P0/P1) :** créer les composants partagés de la section 6.5.
3. **B2 — Rollout par zone (P1) :** dashboard → auth → softphone (visuel seul) → god-mode → marketing. Remplacer les 114 boutons, 8 familles de cartes, ~25 modales, 7 tabs inline, les en-têtes de pages.
4. **B3 — P2 ciblés :** tokens de couleur/radius, inputs/selects, icônes, transitions, empty/spinner/page-header, tables.
5. **B4 — Validation :** `npx tsc --noEmit` (ne pas introduire de nouvelles erreurs ; les erreurs préexistantes `lib/pstn-forwarding.ts` hors périmètre restent), `npm run build`, tests existants pertinents.
6. **Livrable final :** `UI_REFACTOR_REPORT.md` (sections A→Z, scores avant/après, verdict).

### Valeurs de référence (score de départ, estimation)
| Axe | Départ |
|---|---|
| Design consistency | 45/100 |
| Typography consistency | 40/100 |
| Component consistency | 35/100 |
| Responsive quality | 60/100 |
| Accessibility | 30/100 |
| Overall UI quality | 45/100 |

---

## 8. Périmètre hors-ligne (NON touché)
Telnyx · WebRTC · APP_TO_APP · PSTN · billing/wallet · Stripe · Flutterwave · Prisma métier · webhooks · sécurité backend · Pusher · cron · permissions · logique d'achat de numéros. Aucune mutation Git (ni commit, ni push, ni reset/checkout/clean/stash).