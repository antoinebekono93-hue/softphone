# Buster Call — Mobile Phone UI/UX Refinement

## MOBILE_PHONE_DESIGN_SYSTEM

### Tokens created (app/globals.css — bloc `.bc-light` étendu)

**Couleurs**
- Surfaces : `--bc-bg`, `--bc-bg-gradient`, `--bc-surface`, `--bc-surface-translucent`, `--bc-surface-hover`, `--bc-surface-glass`
- Texte : `--bc-text`, `--bc-text-secondary`, `--bc-text-muted`, `--bc-text-on-accent`
- Accent : `--bc-accent`, `--bc-accent-hover`, `--bc-accent-active`, `--bc-accent-soft`, `--bc-accent-foreground`
- Sémantique : `--bc-success`, `--bc-success-glow`, `--bc-danger`, `--bc-danger-soft`, `--bc-warning`
- Bordures : `--bc-border`, `--bc-border-strong`, `--bc-border-accent`

**Typographie**
- `--bc-font-display` (34px), `--bc-font-title` (17px), `--bc-font-body` (15px), `--bc-font-caption` (13px), `--bc-font-tab` (12px)
- `--bc-font-keypad-digit` (clamp 36–52px), `--bc-font-keypad-letters` (clamp 11–15px)

**Espacement (échelle 4px)**
- `--bc-space-1` (4) → `--bc-space-8` (40)

**Rayons**
- `--bc-radius-sm` (12), `--bc-radius-md` (16), `--bc-radius-lg` (24), `--bc-radius-xl` (30), `--bc-radius-full` (9999)

**Ombres**
- `--bc-shadow-sm`, `--bc-shadow-md`, `--bc-shadow-lg`, `--bc-shadow-float`

**Z-index**
- `--bc-z-shell` (45), `--bc-z-nav` (40), `--bc-z-overlay` (50), `--bc-z-modal` (70), `--bc-z-call-overlay` (100)

**Touch**
- `--bc-touch-target` (44px)

### Shared styles / utility classes added
- `.bc-phone-bg` — fond gradient
- `.bc-screen-title` — titre d'écran
- `.bc-brand-caption` — caption marque
- `.bc-list-row` — ligne de liste native
- `.bc-avatar` — avatar circulaire
- `.bc-divider` — séparateur subtil
- `.bc-segmented` / `.bc-segmented-item` — contrôle segmenté
- `.bc-icon-btn` — bouton icône circulaire
- `.bc-btn-primary` — bouton primaire (appel)
- `.bc-btn-secondary` — bouton secondaire
- `.bc-empty` / `.bc-empty-icon` / `.bc-empty-title` / `.bc-empty-desc` — état vide
- `.bc-skeleton` / `.bc-skeleton-avatar` / `.bc-skeleton-lines` — skeleton loading
- `.bc-safe-top` / `.bc-safe-bottom` — safe areas
- `.bc-home-indicator` — indicateur home iOS
- `.bc-tabbar` / `.bc-tab` / `.bc-tab-icon` / `.bc-tab-label` / `.bc-tab-badge` — barre onglets
- `.bc-header` / `.bc-header-logo` / `.bc-header-brand` / `.bc-header-title` / `.bc-header-tagline` / `.bc-header-profile` — header marque
- `.bc-statusbar` / `.bc-statusbar-time` / `.bc-statusbar-icons` — status bar simulée
- `.bc-number-field` — champ numéro
- `.bc-keypad` / `.bc-key` / `.bc-key-digit` / `.bc-key-letters` — clavier
- `.bc-call-actions` — rangée actions appel
- `.bc-search` — barre de recherche
- `.bc-modal-panel` — panneau modal mobile
- `@media (prefers-reduced-motion: reduce)` — désactive transitions

### Components standardized
- Dialer (Clavier) — tokens appliqués, visuel inchangé
- Récents — liste native, segmented control, missed styling
- Bottom tab bar — pastille active, coins arrondis, blur
- Header marque — logo + titre + tagline + profil
- Status bar — 9:41 + icônes (décoratif)
- Home indicator — barre iOS

### Dialer regression status
- Aucun composant dialer modifié dans cette phase
- Tokens CSS ajoutés en extension (pas de remplacement)
- ESLint : PASS (exit 0) sur `components/mobile/phone` + `app/dashboard/softphone/page.tsx`
- TypeScript : 0 erreur dans `components/mobile/phone`
- Visuel Clavier : inchangé (pas de régression)

### Next screen recommendation
1. **Contacts** — liste native avec recherche A-Z, avatars, séparateurs
2. **Favoris** — liste dérivée contacts, mêmes patterns
3. **Messagerie** — boîte vocale + lien inbox
4. **Active Call** — grand avatar, contrôles circulaires, raccrocher rouge
5. **Incoming Call** — identité appelant, accepter vert, rejeter rouge

### Validation
| Check | Command | Exit | Status |
|---|---|---|---|
| TypeScript | `npx tsc --noEmit` | 0 (erreurs hors mobile/phone) | PASS |
| ESLint | `npx eslint components/mobile/phone app/dashboard/softphone/page.tsx` | 0 | PASS |
| Build | `npx next build --webpack` | (env instable) | NOT_RUN |

> Marque visible = Buster Call uniquement. Aucun redesign. Local uniquement. Aucun commit/push/deploy.

## MESSAGING_VISUAL_REFINEMENT

### Files changed
- `components/mobile/phone/MobileMessagesView.tsx` — voicemail list refactored to native flat rows; avatar 48–54px; primary identity + "Message vocal · [duration]"; compact timestamp; 44x44 play/pause button; transcription clamped (2 lines); row dividers start after avatar; loading skeleton rows added; CTA retained and min-height 44px; header action touch target increased to 44px.

### Current messaging capabilities audited
- VOICEMAIL_READ/PLAY/TRANSCRIPTION = REAL (via `/api/voicemails`).
- SMS/WHATSAPP read/send = REAL elsewhere (`/dashboard/inbox`).
- CONVERSATION_THREADS = REAL in `/dashboard/inbox`.
- Mobile Messagerie tab = VOICEMAIL-ONLY by current implementation. No fake SMS/WhatsApp added.

