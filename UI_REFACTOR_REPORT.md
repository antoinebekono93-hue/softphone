# UI / UX Refactor Report — Antigravity

Date : 11/09/2026
Périmètre : `app/` + `components/` — UI précédente (shadcn + Tailwind v3 `@layer components` + classes ad hoc) → design system maison (Tailwind v4 CSS-first, `@theme` tokens, primitives dans `components/ui/`).

Méthode : statique (aucune donnée métier touchée). Contraintes respectées : zéro mutation git, `app/api`, `lib`, `prisma`, `server`, `scripts` hors scope (chantier Telnyx voicemail WIP non modifié).

---

## Récapitulatif des phases

| Phase | Contenu | Statut |
|---|---|---|
| A | Audit (UI_AUDIT_REPORT.md, 83 pages, 50 composants, priorités P0/P1/P2) | ✅ |
| B0 | Fondations : tokens `@theme`, Button/Badge/Input/Textarea, toasts sonner | ✅ |
| B1 | Primitives : select, spinner, skeleton, empty-state, page-header, status-badge, tabs, modal+drawer | ✅ |
| B2 | Rollout P0/P1 par zone | ✅ (détails ci-dessous) |
| B3 | Validation `tsc --noEmit` + `next build --webpack` | ✅ |
| B4 | Rapport + scores + verdict | ✅ (ce document) |

## B2 — Ce qui a été livré

**Primitives créées (14)** : `button`, `badge`, `input`, `textarea`, `card`, `label`, `modal` (Modal + Drawer), `tabs`, `empty-state`, `spinner`, `skeleton`, `page-header`, `status-badge`, `select`.

**Tokens** : `app/globals.css` — 18 tokens `@theme` (accent-primary/secondary, surfaces, text, border-subtle, radius-card…) + 99 classes orphelines réparées. Classes legacy (`apple-btn`, `btn-primary*`, `n8n-gradient-bg`) conservées temporairement.

**Boutons → `<Button>`** (~50) :
- Dashboard : 39 via 3 agents (10 + 9 + 20) + manuel (PipelineClient 2).
- God-mode : 6 (messaging 2, voice, esim, pricing, livekit).
- Autres : login, register, buy-test, onboarding/number, CampaignDashboard (WhatsApp), CRMCrmApp. Les `<Link>` stylés bouton et les CTA marketing `n8n-gradient-bg` sont volontairement conservés (sémantique lien + identité marketing).

**Modales → `<Modal>`/`<Drawer>` (16)** : ContactsClient ×2, PipelineClient (modal + drawer), SequencesClient, TemplatesClient, social-campaigns, SmsDashboardClient, dashboard numbers, inbox, iot ×3, god-mode plans, god-mode numbers, CrmApp (CRM).
→ Élimine 16 overlays inline `position:fixed` ; apport : Escape + scroll-lock + header/X standardisés, `open` prop.

**Navigation par tabs → `<Tabs>` (3)** : verify (profiles/logs/api), inventory (catalogue/paniers/settings), iot (fleet/network). `SoftphoneWorkspace` et `Chatter` CRM conservés volontairement (identité visuelle propre).

**Headers & containers dashboard (9 pages)** : ai-team, verify, team, rag-memory, contacts/[id], revenue (h2→h1), calls, iot, sms/profiles/[id] → h1 `text-3xl font-bold tracking-tight` + container `p-8 max-w-7xl`.

**Wrappers god-mode (7)** : suppression des doubles conteneurs `p-10 max-w-6xl mx-auto` dans messaging, voice, esim, billing, compliance, channels, pricing (le layout(parent) les applique déjà).

**Auth** : login + register → `<Input>`/`<Button>`, text-sm, h1 text-3xl.

**Infra/B0** : react-hot-toast → `sonner` (10 fichiers), `app/error.tsx` nettoyé, `npx prisma generate` (client régénéré pour coller au schéma WIP voicemail).

## Validation (B3)

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur (multiples runs après chaque lot) |
| `npm run build` (`next build --webpack`) | ✅ EXIT=0, toutes les routes compilent |
| `npm run lint` | ⚠️ erreurs pré-existantes **uniquement dans `app/api/**`** (hors scope) — aucun fichier UI modifié |

## Scores par zone

| Zone | Score | Notes |
|---|---|---|
| Fondations (tokens/primitives/toasts) | 100 % | |
| Dashboard | 92 % | forts : boutons, modales, tabs, headers. Reste : familles de cartes P1-2, filtres inline, headers de pages secondaires |
| God-mode | 90 % | wrappers + boutons + modales. Reste : empty states / spinners, P2 |
| Auth (login/register) | 88 % | inputs + boutons convertis |
| Marketing | 55 % | CTAs conservés en `<Link>` par design ; normalisation radius P2-2 non faite |
| Softphone | 45 % | containers/status faits ; tabs + overlays (appel entrant…) conservés (légitimes) |
| Composants legacy (crm, whatsapp) | 70 % | modale + boutons crm migrés |

## Reste à faire (P2 + P1-2 ciblé)

1. **P1-2** : familles de cartes (8 patterns) vers `Card`/`CardHeader`… — gros chantier à découper zone par zone.
2. **P2-2** : radius marketing `rounded-[20/24/28/32/40px]` → tokens (`radius-card`), palette brute (~1910 occ.) → tokens.
3. **P2** : rollout `EmptyState`/`Spinner`/`Skeleton` sur les états chargement/vide restants ; icônes standardisées (size), transitions unifiées.
4. **Legacy CSS** : suppression des classes `apple-btn`/`btn-primary*` une fois toute adoption faite ; `components/whatsapp/` et `components/softphone/` à passer au design system (zone dédiée).
5. Headers de pages dashboard secondaires encore non normalisées (écran principal latéral, intégrations…).

## Verdict

Design system maison (tokens + primitives) **opérationnel et généralisé sur dashboard + god-mode + auth** (P0/P1). Type-check OK, build production OK. La dette restante est assumée : éléments volontairement conservés (liens-CTA, identités softphone/CRM, overlays live), et lots P2/P1-2 documentés à traiter par zone.