# TELECOM INTELLIGENCE DESIGN SYSTEM

**Source de vérité** du chantier UI "Telecom Intelligence OS".
**Date :** Septembre 2026 · **Statut :** v1 (phase de refonte)

---

## 1. Vision

L'application est un **système d'exploitation pour la téléphonie d'entreprise** :
signal, voix, réseau, IA, infrastructure. L'interface doit évoquer un **centre de
contrôle réseau** : calme, sombre, premium, très lisible. Principe directeur :

> **90 % sobre — 10 % signature visuelle.**

La signature visuelle = le langage du signal (waveform, pulses, nœuds réseau,
états de connexion) appliqué **uniquement là où il a du sens** : le softphone,
les statuts d'appel, le live system.

### Interdits
- Glow omniprésent, dégradés partout, glassmorphism généralisé, animations
  permanentes, Web3/crypto vibes, clones Linear/Vercel/Stripe.
- Les couleurs de statut (cyan/vert/ambre/rouge) doivent être **sémantiques**,
  jamais purement décoratives.

---

## 2. Palette — OKLCH

Toutes les couleurs sont définies en **OKLCH** (`app/globals.css`). Les HEX ne
sont utilisés qu'en dernière extrémité (foregrounds sur brand) et centralisés
dans les tokens.

### 2.1 Dark (identité par défaut)

**Surfaces & fonds**

| Token | OKLCH | Rôle |
|---|---|---|
| `--bg-base` | `oklch(0.14 0.014 250)` | fond d'application |
| `--bg-surface` | `oklch(0.18 0.014 250)` | panneaux / cartes / sidebar |
| `--bg-surface-solid` | `oklch(0.20 0.016 250)` | surfaces opaques (modales, selects) |
| `--bg-surface-hover` | `oklch(0.23 0.018 250)` | hover, rows |
| `--bg-elevated` | `oklch(0.25 0.02 250)` | popover / drawer / tooltip |
| `--bg-overlay` | `oklch(0.10 0.01 250 / 0.72)` | backdrops |
| `--bg-glass` | `oklch(0.18 0.014 250 / 0.62)` | verre : softphone, overlays, hero |

**Bords**

| Token | OKLCH | Rôle |
|---|---|---|
| `--border-subtle` | `oklch(1 0 0 / 0.07)` | bord par défaut |
| `--border-default` | `oklch(1 0 0 / 0.12)` | bords actifs / contrôles |
| `--border-active` | `oklch(0.72 0.15 195)` | bord focus / actif (brand) |

**Texte**

| Token | OKLCH | Rôle |
|---|---|---|
| `--text-primary` | `oklch(0.96 0.005 250)` | titre / contenu principal |
| `--text-secondary` | `oklch(0.68 0.02 250)` | sous-texte, descriptions |
| `--text-muted` | `oklch(0.50 0.02 250)` | captions, placeholders, disabled |

**Couleurs fonctionnelles**

| Token | OKLCH | Rôle |
|---|---|---|
| `--brand` | `oklch(0.72 0.15 195)` | accent principal (signal / WebRTC) |
| `--brand-hover` | `oklch(0.78 0.15 195)` | hover boutons primaires |
| `--brand-active` | `oklch(0.66 0.15 195)` | pressed / actif |
| `--brand-foreground` | `oklch(0.14 0.03 195)` | texte sur brand (contraste AA) |
| `--telecom` | `oklch(0.65 0.15 240)` | PSTN / telco / infrastructure |
| `--ai` | `oklch(0.66 0.18 285)` | IA / agents |
| `--success` | `oklch(0.74 0.17 150)` | en ligne / actif / OK |
| `--warning` | `oklch(0.80 0.14 85)` | attention / busy / pending |
| `--danger` | `oklch(0.62 0.21 25)` | erreur / échec |

**Ombres**

| Token | OKLCH | Rôle |
|---|---|---|
| `--shadow-panel` | `0 1px 2px oklch(0 0 0/0.25), 0 1px 3px oklch(0 0 0/0.18)` | défaut |
| `--shadow-hover` | `0 6px 20px -2px oklch(0 0 0/0.35)` | élévation / hover |

La profondeur vient surtout des **surfaces empilées** (base → surface →
elevated → popover), pas des ombres.

### 2.2 Light (secondaire, accessible)

| Token | OKLCH |
|---|---|
| `--bg-base` | `oklch(0.975 0.004 250)` |
| `--bg-surface` | `oklch(1 0 0)` |
| `--bg-surface-hover` | `oklch(0.95 0.008 250)` |
| `--border-subtle` | `oklch(0 0 0 / 0.08)` |
| `--border-default` | `oklch(0 0 0 / 0.14)` |
| `--text-primary` | `oklch(0.20 0.02 250)` |
| `--text-secondary` | `oklch(0.44 0.03 250)` |
| `--text-muted` | `oklch(0.58 0.02 250)` |
| `--brand` | `oklch(0.55 0.17 205)` |
| `--success` / `--warning` / `--danger` | versions assombries (contraste AA sur fond clair) |