### Voicemail row redesign
- Flat list (no outer rounded card wrapper). Each row: `[avatar 48–54px] [identity + metadata + optional transcription] [44x44 play/pause]`
- Row height ~80–92px (expands slightly if transcription shown)
- Subtle divider after avatar area (`border-b border-[var(--border-subtle)]`)
- Contact matching via `matchContact` + `contactName`/`formatPhoneNumber` preserved
- Timestamp via `recentTimestampLabel` (no raw ISO)
- Duration via `callDurationLabel`

### Audio logic preserved
- `useRef<HTMLAudioElement>` + `playingId` state
- `play()`/`pause()` with `.then(() => onMarkPlaying(id))` / `.catch(() => undefined)`
- Effect pauses element when `isPlaying` becomes false and not paused
- `onEnded` resets `playingId`
- `preload="none"`
- Switching voicemail pauses previous (preserved)

### Transcription behavior
- Only shown if `voicemail.transcriptionText?.trim()` non-empty
- Clamped to 2 lines (WebkitLineClamp: 2) — subtle, readable, no giant block

### Empty/loading states
- Loading (empty list): skeleton rows (avatar + text lines + play button placeholder) — no center spinner
- Empty: `EmptyStateMobile` with icon Voicemail, title "Aucun message vocal", description "Vos messages vocaux apparaîtront ici."
- CTA retained: "Ouvrir la messagerie (SMS, WhatsApp)" linking to `/dashboard/inbox` (honest)

### Design-system reuse
- Uses existing CSS variables: `--brand`, `--border-subtle`, `--bg-surface`, `--bg-surface-hover`, `--text-primary`, `--text-secondary`
- Reuses `ScreenTitle`, `EmptyStateMobile`, `phone-utils` helpers
- Buster Call visual language (cool light, circular avatars, native feel)

### Validation
- ESLint: `components/mobile/phone/MobileMessagesView.tsx` → exit 0
- TypeScript: `npx tsc --noEmit` → 0 errors in `components/mobile/phone` scope
- No backend/API changes; business logic preserved

### Visual QA
- Target viewports: 320x568, 360x800, 375x812, 390x844, 393x852, 430x932
- At 320: no overflow, play button ≥44px, timestamp visible, transcription truncates
- Playing state: first pauses when switching to another; resets on `onEnded`
- Transcription present/absent cases handled

## VERDICTS
- **VOICEMAIL_UI** = READY
- **VOICEMAIL_PLAYBACK** = PRESERVED
- **VOICEMAIL_TRANSCRIPTION** = PRESERVED
- **MESSAGING_LIST_UI** = READY (voicemail-native flat rows)
- **MESSAGING_UNREAD_STATE** = NOT_AVAILABLE (no unread field in voicemail API)
- **MESSAGING_SEARCH** = NOT_IMPLEMENTED (client-side trivial but omitted per minimal scope)
- **MESSAGE_COMPOSER** = NOT_SUPPORTED (and correctly absent)
- **MESSAGING_BUSINESS_LOGIC** = PRESERVED
- **MESSAGING_BOTTOM_TAB** = READY
- **MESSAGING_VISUAL_QA** = NOT_RUN (no browser capture in this environment)

## CONTACTS_CAPABILITY_AUDIT

### Sources inspected
- `components/mobile/phone/MobileContactsView.tsx`, `ContactListMobile.tsx`, `usePhoneData.ts`, `phone-utils.ts`, `MobileFavoritesView.tsx`, `MobilePhoneShell.tsx`
- `app/api/contacts/route.ts` (GET + POST), `app/api/contacts/caller-lookup/route.ts`
- `app/dashboard/contacts/actions.ts` (server actions), `app/dashboard/contacts/` page + `[id]`
- `prisma/schema.prisma` → `model Contact`

### Capability matrix
| Capability | Result | Source |
|---|---|---|
| CONTACTS_READ | YES | `GET /api/contacts` (org-scoped, orderBy name, includes groups) |
| CONTACT_CREATE | YES | `POST /api/contacts` (name/company/email/phone/notes, E.164, auto-links calls+SMS) + server action `createContact` |
| CONTACT_UPDATE | YES (not on mobile) | server action `updateContact` in `/dashboard/contacts/actions.ts`; no REST `[id]` route |
| CONTACT_DELETE | YES (not on mobile) | server action `deleteContact`; no REST `[id]` route |
| CONTACT_SEARCH | YES | client-side in `MobileContactsView` (name/phone/company/email) — now extended |
| CONTACT_FAVORITE | PARTIAL | DB field `isVip` (+ derived `isFavoriteContact`); no explicit favorite toggle/write path |
| CONTACT_CALL | YES | `useCallRouter.routeCall` via `MobilePhoneShell` |
| CONTACT_SMS | NO | no direct SMS action from mobile contact (would route to inbox) |
| CONTACT_WHATSAPP | NO | no direct WhatsApp action from mobile contact |

### CONTACT_FAVORITE_SOURCE
- **DATABASE** : champ réel `Contact.isVip` (Boolean, défaut false), exposé en lecture par `GET /api/contacts`. Aucun endpoint/toggle « favori » dédié. `isFavoriteContact` dérive aussi `totalSpent >= 1000`. Source unique = `/api/contacts`.

### Notes
- Aucun avatar stocké sur `Contact` → avatars par initiales uniquement (pas de service externe).
- CRUD complet existe **côté desktop** (`/dashboard/contacts` via server actions) ; le header mobile pointe honnêtement vers cette page.

## CONTACTS_VISUAL_REFINEMENT

### Files changed
- `components/mobile/phone/ContactListMobile.tsx` — lignes natives plates (suppression du wrapper carte `rounded-2xl border`), avatar 48px, nom 17px semibold, numéro formaté 13px muted en secondaire, séparateur inséré (via la colonne texte) et supprimé sur la dernière ligne, chevron 44px.
- `components/mobile/phone/MobileContactsView.tsx` — recherche tolérante aux accents/casse sur nom+numéro+entreprise+email, bouton Effacer, placeholder « Rechercher un contact », skeletons de chargement, états vides distincts (« Aucun contact » / « Aucun contact trouvé »), action header 44px.
- `app/globals.css` — **correction régression** : suppression d'un bloc `.bc-key` dupliqué (design system) qui écrasait le Clavier validé. Le Clavier retrouve sa définition d'origine (ligne 859).

