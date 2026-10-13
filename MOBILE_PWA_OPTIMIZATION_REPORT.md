# MOBILE & PWA OPTIMIZATION REPORT

**Projet :** Buster Call (`antigravity-saas`)
**Date :** 10 octobre 2026
**Périmètre :** expérience mobile et PWA du dashboard authentifié
**Nature :** audit, corrections ciblées, tests. Aucune opération git (commit/push/reset/stash/revert) réalisée par cette intervention.

> Ce rapport ne revendique **aucune** mesure de performance réelle, **aucune** validation sur appareil physique et **aucune** capture de navigateur. Les seuls résultats marqués `PASS` sont ceux reproductibles par script dans l'environnement de travail.

---

## A. Périmètre et méthode

- Le travail a consisté à **continuer** le chantier mobile/PWA existant, pas à le réécrire.
- Méthode : lecture du code réel, exécution des tests, `tsc --noEmit`, tentative de build, puis verdict par section.
- Les décisions d'architecture existantes ont été conservées : liste → détail plein écran, brouillons isolés, hors-ligne sans envoi automatique, providers téléphonie persistants, service worker sans cache générique authentifié.
- **Verdict :** `PASS` (méthode appliquée).

## B. Inventaire des fichiers concernés

- Shell : `app/dashboard/layout.tsx`, `app/layout.tsx`, `app/globals.css`.
- Navigation : `components/layout/MobileBottomNav.tsx`, `app/dashboard/DashboardSidebar.tsx`, `app/dashboard/more/page.tsx`.
- Inbox/détail : `app/dashboard/inbox/InboxClient.tsx`, `app/dashboard/whatsapp-inbox/WhatsAppInboxClient.tsx`, `app/dashboard/messages/layout.tsx`, `app/dashboard/contacts/[id]/page.tsx`, `hooks/useMobileDetail.ts`.
- Hors-ligne : `lib/offline-store.ts`, `hooks/useOnline.ts`, `app/~offline/page.tsx`.
- PWA : `next.config.ts`, `worker/index.ts`, `public/manifest.json`, `components/pwa/PwaInstallBanner.tsx`, `components/pwa/PrivateStorageBoundary.tsx`.
- Données locales : `hooks/useCallHistory.ts`.
- Testé par : `scripts/test-mobile-experience.ts`, `scripts/test-mobile-detail-views.ts`, `scripts/test-pwa-service-worker.ts`.

## C. Navigation mobile (barre basse + écran Plus)

- `MobileBottomNav` expose 5 entrées : **Discussions / Appels / Contacts / Assistant / Plus**, avec `aria-current` et un indicateur d'appel en cours.
- Le header mobile du dashboard est fourni par `DashboardSidebar` (logo + accès menu) ; le padding haut du contenu mobile est donc justifié.
- L'écran `More` regroupe les outils de gestion moins fréquents.
- **Verdict :** `PASS` (structure conforme, non mesuré visuellement).

## D. Inbox — liste/détail et retour navigateur

