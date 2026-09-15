# TELECOM INTELLIGENCE OS — Rapport de refonte

Phase d'exécution complète A→J. UI uniquement (aucune logique métier, aucun statut inventé). Validation : `npx tsc --noEmit` = 0 erreur, `npm run build` = exit 0.

## Tokens

### Créés (canoniques, OKLCH dark-first)
- `--brand` / `--brand-hover` / `--brand-active` / `--brand-foreground` (cyan telecom), `--telecom` (bleu), `--ai` (violet IA), `--success` / `--warning` / `--danger`
- Surfaces : `--bg-base`, `--bg-surface`, `--bg-surface-solid`, `--bg-surface-hover`, `--bg-elevated`, `--bg-overlay`, `--bg-glass`
- Bords : `--border-subtle`, `--border-default`, `--border-active`, `--border-glow`
- Texte : `--text-primary`, `--text-secondary`, `--text-muted`
- Motion : `--duration-fast/normal/slow`, `--ease-standard`, `--ease-emphasized` (génèrent `duration-*` / `ease-*` Tailwind)
- Radius : `--radius-sm/md/lg/xl/2xl/3xl/panel/full`
- Mapping `@theme` shadcn complet (background, foreground, card, muted, border, ring, primary, secondary, accent, destructive + `brand/telecom/ai/success/warning/danger`)
- Light theme secondaire conservé (accessibilité) : `[data-theme="light"]`

### Fusionnés (aliases → canonical)
| Ancien | Canonique |
|---|---|
| `--accent-primary` | `--brand` |
| `--accent-cyan` | `--brand` |
| `--accent-blue` | `--telecom` |
| `--accent-violet`, `--accent-purple` | `--ai` |
| `--accent-green` | `--success` |
| `--accent-foreground` | `--brand-foreground` |
| `--accent-gradient*` | gradient brand cyan→violet |
| `--bg-app` | `--bg-base` |
| `--text-tertiary` | `--text-muted` |
| `--apple-*` (bg-primary, border, surface, surfaces-hover, text-*, key-*, accent, success, shadow-soft) | tokens surfaces/texte/brand |
| `--color-cyan-400/500/600`, `--color-violet-400/500/600` | brand / brand-active / ai |

### Supprimés / redéfinis
- Gradient "n8n" rouge → redéfini cyan→bleu (`n8n-gradient-text`, `n8n-gradient-bg`, `text-gradient`, `brand-gradient-*`)
- `badge-glass-*` → recalculés en `color-mix(in oklch, <token> …)` lisibles dark + light
- Pills legacy (`apple-btn` / `btn-primary*` / `btn-secondary`) → consolidées sur la base interne

## Composants
- **Réutilisés** : `Button` (variante `gradient` → `brand-gradient-bg`), `Card` (+ `hoverable`), `Badge` (warning tokenisé), `Tabs`, `Modal`, `Drawer` (étendu `side="bottom"`)
- **Étendus** : `StatusBadge` (mapping des vraies valeurs métier : OFFERING/RINGING/CONNECTING/ACTIVE/ENDED/MISSED/DECLINED/FAILED, callState idle/active/held/error…), `Drawer`
- **Créés** : `StatCard` (consolidation KPIs), `StatusDot`, `components/softphone/status-labels.ts`, `components/softphone/TelemetryStrip.tsx`, `TELECOM_INTELLIGENCE_DESIGN_SYSTEM.md`

## Livrable par phase
- **0** : inventaires tokens + états state machines (`callState`, `appCallStatus`)
- **A** : design system OKLCH
- **B** : `globals.css` OKLCH dark-first + fonts Inter/JetBrains Mono (`next/font`), script no-FOUC pré-peinture, `ThemeProvider` dark par défaut, aliases legacy restaurés (option-recherche exhaustive des `var(--…)` utilisés)
- **C** : primitives (voir ci-dessus)
- **D** : shell dashboard — TopNavbar masqué sur mobile (double header corrigé), `.custom-scrollbar` restauré
- **E** : pages dashboard → accents rose/rouge de marque convertis en cyan brand, tickers/gradients décoratifs repalettisés (viollet IA conservé), lisibilité dark (textes `*-700` → `*-400`)
- **F** : softphone — statuts PSTN/interne rootés sur les vrais états (`StatusBadge` valeurs brutes + libellés FR + `StatusDot`/pulse + direction), télémétrie `TelemetryStrip` (mono), breakpoints mobiles corrigés, chrome verre/cyan, rouge réservé aux actions destructives, aucun artefact audio ajouté
- **G** : auth/onboarding dark premium (fond radial cyan/violet discret, CTA pill gradient)
- **H** : god-mode/crm/whatsapp — rouge → gardé sémantique (shield, erreurs, danger), CTA non destructifs redisposés en gradient cyan→violet, chrome tokenisé
- **I** : landing/marketing/pricing/statiques — `shadow-rose-*`/`rgba(255,87,87,…)`/gradients rose→cyan brand, pastilles décoratives repalettisées, rouge gardé pour raccrocher (mockup) et sémantique

## Dette volontaire (tiers d'un commit ultérieur)
1. Classes alias conservées : `n8n-gradient-text|bg`, `text-gradient`, `apple-btn`, `btn-*` (renommage complet des call-sites = chantier séparé).
2. `app/dashboard/messages/*` et `numbers/*` gardent les alias `apple-*` / `apple-input` (fonctionnels).
3. Container queries / `@container` en progressive enhancement (non activées).
4. Scripts de migration morts en racine : `apply_glass_everywhere.js`, `append_overrides.js`, `fix_softphone.js`, `rewrite_dashboard.js`, plus `debug.html` / `debug-buy-test.html` → à supprimer lors d'un commit.

## Actions restantes (hors refonte)
- `TELNYX_PUBLIC_KEY` + `TELNYX_SIP_CONNECTION_ID` : non définies sur Vercel (non bloquant pour l'UI).
- Aligner `CRON_SECRET` entre GitHub et Vercel.