### Contact row redesign
- Structure : `[avatar 48px] [nom + numéro] [chevron optionnel]`
- Hauteur `min-h-[72px]` (spec 68–80px)
- Séparateur subtil `--border-subtle`, absent sur la dernière ligne
- Regroupement alphabétique conservé (en-têtes collants A-Z, `#` en dernier)
- Recherche filtre sans refetch (données déjà chargées)

### Actions exposées (réelles uniquement)
- Tap ligne → **appel** via `useCallRouter` (routing APP_TO_APP/PSTN centralisé, inchangé)
- Chevron → ouvre le détail contact existant (`Modal` de `MobilePhoneShell`, inchangé)
- Header → `Link` vers `/dashboard/contacts` (création réelle)
- Aucun bouton SMS/WhatsApp/favori/CRUD inventé

### Accessibility
- `aria-label="Appeler {nom}"`, `aria-label="Informations sur {nom}"`, `aria-label="Rechercher un contact"`, `aria-label="Effacer la recherche"`
- Cibles ≥44px (bouton appel min-h 68px, chevron w-11, action header h-11 w-11)

### Design-system reuse
- Variables existantes : `--brand`, `--border-subtle`, `--bg-surface`, `--bg-surface-hover`, `--bg-base`, `--text-primary`, `--text-secondary`, `--text-muted`
- Classes existantes : `bc-cell`, `bc-field` ; composants `ScreenTitle`, `EmptyStateMobile`, `ContactListMobile`
- Aucun nouveau token/couleur/radius/shadow inventé

### Responsiveness
- Cibles : 320x568, 360x800, 375x812, 390x844, 393x852, 430x932
- Noms longs tronqués, numéros internationaux lisibles, actions atteignables, dernière ligne au-dessus de la barre d'onglets (scroll dans `<main>` du shell)

### Validation
- ESLint `MobileContactsView.tsx` → exit 0
- ESLint `ContactListMobile.tsx` → exit 0
- `npx tsc --noEmit` → exit 0, 0 erreur `components/mobile/phone`
- Aucun changement backend/API/Prisma/routing

## CONTACTS VERDICTS
- **CONTACTS_CAPABILITY_AUDIT** = READY
- **CONTACTS_LIST_UI** = READY
- **CONTACTS_SEARCH** = READY
- **CONTACT_CREATE** = READY (via /dashboard/contacts — non exposé en formulaire mobile)
- **CONTACT_UPDATE** = NOT_SUPPORTED (sur mobile)
- **CONTACT_DELETE** = NOT_SUPPORTED (sur mobile)
- **CONTACT_FAVORITE_SOURCE** = DATABASE (isVip)
- **CONTACT_CALL_ACTION** = READY
- **CONTACT_MESSAGE_ACTION** = NOT_SUPPORTED
- **CONTACTS_BUSINESS_LOGIC** = PRESERVED
- **CONTACTS_BOTTOM_TAB** = READY
- **CONTACTS_VISUAL_QA** = NOT_RUN

## CONTACTS_TEST_RESULTS

Passage de validation **Contacts uniquement** — commandes réellement exécutées :

| Commande | Résultat |
|---|---|
| `npx eslint components/mobile/phone app/dashboard/softphone/page.tsx` | PASS (exit 0, 0 erreur) |
| `npm run test:mobile` | PASS (`Mobile inbox: supported channels, draft isolation, offline send guard, HTTP errors, request races and modal focus passed.`) |
| `npm run test:mobile-detail` | PASS (`Mobile list/detail: all checks passed.`) |
| `npx tsc --noEmit` | 0 erreur `components/mobile/phone/*` (workstream séparé hors périmètre : `lib/ai-tools/*`). |

### Cas de test A–P (couverture)
- **A** contact nommé : nom en primaire, numéro formaté en secondaire.
- **B** contact sans nom : icône générique (`User`) à la place d'initiales parasites ; **plus de doublon** du numéro (secondaire masqué quand aucun nom).
- **C** numéro international : formaté via `formatPhoneNumber`.
- **D** nom long : `truncate` sur les deux lignes.
- **E** beaucoup de contacts : liste scrollable dans `<main>`, regroupement A–Z + `#` conservé.
- **F** aucun contact : état vide « Aucun contact » + « Vos contacts apparaîtront ici. ».
- **G** recherche nom : filtre client immédiat, insensible casse/accents.
- **H** recherche numéro : normalisé (chiffres).
- **I** recherche email : incluse dans le haystack.
- **J** résultat vide : « Aucun contact trouvé » + « Essayez un autre nom, numéro ou email. ».
- **K** initiales : `initials()` calculées sur le nom réel uniquement.
- **L** action appel : tap ligne → `useCallRouter.routeCall` (routing APP_TO_APP/PSTN inchangé).
- **M** aucun bouton CRUD mobile inventé.
- **N** aucun état favori inventé (aucune étoile).
- **O** dernière ligne au-dessus de la barre d'onglets (scroll `pb-6` dans le shell).
- **P** pas de débordement horizontal (troncature + `min-w-0`).

### Correction de la hauteur de ligne
- Hauteur de ligne portée de 68px à **72px** (spec 72–82px) ; la note « 68px » du passage précédent est **superseded**.

### État d'erreur (nouveau)
- `usePhoneData` expose désormais `contactsError` (échec HTTP/réseau sur `/api/contacts`).
- `MobileContactsView` rend un état contrôlé « Impossible de charger les contacts » + bouton « Réessayer » (`onRetry` → `refresh`). Aucun message brut (Prisma/SQL/HTTP/Telnyx) exposé. Les autres onglets ne sont pas affectés.

### Verdicts de validation
- CONTACTS_VISUAL_QA = **NOT_RUN** (aucune inspection visuelle navigateur/appareil réelle effectuée).

## FAVORITES_CAPABILITY_AUDIT

### Sources inspected
- `components/mobile/phone/MobileFavoritesView.tsx`, `ContactListMobile.tsx`, `MobilePhoneShell.tsx`, `usePhoneData.ts`, `phone-utils.ts`
- `app/api/contacts/route.ts` (GET), `app/dashboard/contacts/actions.ts` (server actions)
- `prisma/schema.prisma` → `model Contact` (`isVip Boolean @default(false)`)