### 2.3 Mapping `@theme` (Tailwind v4)

Les tokens CSS sont exposés à Tailwind via `@theme` :

```css
@theme {
  --color-background: var(--bg-base);
  --color-foreground: var(--text-primary);
  --color-card: var(--bg-surface);
  --color-card-foreground: var(--text-primary);
  --color-muted: var(--bg-surface-hover);
  --color-muted-foreground: var(--text-secondary);
  --color-border: var(--border-subtle);
  --color-ring: var(--brand);
  --color-primary: var(--brand);
  --color-primary-foreground: var(--brand-foreground);
  --color-secondary: var(--bg-surface-hover);
  --color-secondary-foreground: var(--text-secondary);
  --color-accent: var(--brand);
  --color-accent-foreground: var(--brand-foreground);
  --color-destructive: var(--danger);
  --color-destructive-foreground: #ffffff;

  --color-brand: var(--brand);
  --color-telecom: var(--telecom);
  --color-ai: var(--ai);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);

  --color-cyan-400: var(--text-secondary);
  --color-cyan-500: var(--brand);
  --color-cyan-600: var(--brand-active);
  --color-violet-500: var(--ai);
}
```

`color-mix()` est privilégié pour : hovers, bords subtils, fonds de badges,
halos (`color-mix(in oklch, var(--brand) 12%, transparent)`).

---

## 3. Typographie

**next/font · Inter** (interface) + **JetBrains Mono** (telemetry uniquement).

| Variable | Font | Usage |
|---|---|---|
| `--font-inter` | Inter Variable | tout le texte d'interface |
| `--font-jetbrains` | JetBrains Mono | données techniques uniquement |

`--font-sans` → `var(--font-inter)` · `--font-mono` → `var(--font-jetbrains)`.

### Échelle

| Rôle | Classes | Usage |
|---|---|---|
| Display | `text-5xl md:text-6xl font-extrabold tracking-tight` | hero marketing |
| H1 page | `text-3xl font-bold tracking-tight` | titre de page |
| H2 section | `text-2xl font-bold tracking-tight` | sous-section |
| H3 carte | `text-lg font-semibold` | titre de carte |
| H4 | `text-base font-semibold` | sous-titre mineur |
| Body large | `text-base` | prose marketing |
| Body | `text-sm` | corps dashboard |
| Small/helper | `text-xs text-[var(--text-secondary)]` | aide |
| Label | `text-xs font-medium uppercase tracking-wider` | group headers, labels |[0;10;0]
| Caption | `text-[11px] text-[var(--text-muted)]` | timestamps, micro-infos |[0;10;0]
| Data/mono | `font-mono text-sm tabular-nums` | telemetry uniquement |

### Règles mono (JETBRAINS MONO) — données techniques seulement
- numéros de téléphone, durées, wallet/usage chiffré, call IDs
- états techniques (SIP, IP, `REGISTERED`, `CONNECTED`)
- métriques, compteurs, logs

**Ne pas** mettre en mono : les labels, les titres, le texte courant.

### Mapping des tailles arbitraires
- `text-[13px]` → `text-xs` (labels) ou `text-sm` (corps)
- `text-[15px]` → `text-sm` ou `text-base`
- `text-[17px]` → `text-base` ou `text-lg`
- `text-[10px]` → conservé uniquement pour badges/captions micro (ou `text-[11px]`)

`text-wrap: balance` sur les grands titres quand pertinent (hero).

---

## 4. Radius

| Token / classe | px | Usage |
|---|---|---|
| `rounded-sm` | 6 | micro-contrôles |
| `rounded-md` | 8 | contrôles, checks |
| `rounded-lg` | 10 | boutons, inputs |
| `rounded-xl` | 12 | petites cartes |
| `rounded-2xl` | 16 | cartes standard, modales |
| `rounded-3xl` | 20 | panneaux plus larges |
| `--radius-panel` (`rounded-[var(--radius-panel)]`) | 24–28 | cartes marketing premium / hero |
| `rounded-full` | 9999 | pills, avatars, badges, boutons ronds |

Arbitraires existants → mappés : `rounded-[20px]`→`rounded-3xl`,
`rounded-[24px]`→`var(--radius-panel)` (marketing premium) ou `rounded-2xl`
(surfaces), `rounded-[28px]/[32px]`→`var(--radius-panel)`,
`rounded-[40px]`→`rounded-full` ou `var(--radius-panel)`.

---

## 5. Spacing

| Usage | Valeur |
|---|---|
| Page (dash) | `p-6 md:p-8`, container `max-w-7xl mx-auto` |
| Page (god-mode) | `p-8`, container `max-w-6xl mx-auto` |
| Section marketing | `py-20 md:py-24` |
| Card padding | `p-5` (dense) / `p-6` (standard) |
| Form gap | `gap-5` |
| Header / nav | `h-16` tops, `gap-1` nav groups |
| Icon | `w-4` (sm) · `w-5` (md) · `w-6` (lg) |

---

## 6. Motion

Tokens CSS :

```css
@theme {
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1);
}
```