- La sélection d'une conversation est pilotée par l'URL (`hooks/useMobileDetail.ts`, `?contact=`), et non par un état local perdable.
- Liste et détail vivent chacun plein écran sur mobile ; le bouton **Retour** et le retour navigateur ramènent à la liste.
- Les réponses tardives d'une ancienne conversation ne peuvent pas écraser la conversation affichée.
- **Verdict :** `PASS` (couvert par `test:mobile`, y compris le contrat d'historique Next.js `__NA`).

## E. Variantes de messagerie corrigées

- `WhatsAppInboxClient.tsx` : bascule d'un état local vers `useMobileDetail("event")`, liste/détail plein écran, boutons **Retour** (en-tête et état vide) à 44 px.
- `app/dashboard/messages/layout.tsx` : ancien inbox desktop converti en layout client, liste masquée sur mobile, conversation seule affichée, bouton retour.
- `app/dashboard/contacts/[id]/page.tsx` : suppression du `100vh` fixe au profit d'une hauteur bornée au shell + `dvh` sur mobile.
- **Verdict :** `PASS` (couvert par `test:mobile-detail`).

## F. Brouillons locaux

- Clé de brouillon par **organisation : utilisateur : conversation : canal** (`draftKey`).
- Un brouillon ne fuit jamais vers un autre contact/conversation ; il survit à une erreur HTTP, à une coupure réseau et à une re-navigation.
- **Verdict :** `PASS` (couvert par `test:mobile`).

## G. Envoi hors ligne et garde-fous

- Aucune file d'envoi automatique : hors ligne, l'envoi est **désactivé** ; le brouillon est conservé et l'utilisateur reprend explicitement en ligne.
- L'état d'envoi provisoire est retiré après échec ; les canaux sont limités à ceux réellement supportés par l'API.
- **Verdict :** `PASS` (`test:mobile`, `test:pwa`). Limite assumée : déduplication serveur requise avant toute file auto.

## H. Snapshots IndexedDB

- Copie locale bornée : max 60 entrées, expiration 7 jours, 100 contacts / 100 messages par snapshot.
- Lectures conditionnées à l'appartenance (`antigravity-storage-owner === scope`) et à la validité TTL.
- **Verdict :** `PASS` (dégradation gracieuse si IndexedDB indisponible, couvert par `test:mobile`).

## I. Écran de secours `/~offline`

- Déclaré comme fallback document dans `next.config.ts` (`fallbacks: { document: "/~offline" }`) et précaché.
- Permet de préparer un brouillon ; reprise en ligne explicite pour envoyer.
- **Verdict :** `PASS` (configuration conformité vérifiée par `test:pwa`).

## J. Service worker et stratégie de cache

- `reloadOnOnline:false`, `cacheStartUrl:false`, `cacheOnFrontEndNav:false`, `aggressiveFrontEndNavCaching:false`.
- `skipWaiting:false`, `clientsClaim:false`, `cleanupOutdatedCaches:true`.
- `runtimeCaching` : `NetworkOnly` pour `/api/` **et** les navigations ; `CacheFirst` pour `/_next/static/` ; `StaleWhileRevalidate` pour les icônes. Aucun cache générique de HTML/API authentifié.
- **Verdict :** `PASS` (vérifié par `test:pwa`, 37 assertions).

## K. Purge des anciens caches et mises à jour

- `worker/index.ts` supprime à l'`activate` les anciens caches génériques (`pages`, `apis`, `next-data`, etc.).
- Le nouveau service worker reste **en attente** jusqu'à fermeture des anciennes fenêtres (pas de rechargement brutal).
- **Verdict :** `PASS` (statique, `test:pwa`).

## L. Manifest et installabilité

- Source unique retenue : **`public/manifest.json`** (référencé par `app/layout.tsx`).
- Le fichier dupliqué `public/manifest.webmanifest` a été **supprimé** ; ses deux exceptions dans `proxy.ts` ont été remplacées par `/manifest.json`, ce qui rend le manifest **publiquement accessible** (auparavant il tombait sous le garde d'authentification).
- Contenu : `name`/`short_name` = **Buster Call**, `start_url = /dashboard/inbox`, `display = standalone`, icônes 192/512 (any + maskable), pas de fausse capture d'écran.
- **Verdict :** `PASS` (existence des icônes et cohérence vérifiées par `test:pwa`).

## M. Bannière d'installation PWA

- Comportement d'installation conservé (avant-prompt différé) ; modifications préexistantes préservées telles quelles.
- **Verdict :** `PASS` (non modifié par cette intervention ; validation visuelle requise).

## N. Providers téléphonie persistants

- `TelnyxProvider`, `AppCallProvider`, `GlobalIncomingCall`, `GlobalAppIncomingCall` sont montés **une seule fois** via `CommunicationProvider`, dans `app/dashboard/layout.tsx`.
- Ils sont **absents** du layout public, ce qui évite tout init téléphonie hors workspace.
- **Verdict :** `PASS` (vérifié par `test:pwa`).

## O. Mini-barre d'appel actif

- Un raccourci « Revenir à l'appel » s'affiche dans la barre basse quand un appel est en cours hors softphone ; un espace réservé (`data-active-call-bar`) empêche de masquer la saisie.
- **Verdict :** `PASS` (structure). Interaction réelle non testée en navigateur.

## P. Clavier mobile et VisualViewport

- `MobileBottomNav` suit `window.visualViewport`, ignore le pinch-zoom (accessibilité), marque `data-keyboard` et expose `--app-viewport-height`.
- La navigation basse se masque pendant la saisie ; le zoom utilisateur reste autorisé (aucun `maximum-scale`/`user-scalable=no`).
- **Verdict :** `PASS` (logique) ; comportement clavier réel `NOT_RUN` (nécessite un appareil).

## Q. Safe areas et hauteurs dynamiques

- Le shell utilise `h-[100dvh]` ; le tiroir mobile passe de `h-screen` à **`h-dvh`** avec `pt/pb env(safe-area-inset-*)`.
- Le bouton de fermeture du tiroir respecte `env(safe-area-inset-top)` et fait 44 px.
- **Verdict :** `PASS` (statique, `test:mobile-detail`).

## R. Cibles tactiles et focus

- Boutons de retour, fermeture de tiroir, navigation basse et liens de navigation principaux visés à ~44 px ; focus visible ; `prefers-reduced-motion` respecté.
- **Verdict :** `PARTIAL` (audité dans le code, non mesuré au pixel sur appareil).

## S. Modales et tiroirs

- `components/ui/modal.tsx` : piège de focus, restauration du focus, fermeture Échap, verrou de scroll, présentation mobile.
- **Verdict :** `PASS` (couvert par `test:mobile`).

## T. Historique d'appels local

- Historique scopé par `organization:user` ; données non attribuables purgées ; lectures lancées en parallèle.
- **Verdict :** `PASS` (couvert par l'audit et `test-pwa` pour l'absence de cache générique).

## U. Notifications

- `notificationclick` n'ouvre que des URL **same-origin** sous `/dashboard`. Toute cible invalide retombe sur `/dashboard`.
- **Verdict :** `PASS` (statique).

## V. Confidentialité et purge au changement de compte

- `PrivateStorageBoundary` ne purge les données privées qu'après **confirmation définitive** du serveur (`/api/auth/session`).
- Une panne réseau, un timeout ou une réponse **5xx** ne sont **pas** interprétés comme une déconnexion : les brouillons et l'historique sont conservés.
- Hors ligne, rien n'est purgé faute de preuve. Un changement de scope (`owner`) déclenche une purge.
- `hasPrivateLocalData()` a été extrait dans `lib/offline-store.ts` (testable et réutilisable).
- **Verdict :** `PASS` (couvert par `test:mobile-detail` : réseau KO, 502, session vide définitive, hors-ligne).

## W. Tests exécutés

| Test | Commande | Résultat |
| --- | --- | --- |
| Inbox mobile (canaux, brouillons, hors-ligne, erreurs, courses, focus) | `npm run test:mobile` | `PASS` |
| Vues liste/détail + purge sécurisée | `npm run test:mobile-detail` | `PASS` |
| Configuration PWA/service worker/manifest | `npm run test:pwa` | `PASS` (37 assertions, 0 échec) |

- Les trois scripts renvoient `EXITCODE=0`.
- **Verdict :** `PASS`.

## X. Build, TypeScript et lint

- `tsc --noEmit` : **`PASS`** (`EXITCODE=0`).
- `npm run build` : **`BLOCKED`** — échec du pré-requis `prisma migrate deploy` (`P1001: Can't reach database server … :5432`). Cause : accès base impossible depuis l'environnement.
- `next build --webpack` (migrate contourné) : la compilation PWA a réussi (service worker, custom worker, fallback `/~offline`), puis **`BLOCKED`** à `next/font` — `Failed to fetch Inter / JetBrains Mono from Google Fonts` (`read ECONNRESET`). Cause : egress réseau restreint, **pas** un défaut de code.
- Conséquence : le build de production et l'installabilité en HTTPS n'ont **pas** pu être validés ici.
- **Verdict :** `BLOCKED` (environnement).

## Y. Verdict global, limites et checklist appareil

**Verdict global :** `PARTIAL / BLOCKED-ENV`
- Code mobile/PWA vérifié par scripts : `PASS`.
- TypeScript : `PASS`.
- Build de production : `BLOCKED` par le réseau/DB de l'environnement.

**Non vérifié (honnêtement) :**
- `VISUAL_QA = NOT_RUN` (aucun navigateur réel utilisé).
- `CORE_WEB_VITALS = NOT_MEASURED` (LCP/INP/CLS non mesurés).
- Tests appareil iOS/Android = `PENDING`.

**Checklist manuelle recommandée (à exécuter hors de cette session) :**
1. Build de production sans migration, servi en HTTPS ; vérifier l'enregistrement du service worker et le boot hors ligne.
2. Portraits `390×844`, `393×852`, `430×932`, `375×667`, `320×568`, paysage et zoom système.
3. Ouvrir/fermer une conversation, retour navigateur, clavier virtuel, barre basse masquée en saisie.
4. Appel entrant/actif : mini-barre, retour au softphone, verrouillage d'écran.
5. iOS : bannière d'ajout à l'écran d'accueil, safe areas, PWA standalone.
6. Android/Chrome : installabilité, notification, badge, vibration.
7. Mesurer LCP/INP/CLS réels au 75e percentile, mobile vs desktop.

**Limites connues :**
- Pas de file d'envoi automatique hors ligne (déduplication serveur requise).
- Snapshots = copie locale bornée, non chiffrée, non archivage.
- Plusieurs modules métier restent non virtualisés/paginés.
- Le service worker est désactivé en développement ; sa mise à jour exige un build de production HTTPS.
- `useCallHistory`/notifications restent à valider sur appareil.

---
*Rapport généré sans opération git. Les modifications préexistantes (softphone, bannière, marketing, branding) ont été préservées.*