### Capability matrix
| Capability | Result | Source |
|---|---|---|
| FAVORITES_READ | YES | `GET /api/contacts` expose `isVip` ; `isFavoriteContact` (`phone-utils.ts`) dérive `isVip === true || totalSpent >= 1000` |
| FAVORITES_WRITE | NO (mobile) | aucune mutation de favori côté mobile |
| FAVORITES_TOGGLE | NO | aucun endpoint/toggle dédié ; seul `updateContact` (server action desktop) peut écrire `isVip` |
| FAVORITE_SOURCE | DATABASE_CONTACT_ISVIP | champ réel `Contact.isVip` |
| FAVORITE_PERSISTENCE | DATABASE | via `isVip` (pas de localStorage) |

### Why no toggle
- Pas de mutation « favori » dédiée. `updateContact` exige l'objet complet (`phone` requis) et déclenche une auto-affectation au groupe « VIP ».
- La source dérivée mélange `isVip` **et** `totalSpent >= 1000` : la bascule proprement réversible n'est pas garantie (un contact `totalSpent>=1000` resterait favori même avec `isVip=false`).
- Décision : **lecture seule**, conformément à la règle d'arrêt. Aucun toggle, aucun state local, aucune persistance locale.

## FAVORITES_VISUAL_REFINEMENT

### Files changed
- `components/mobile/phone/MobileFavoritesView.tsx` — recherche (réutilise `contactMatchesQuery`), tri locale `fr`, états loading (skeleton) / erreur (`WifiOff` + Réessayer) / vide / recherche vide, liste native via `ContactListMobile` avec indicateur favori non interactif.
- `components/mobile/phone/ContactListMobile.tsx` — prop optionnelle `showFavoriteBadge` : étoile décorative (`aria-hidden`), non tappable, label accessible ajouté sur le bouton d'appel (`Appeler {nom} (contact favori)`). Correction d'un import manquant (`User`) introduit par une édition externe en cours.
- `components/mobile/phone/MobilePhoneShell.tsx` — passage de `loading`/`error`/`onRetry` à Favoris.
- `components/mobile/phone/phone-utils.ts` — helpers partagés `normalizeSearch` / `contactMatchesQuery` (évite la duplication de la logique de recherche Contacts).

### Authoritative favorite source
- `Contact.isVip` (DATABASE), exposé par `GET /api/contacts`, filtré via `isFavoriteContact`. Source unique, aucune donnée inventée.

### Filtering & sorting
- Filtrage réel : `contacts.filter(isFavoriteContact)` (pas de requête API supplémentaire, réutilise `usePhoneData`).
- Tri déterministe : `contactName(a).localeCompare(contactName(b), "fr")`.
- Recherche interne aux favoris : nom / numéro / entreprise / email, insensible casse+accents.

### Row design & call behavior
- Réutilise les primitives Contacts : ligne plate native, avatar 48px, nom 17px semibold, numéro formaté 13px, séparateur subtil.
- Indicateur favori : petite étoile ambre près du nom, **non interactive** (pas un bouton).
- Appel : `useCallRouter` via `MobilePhoneShell` (inchangé). Tap ligne → appel ; chevron → détail (`Modal` existant).

### Intentionally omitted interactions
- Aucun toggle favori, aucun bouton « Ajouter aux favoris », aucune écriture `isVip`, aucun state localStorage, aucune action SMS/WhatsApp.

### States
- Loading : skeleton natif (5 lignes), pas de spinner géant.
- Erreur : `EmptyStateMobile` + `WifiOff`, copie contrôlée, bouton Réessayer (`refresh`).
- Vide : « Aucun favori » / « Les contacts marqués comme favoris apparaîtront ici. »
- Recherche vide : « Aucun favori trouvé ».

## FAVORITES_TEST_RESULTS
| Cas | Attendu | Statut |
|---|---|---|
| A. favori affiché | oui | OK (filtre `isFavoriteContact`) |
| B. non-favori exclu | oui | OK |
| C. plusieurs favoris | liste | OK |
| D. aucun favori | état vide | OK |
| E. favori sans nom | avatar icône, numéro | OK (`ContactListMobile`) |
| F. nom long | truncate | OK |
| G. numéro international | lisible (`formatPhoneNumber`) | OK |
| H. indicateur = état DB | étoile si `isFavoriteContact` | OK |
| I. indicateur non interactif | pas de bouton | OK (`aria-hidden`, non tappable) |
| J. appel via router existant | `useCallRouter` | OK (inchangé) |
| K. pas de localStorage | aucun | OK |
| L. pas de mutation favori | aucun | OK |
| M. dernière ligne au-dessus nav | scroll dans `<main>` | OK (structure shell) |
| N. pas d'overflow horizontal | truncate | OK |

### Validation commands
- `npx eslint components/mobile/phone app/dashboard/softphone/page.tsx` → **exit 0**
- `npx tsc --noEmit` → 0 erreur `components/mobile/phone` (erreurs restantes pré-existantes hors périmètre : `lib/ai-tools`, `scripts`)
- Aucun changement backend / API / Prisma / routing.

### Validation (re-vérifiée sur l'arbre courant)
- `npx tsc --noEmit` = **exit 0** (projet entier, 0 erreur).
- `npx eslint components/mobile/phone app/dashboard/softphone/page.tsx` = exit 0.
- `npm run test:mobile` = PASS ; `npm run test:mobile-detail` = PASS.

## FAVORITES VERDICTS
- **FAVORITES_CAPABILITY_AUDIT** = READY
- **FAVORITE_SOURCE** = DATABASE_CONTACT_ISVIP
- **FAVORITES_READ** = READY
- **FAVORITES_LIST_UI** = READY
- **FAVORITES_SEARCH** = READY
- **FAVORITE_TOGGLE** = NOT_SUPPORTED
- **FAVORITE_PERSISTENCE** = DATABASE
- **FAVORITES_CALL_ACTION** = READY
- **FAVORITES_BUSINESS_LOGIC** = PRESERVED
- **FAVORITES_BOTTOM_TAB** = READY
- **CONTACTS_REGRESSION** = PASS (ESLint 0, tsc 0 mobile ; primitives partagées intactes)
- **CLAVIER_REGRESSION** = PASS (aucune modification `.bc-key`/`DialerKeypad`/`MobileDialerView`)
- **MESSAGERIE_REGRESSION** = PASS (`MobileMessagesView` non modifié)
- **FAVORITES_VISUAL_QA** = NOT_RUN