- `fast` : hover, press, toggles
- `normal` : transitions de panneaux, focus
- `slow` : entrées/sorties de modales/drawers, changement d'état majeur
- Animer **opacity / transform / scale / translate** uniquement dans les cas
  traités. Jamais width/height/top/left inutilement.
- `prefers-reduced-motion: reduce` → neutraliser les pulses, marquees,
  waveforms décoratives, animations d'entrée. Les transitions d'état simples
  (opacité) restent.

Motion (React) : utilisé pour tabs, drawers, modales, états du softphone,
active nav. **Pas** pour chaque élément.

---

## 7. Statuts — langage commun

Même état ⇒ même badge / couleur / icône partout.

| Valeurs métier (réelles) | Mapping visuel |
|---|---|
| `idle` / offline / inactive | gris neutre |
| `OFFERING` / `ringing` / `INITIATED` | cyan · pulse |
| `CONNECTING` / `PREAUTHORIZED` | cyan · anneau lent |
| `ACTIVE` / `active` / online / connected / paid / completed | vert |
| `BUSY` / pending / scheduled / waiting | ambre |
| `FAILED` / error / declined / missed / unpaid / cancelled / suspended | rouge |
| `ENDED` / ended / cancelled / archived / draft | gris/secondary |
| `FORWARDING` / `IN_PROGRESS` | bleu telecom |
| `thinking` / `listening` / `speaking` / ai | violet AI |

**Aucune nouvelle valeur métier n'est créée.** `StatusBadge` mappe les valeurs
existantes (DB / state machines) vers ce langage.

États softphone (état machine réelle) :

| État | UX |
|---|---|
| `callState=idle`, `appCallStatus=idle` | très calme, dialpad |
| `ringing` / `OFFERING` | pulse doux autour du numéro |
| `connecting` / `CONNECTING` | anneau de signal lent |
| `active` / `ACTIVE` | waveform pilotée par l'audio réel |
| `ended` / `ENDED` | fade rapide et calme |
| `error` / `FAILED` | bordures rouges discrètes + dot rouge |
| `held` | état secondaire tranquille |

**AudioVisualizer :** jamais de fausse activité audio. S'il n'y a pas de
stream/analyser → animation d'état décorative discrète et explicite (pulsation
lente des anneaux). S'il y a un vrai stream → l'amplitude réelle (AnalyserNode)
pilote l'animation.

---

## 8. Glassmorphism (limité)

Le verre (`backdrop-blur` + `--bg-glass`) est réservé à :
- le **softphone** (floating panel) ;
- les **modales / overlays / drawers** ;
- le **hero premium** marketing ;
- les cross-panels flottants.

Les cartes standard du dashboard **ne sont pas** en verre : `--bg-surface` +
bord subtil.

---

## 9. Primitives (`components/ui/`)

| Composant | Statut |
|---|---|
| Button | existe — `gradient` → brand |
| Card | existe — extension `variant` (default/glass/elevated/stat/telecom) |
| Badge | existe — token-aware |
| StatusBadge | existe — map étendue |
| Input / Textarea / Select / Label | existent |
| Modal | existe — `role=dialog`, Esc, backdrop |
| Drawer | existe — **étendre** `side="bottom"` (bottom-sheet) |
| Tabs | existe — underline + pills réutilisés pour les toggles |
| PageHeader | existe |
| EmptyState / Skeleton / Spinner | existent |
| StatCard | **à créer** (aucun équivalent) — consolide les inline |
| StatusDot | **à créer** (aucun équivalent) — consolide `w-2 h-2 rounded-full` |

**Règle : réutiliser → étendre → consolider → créer seulement si nécessaire.**
Ne jamais introduire deux composants pour le même besoin.

---

## 10. Live System

L'application doit *ressembler* connectée, sans jamais inventer de données.
- Indicateurs système uniquement si la source est réelle
  (`isRegistered`, `registrationError`, statuts Pusher/Telnyx…).
- Pas de "TELNYX ONLINE" sorti de nulle part. Si aucune source : pas de strip.

---

## 11. Accessibilité & performance

- Focus visible : `focus-visible:ring-2 ring-[var(--brand)] ring-offset-2 ring-offset-[var(--bg-base)]`.
- Cibles tactiles ≥ 44×44 px (mobile : dialpad, controls, nav).
- `aria-label` sur les boutons icône, `role="dialog"` + `aria-modal` sur
  modales/drawers, Esc pour fermer.
- Contraste AA (4.5:1) : vérifié par le choix des oklch text-on-surface.
- Server Components conservés ; les nouveaux composants client sont le strict
  nécessaire. Pas de librairie lourde pour un effet simple.
- Container queries / subgrid : **progressive enhancement** uniquement quand
  cela simplifie réellement (StatCard @container, subgrid sur grilles de stats).

---

## 12. Marketing vs Application

Système commun (fonts, couleurs, radius, boutons, motion, spacing) —
**expression différente** :
- Marketing : plus d'expressivité (Display typo, radius premium, motifs signal).
- Application : sobre, dense, lisible. Pas de spectaculaire.