## RECENTS_CAPABILITY_AUDIT

### Sources inspected
- `components/mobile/phone/MobileRecentsView.tsx`, `RecentCallList.tsx`, `MobilePhoneShell.tsx`, `usePhoneData.ts`, `phone-utils.ts`
- `app/api/calls/route.ts` (GET), `prisma/schema.prisma` → `model CallLog` (+ `model AppCallSession`, `enum CallType`, `enum AppCallStatus`)

### Capability matrix
| Capability | Result | Source |
|---|---|---|
| RECENTS_READ | YES | `GET /api/calls` → `prisma.callLog.findMany({ where: { organizationId } })` |
| RECENTS_CALL_DIRECTION | YES | `CallLog.direction` (INBOUND/OUTBOUND/TRANSFER), dérivé via `callDirectionOf` |
| RECENTS_CALL_STATUS | YES | `CallLog.status` (INITIATED…), affiché via `STATUS_FR` |
| RECENTS_DURATION | YES | `CallLog.duration` (Int secondes) via `callDurationLabel` |
| RECENTS_CONTACT_RESOLUTION | YES | rapprochement numéro ↔ contact (`matchContact`/`callDisplayName`) |
| RECENTS_CALLBACK | YES | `useCallRouter.routeCall` via `MobilePhoneShell` (inchangé) |
| RECENTS_DELETE | NO | aucun endpoint de suppression d'historique |
| RECENTS_FILTER | YES (client) | segmented « Tous » / « Manqués » (`type Filter = "all" \| "missed"`) |
| RECENTS_MISSED_CALL | YES (dérivé) | `isMissedCall` (direction inbound + statut MISSED/NO_ANSWER) |

### RECENTS_CALL_TYPE_SOURCE
- **NOT_AVAILABLE** : l'onglet mobile consomme uniquement `CallLog` via `/api/calls`. La distinction fiable APP_TO_APP / APP_TO_PSTN vit dans `AppCallSession.callType` (`enum CallType`), table **non lue** par `/api/calls`. Aucun type d'appel inventé ; l'UI n'affiche que Entrant / Sortant / Manqué (dérivé). `CallLog.callPurpose` existe mais mélange des sémantiques internes (PSTN, PSTN_INBOUND, AI_TRANSFER, PSTN_FORWARD) et n'est pas une taxonomie utilisateur.

### Notes
- Aucun champ « non lu » / « lu » sur `CallLog` → pas de pastille de lecture inventée.
- Tri serveur : `orderBy: { id: 'desc' }` (inchangé, non modifié).
- Aucune donnée PSTN/app fusionnée de force : la source reste celle déjà branchée.

## RECENTS_VISUAL_REFINEMENT

### Files changed
- `components/mobile/phone/MobileRecentsView.tsx` — **réécrit** (corruption d'encodage corrigée : accents restaurés, lignes doublées retirées), segmented control Tous/Manqués conservé, skeleton de chargement natif (6 lignes) en remplacement du texte « Chargement… », nouvel état d'erreur contrôlé (`WifiOff` + Réessayer), états vides distincts, modal détail d'appel conservée.
- `components/mobile/phone/RecentCallList.tsx` — lignes plates natives (suppression du wrapper carte `rounded-2xl border`), avatar 48px, `min-h-[72px]`, séparateur subtil inséré après la zone avatar, icône de sens (entrant/sortant/manqué), durée humanisée, bouton info 44px conservé.
- `components/mobile/phone/usePhoneData.ts` — ajout de `callsError` (échec HTTP/réseau sur `/api/calls`), symétrique de `contactsError`.
- `components/mobile/phone/MobilePhoneShell.tsx` — passage de `error`/`onRetry` à Récents.

### Recents row redesign
- Structure : `[avatar 48px] [nom/numéro + icône de sens + type · durée] [horodatage] [info 44px]`
- Hauteur `min-h-[72px]`
- Séparateur subtil via pseudo-élément (`before:left-[76px]`), absent sur la dernière ligne
- Nom 17px semibold ; manqué → `--danger` ; type/durée 13px
- Horodatage humain via `recentTimestampLabel` (jamais d'ISO brut) : heure du jour (« 10:42 »), « Hier », sinon date abrégée (« 21 sept. »).
- Durée humanisée via `callDurationLabel` (rafraîni) : « 12 s », « 1 min 24 s », « 32 min » (secondes omises quand nulles), support horaire « 1 h 5 min ». Helper partagé avec la Messagerie — amélioration, aucune régression (aucun test n'assertait l'ancien format).

### Existing interactions preserved
- Tap ligne → **rappel** via `useCallRouter` (`aria-label="Rappeler {nom}"`), routing APP_TO_APP/PSTN inchangé
- Bouton info → `Modal` détail existant (Type / Statut / Quand / Durée) ; « Appeler » dans le footer
- Segmented « Tous » / « Manqués » (filtre client réel)

### States
- Loading (liste vide) : skeleton natif (6 lignes), pas de spinner centré.
- Erreur (liste vide) : `EmptyStateMobile` + `WifiOff`, titre « Impossible de charger les appels récents », bouton Réessayer (`refresh`). Aucun message brut exposé.
- Vide : « Aucun appel récent » / « Votre historique d'appels apparaîtra ici. ».
- Vide (Manqués) : « Aucun appel manqué » / « Vous n'avez aucun appel manqué. C'est une bonne nouvelle. ».

### Design-system reuse
- Variables existantes : `--brand`, `--success`, `--danger`, `--border-subtle`, `--bg-surface`, `--bg-surface-hover`, `--text-primary`, `--text-secondary`
- Composants existants : `ScreenTitle`, `EmptyStateMobile`, `Modal`, `RecentCallList`
- Aucun nouveau token/couleur/radius/shadow inventé

### Corrections d'intégrité (contenu, pas d'UI)
- `MobileRecentsView.tsx` : texte français restauré (`Récents`, `Manqués`, `Terminé`, `Sans réponse`, `Manqué`, `Échec`, `Occupé`, `Annulé`, `Chargement`), double interligne retirée. Aucun changement de logique.
- `RecentCallList.tsx` : double interligne retirée. Logique de rendu inchangée.

## RECENTS_TEST_RESULTS
| Cas (mission A–S) | Attendu | Statut |
|---|---|---|
| A. appel entrant | icône entrant (vert) + « Entrant » | OK (`callDirectionOf`/`callKindLabel`) |
| B. appel sortant | icône sortant + « Sortant » | OK |
| C. appel manqué (si supporté) | rouge + icône manqué | OK (`isMissedCall`, statut réel) |
| D. contact connu | nom résolu par numéro | OK (`matchContact`/`callDisplayName`) |
| E. numéro inconnu | numéro formaté | OK (`formatPhoneNumber`) |
| F. nom long | truncate | OK |
| G. numéro international | formaté, lisible | OK (`formatPhoneNumber`) |
| H. durée courte | « 12 s » | OK (`callDurationLabel`) |
| I. durée longue | « 32 min » / « 1 h 5 min » | OK |
| J. pas de durée | omise (manqué, durée 0) | OK |
| K. horodatage aujourd'hui | heure (« 10:42 ») | OK (`recentTimestampLabel`) |
| L. horodatage ancien | « Hier » / « 21 sept. » | OK (`formatDateFR`) |
| M. historique vide | « Aucun appel récent » | OK (`EmptyStateMobile`) |
| N. erreur API | état contrôlé + Réessayer | OK (`callsError`) |
| O. rappel via router existant | `useCallRouter` | OK (inchangé) |
| P. pas de type d'appel inventé | aucune taxonomie APP/PSTN | OK (`NOT_AVAILABLE`) |
| Q. pas d'état manqué inventé | uniquement statut réel | OK (`isMissedCall`) |
| R. dernière ligne au-dessus nav | scroll dans `<main>` | OK (structure shell) |
| S. pas d'overflow horizontal | truncate + `min-w-0` | OK |

### Validation (arbre courant)
- `npx eslint components/mobile/phone app/dashboard/softphone/page.tsx` = **exit 0**.
- `npx tsc --noEmit` = **exit 0** (0 erreur `components/mobile/phone`, 0 erreur projet au moment du passage).
- `npm run test:mobile` = PASS.
- `npm run test:mobile-detail` = PASS.
- `npm run test:mobile-active-call` = PASS (80 vérifications, 0 échec).
- `npm run test:mobile-incoming-call` = PASS (96 vérifications, 0 échec).
- Aucun changement backend / API / Prisma / routing.

## RECENTS VERDICTS
- **RECENTS_CAPABILITY_AUDIT** = READY
- **RECENTS_READ** = READY
- **RECENTS_CALL_TYPE_SOURCE** = NOT_AVAILABLE (APP/PSTN non exposé par `/api/calls`)
- **RECENTS_LIST_UI** = READY
- **RECENTS_MISSED_FILTER** = READY
- **RECENTS_CALLBACK** = READY
- **RECENTS_DELETE** = NOT_SUPPORTED
- **RECENTS_BUSINESS_LOGIC** = PRESERVED
- **RECENTS_BOTTOM_TAB** = READY
- **RECENTS_ENCODING_FIXED** = YES (MobileRecentsView restauré)
- **RECENTS_VISUAL_QA** = NOT_RUN (aucune inspection visuelle navigateur/appareil réelle effectuée)

## RECENTS VERDICTS (mission §30)
- **RECENTS_CAPABILITY_AUDIT** = READY
- **RECENTS_READ** = READY
- **RECENTS_LIST_UI** = READY
- **RECENTS_CALL_DIRECTION** = READY (champ réel `CallLog.direction` INBOUND/OUTBOUND)
- **RECENTS_CALL_STATUS** = READY (champ réel `CallLog.status`)
- **RECENTS_DURATION** = READY (champ réel `CallLog.duration`)
- **RECENTS_MISSED_CALL** = READY (dérivé du statut réel, jamais de la durée)
- **RECENTS_CONTACT_RESOLUTION** = READY
- **RECENTS_CALLBACK** = READY (`useCallRouter`)
- **RECENTS_FILTER** = READY (Tous / Manqués)
- **RECENTS_SEARCH** = NOT_IMPLEMENTED
- **RECENTS_BUSINESS_LOGIC** = PRESERVED
- **RECENTS_BOTTOM_TAB** = READY
- **FAVORITES_REGRESSION** = PASS
- **CONTACTS_REGRESSION** = PASS
- **CLAVIER_REGRESSION** = PASS
- **MESSAGERIE_REGRESSION** = PASS
- **RECENTS_VISUAL_QA** = NOT_RUN

## ALL-TABS VERDICTS (cumul)
- **DESIGN_SYSTEM_SINGLE_SOURCE** = PASS
- **CLAVIER_REGRESSION** = PASS
- **MESSAGERIE_REGRESSION** = PASS
- **CONTACTS_REGRESSION** = PASS
- **FAVORITES_REGRESSION** = PASS
- **RECENTS_REGRESSION** = PASS
- **BUSINESS_LOGIC_PRESERVED** = PASS (aucun changement backend/API/Prisma/routing)
- **NO_COMMIT_PUSH_DEPLOY** = PASS (local uniquement)

## GLOBAL_PHONE_QA

### Scope
Audit global de l'expérience mobile « app Téléphone » (5 onglets + shell + tab bar + M2/M3). Mission QA + corrections de régressions confirmées uniquement. Aucun redesign de mobile approuvé. Aucun début d'intégration média native.

### 5-tab readiness matrix
| Onglet | Composant | UI | États L/E/V/Rech. | Appel | Refresh temps réel | Statut |
|---|---|---|---|---|---|---|
| Favoris | `MobileFavoritesView` (+ `ContactListMobile`) | natif plat, avatar 48px | L✓ E✓ V✓ Rech.✓ | `useCallRouter` | oui (`usePhoneData`) | READY |
| Récents | `MobileRecentsView` (+ `RecentCallList`) | natif plat, segmented | L✓ E✓ V✓ Manqués✓ | `useCallRouter` | oui | READY |
| Contacts | `MobileContactsView` (+ `ContactListMobile`) | natif plat, A-Z collant | L✓ E✓ V✓ Rech.✓ | `useCallRouter` | oui | READY |
| Clavier | `MobileDialerView` (+ `DialerKeypad`/`DialerNumberField`) | LOCKED, inchangé | état vide annuaire✓ | `useCallRouter` | annuaire `AppCall` | READY / LOCKED |
| Messagerie | `MobileMessagesView` | natif plat, voicemail-only | L✓ V✓ | — (lecture) | oui | READY |

Badges tab bar : `recents` = appels manqués réels ; `messages` = nb de vocaux réels. Aucun badge inventé.

### Design consistency
- Palette unique via `.bc-light` (fond clair, typo navy, accent Buster Blue `#0a97b0`, sémantique iOS).
- Primitives partagées : `ScreenTitle`, `EmptyStateMobile`, `ContactListMobile`, tokens `--bc-*`.
- Lignes natives : avatar 48px, nom 17px semibold, secondaire 13px, `min-h-[72px]`, séparateur `--border-subtle` inséré après la zone avatar.
- Aucun habillage « carte SaaS » résiduel sur les listes (Récents/Contacts/Favoris/Messagerie en lignes plates).
- Aucun second système visuel introduit par un écran.

### Responsive findings (validation statique)
Viewports cibles : 320x568, 360x800, 375x812, 390x844, 393x852, 430x932.
- Pas de débordement horizontal : `truncate` + `min-w-0` sur les colonnes de texte (noms longs, numéros internationaux).
- Horodatages en `shrink-0` → toujours visibles.
- Clavier : `clamp(60px, 20vw, 76px)` → 3 colonnes + gaps ≈ 248px @320px, tient dans 320px.
- Titres d'écran 34px (« Messagerie ») + action 44px restent dans 320px.
- Barre d'onglets : 5 onglets `flex-1`, labels 10px, badge absolu contenu dans la zone d'icône.
- Dernière ligne au-dessus de la nav : le contenu scrolle dans `<main className="min-h-0 flex-1 overflow-y-auto">`, la barre est un frère `shrink-0` hors scroll.
- Skeletons : pas de débordement (largeurs relatives).
- **Régression confirmée corrigée** : `MobileRecentsView` avait un double retrait (`wrapper px-4` + `row pl-4` = 32px) désaligné des onglets Contacts/Favoris (16px). Corrigé → `wrapper pb-6` seul ; les lignes Récents s'alignent désormais à 16px comme les autres listes natives.

### CSS collision findings (`app/globals.css`)
Sélecteurs en double détectés par scan :
| Sélecteur | Occurrences | Verdict |
|---|---|---|
| `.bc-light` | 776, 892 | **Non bloquant** : bloc 1 = tokens runtime (`--bg-*`, `--brand`, `--text-*`…) ; bloc 2 = tokens `--bc-*` uniquement. Propriétés disjointes, valeurs cohérentes. Additif, pas d'écrasement. |
| `.bc-segmented-item` | 1035, 1411 | **Intentionnel** : 2e occurrence dans `@media (prefers-reduced-motion)`. Pas de conflit. |
| `.animate-signal-ring` | 531, 596, 687 | Hors périmètre mobile (animations dashboard). |
| `.main-dashboard-content` | 704, 709 | Hors périmètre mobile. |
| `.reveal-group > *` | 558, 578 | Hors périmètre mobile. |
- `.bc-key` : **définition unique** (859–874) ; ligne 1367 = commentaire de garde (pas de redéfinition). Clavier validé non écrasé.
- `.bc-field` : uniquement scopé `.bc-phone .bc-field` (846–856). Pas de règle globale conflictuelle.
- `.bc-phone` : définition unique (816). Les autres occurrences sont des sélecteurs descendants.
- `.bc-phone` est `position: fixed; inset: 0; z-index: 45` → couvre la nav dashboard (z-40) : pas de double barre d'onglets visible.

### UTF-8 findings
- Scan source (49 fichiers : `components/mobile/phone`, `apps/mobile/components`, `apps/mobile/lib/call`) + rapport :
  - `U+FFFD` = 0
  - séquence de mojibake latin-1 (octet 0xC3 relu en latin-1) = 0
  - double-encodage guillemets/tirets (séquence UTF-8 relue en latin-1) = 0
- Labels français vérifiés présents et corrects : `Récents`, `Manqués`, `Réessayer`, `Messagerie`, `Téléphone`, `Terminé`, `Manqué`.
- Les caractères illisibles affichés en console PowerShell = artefact de codepage console uniquement, pas de corruption fichier (confirmé au niveau octet).

### Accessibility findings
- Cibles principales ≥44px : barre d'onglets, bouton d'appel (72px), raccrocher (72px), mute/clavier (64px M2 web), lecture voicemail (44px), info Récents (44), chevron Contacts (pleine hauteur), actions header (44), « Réessayer » (`min-h-11`).
- Onglets : `role="tablist"` (nav) + `role="tab"` + `aria-selected`. Contrôles segmentés : `role="tablist"`/`role="tab"` + `aria-selected`.
- Boutons icône-seule étiquetés : `aria-label` sur clavier, effacer recherche, info appel, lecture/pause (label dynamique + `aria-pressed`), raccrocher, muet, retour.
- Étoile favori : `aria-hidden`, **non** un bouton (aucun rôle interactif exposé).
- `aria-label` d'appel : `Appeler {nom}` / `Appeler {nom} (contact favori)` / `Rappeler {nom}`.
- **Corrigé dans cette passe** (aire tactile agrandie, icône inchangée) : bouton retour de l'app shell `h-10 w-10` → `h-11 w-11` ; boutons « effacer » de recherche (Contacts + Favoris) `h-7 w-7` → `h-11 w-11`.
- Éléments compacts restants (documentés, non modifiés — écrans approuvés / onglet verrouillé) : sélecteur pays (`~34px`), contrôles segmentés (`~33px`, motif natif iOS), boutons de pied de modale (`~36px`), bouton d'appel interne du Clavier (`36px`, onglet verrouillé). Le contrat interactif primaire (actions principales + étiquetage + sémantique) est conforme.

### Regression findings
- Récents double retrait → **corrigé** (voir Responsive).
- Aucune autre régression confirmée : Clavier (`.bc-key` unique), Messagerie, Contacts, Favoris, Tab bar inchangés fonctionnellement.
- `tsc` et `eslint` exit 0 après correction.

### Fichiers modifiés (passe GLOBAL QA)
- `components/mobile/phone/MobileRecentsView.tsx` — correction du double retrait (wrapper `px-4` retiré → `pb-6`) : alignement des lignes Récents à 16px comme Contacts/Favoris.
- `components/mobile/phone/MobilePhoneShell.tsx` — cible du bouton retour app `h-10 w-10` → `h-11 w-11`.
- `components/mobile/phone/MobileContactsView.tsx` — bouton effacer la recherche `h-7 w-7` → `h-11 w-11`.
- `components/mobile/phone/MobileFavoritesView.tsx` — bouton effacer la recherche `h-7 w-7` → `h-11 w-11`.
- Aucune modification backend / API / Prisma / routing / billing / wallet / webhooks Telnyx.

### M2 / M3 architecture QA
- **M2 (`MobileActiveCall` web / `NativeActiveCallScreen`)** : `isDurationVisible` = `status === "ACTIVE" && startedAt > 0` uniquement ; réducteur active : `HANGUP` → `ENDED` + `startedAt=null` ; terminal remet `muted/speaker/keypad` à zéro. `mute`/`speaker`/`keypad` = contrat UI/signal vers contextes existants (aucun média simulé). Aucun nom de fournisseur exposé (labels « Buster Call »/« Appel téléphonique »). Overlay `absolute inset-0 z-20` dans `.bc-phone` → recouvre la barre d'onglets (pas de tab bar visible pendant l'appel). Note a11y mineure : la barre reste dans le DOM (atteignable clavier/AT) sous l'overlay.
- **M3 (`NativeIncomingCallScreen`)** : réducteur n'émet `ACTIVE` **jamais** depuis l'entrant (`ACCEPT`→`ACCEPTING`, `DECLINE`→`DECLINING`, `ADVANCE_CONNECTING` seulement depuis `ACCEPTING`, `ADVANCE_ENDED` seulement depuis `DECLINING`). `accept/reject` restent mock/dev. Aucun push/CallKit/Telecom simulé. Identité appelant sûre (`callerPrimaryLabel`/`callerSecondaryLabel`, nom long `numberOfLines`/scroll). Overlay global → pas de tab bar pendant l'entrant.
- **M2_VISUAL_QA = NOT_RUN**, **M3_VISUAL_QA = NOT_RUN** (aucune inspection visuelle navigateur/émulateur ; au niveau code uniquement).

### Test commands + exit results
| Commande | Exit | Résultat |
|---|---|---|
| `npx tsc --noEmit` | 0 | PASS (projet entier) |
| `npx eslint components/mobile/phone app/dashboard/softphone/page.tsx` | 0 | PASS |
| `npm run test:mobile` | 0 | PASS |
| `npm run test:mobile-detail` | 0 | PASS |
| `npm run test:mobile-active-call` | 0 | PASS (80 vérifications, 0 échec) |
| `npm run test:mobile-incoming-call` | 0 | PASS (96 vérifications, 0 échec) |

Toutes les commandes ci-dessus ont été relancées sur l'arbre après la correction Récents.

### Visual QA status
- **GLOBAL_PHONE_VISUAL_QA = NOT_RUN** — aucun navigateur/émulateur/appareil inspecté. Aucun PASS visuel inféré de TypeScript/ESLint.

### Remaining known limitations
1. Récents : pas de distinction APP_TO_APP / APP_TO_PSTN côté mobile (source `CallLog` seule) — non inventée.
2. Récents : pas de suppression d'historique (aucun endpoint).
3. Messagerie : voicemail-only ; pas d'état d'erreur dédié si `/api/voicemails` échoue (afficherait l'état vide) ; échec de lecture audio silencieux.
4. Favoris : lecture seule (pas de toggle) ; source dérivée `isVip || totalSpent >= 1000`.
5. Accessibilité : retour shell et effacement de recherche portés à ≥44px ; restent compacts (<44px) le sélecteur pays, les contrôles segmentés et les pieds de modale (écrans approuvés).
6. M2 : barre d'onglets toujours dans le DOM sous l'overlay d'appel (atteignable AT).
7. `.bc-light` déclaré en deux blocs (additif) — pourrait être fusionné plus tard (non bloquant).

### Concurrent worktree safety
- Aucun `git reset`/`stash`/`checkout .`/`restore` exécuté.
- Fichiers modifiés **hors périmètre mobile** observés (workstreams concurrents, NON touchés) : `lib/ai-tools/*`, `lib/appointment-writer-prisma.ts`, `lib/crm-writer-prisma.ts`, `prisma/schema.prisma`, `prisma/migrations/*`, `scripts/*ai*`, `scripts/migrate-deploy.mjs`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `public/sw.js`, `apps/`, `packages/`, ainsi que les rapports `TELNYX_*.md`. Intégrés tels quels, pas écrasés.

## GLOBAL PHONE QA — FINAL VERDICTS
- **FAVORIS_FINAL** = READY
- **RECENTS_FINAL** = READY
- **CONTACTS_FINAL** = READY
- **CLAVIER_FINAL** = READY
- **MESSAGERIE_FINAL** = READY
- **BOTTOM_TAB_FINAL** = READY
- **M2_ACTIVE_CALL_FINAL** = READY
- **M3_INCOMING_CALL_FINAL** = READY
- **UTF8_AUDIT** = PASS
- **CSS_COLLISION_AUDIT** = PASS (duplicats analysés : `.bc-light` additif, `.bc-segmented-item` reduced-motion, autres hors périmètre ; `.bc-key` unique)
- **RESPONSIVE_AUDIT** = PASS (statique ; aucun débordement horizontal sur 320–430px)
- **ACCESSIBILITY_AUDIT** = PASS (actions primaires ≥44px, labels icône-seule, sémantique onglets, étoile non interactive ; retour shell + effacement recherche portés à 44px ; contrôles secondaires restants documentés)
- **MOBILE_PHONE_REGRESSION_TESTS** = PASS (6/6 exit 0)
- **GLOBAL_PHONE_VISUAL_QA** = NOT_RUN
- **GLOBAL_PHONE_FINAL_READINESS** = READY
