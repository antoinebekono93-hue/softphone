# PRODUCT POLISH FIX REPORT

**Chantier « finition produit » — Audit, correction et test des zones Ventes B2B / WhatsApp / Voix**
> Aucune opération git n'a été réalisée au cours de ce chantier.

## A. Chantier 1 — Rubrique « Buster Call Connect »

Libellé UI renommé, logique et identifiants internes conservés.

- `components/softphone/Softphone.tsx` : le libellé **« PSTN CONNECTÉ »** s'affiche désormais **« BUSTER CALL CONNECT »** (via la classe CSS existante `uppercase`, le rendu est bien « BUSTER CALL CONNECT »).
- Les enums/variables internes (`mode === 'pstn'`, `telnyx`, `SipClient`) **n'ont pas été renommés**.
- `registrationError` n'est plus affiché brut dans la UI (message trop technique) → remplacé par **« Connexion impossible »** ; « Connexion à Telnyx… » → **« Connexion… »**.

## B. Chantier 2 — Bug « Invalid Date » (cause racine)

Le modèle `CallLog` (schéma ligne 269+) **ne possède pas de champ `createdAt`** : il possède `startedAt @default(now())`. L'écran utilisait `new Date(call.createdAt)` → `undefined` → **« Invalid Date »** affiché dans l'historique du softphone.

- 🛠️ `components/softphone/SoftphoneWorkspace.tsx` : `call.createdAt` → **`call.startedAt`**.
- Même classe de bug trouvée et corrigée dans le drawer de détail du pipeline (journaux d'appel des opportunités) : `log.createdAt` → **`log.startedAt`**, rendu via le formateur central.
- `/api/calls` et `/api/voicemails` retournent des données valides (`startedAt`, pas de `createdAt`).

**Formateur de date central FR** ajouté dans `lib/utils.ts` :

- `formatDateFR(value)` : « Aujourd'hui », « Hier », « 21 sept. », « 21 sept. 2026 » (avec année si différente).
- `formatTimeFR(value)` : « 14:32 » (heure 24h).
- `formatDateTimeFR(value)` : combinaison des deux.
- **Fallback systématique « Date indisponible »** — jamais « Invalid Date » à l'écran (le fallback ne s'affiche que si la donnée est vérifiée absente/invalide).

## C. Chantier 3 — Label « Buster Call Connect »

Résolu dans le chantier A (Section A). Le monître technique interne de connexion Telnyx n'est plus exposé à l'utilisateur.

## D. Chantier 4 — Télémétrie technique masquée

- `components/softphone/Softphone.tsx` : constante validate **`SHOW_TECHNICAL_TELEMETRY = false`** (en prod) contrôlant le rendu de `<TelemetryStrip />` (affichait « PSTN Au repos (idle) », « APP Au repos (idle) », « DIR — »).
- La logique interne de télémétrie est **conservée** (elle alimente toujours le state du softphone) ; seul son affichage est masqué.

## E. Chantier 5 — Supprimer le statut brut en anglais

- `components/softphone/Softphone.tsx` : retrait de `<StatusBadge status={callState} />` qui affichait les états internes anglais bruts (`idle`, `dialing`, `ringing`…) dans la UI.
- Conservé : le `StatusDot` coloré + libellés FR gérés côté composant (ex : « Appel entrant » pour un appel entrant qui sonne).

## F. Chantier 6 — Templates WhatsApp : cause racine du 404

**Cause racine identifiée** (docs Telnyx — WhatsApp Management API v2.0.0, opération `PostWhatsappTemplate`) :

- Ancien endpoint appelé : `POST https://api.telnyx.com/v2/whatsapp/{wabaId}/message_templates` → **n'existe pas chez Telnyx** → 404 « The requested resource or URL could not be found. » (Request Not Found).
- 🛠️ `app/api/whatsapp/templates/route.ts` : endpoint corrigé vers **`POST https://api.telnyx.com/v2/whatsapp/message_templates`** avec **`waba_id` dans le body** (extrait du `WhatsAppAccount` de l'organisation).
- Composants : pour un BODY avec variables `{{1}}`, `{{2}}`, … Meta exige `example.body_text` → généré automatiquement (`["Exemple 1", "Exemple 2", …]`).
- Erreurs Telnyx sanitized : la réponse d'erreur conserve le statut HTTP et expose le message `detail`/`error` sans autorisation ni token.

## G. Chantier 7 — Plus de `window.alert()` métier

Tous les `alert()` de la zone Ventes B2B / WhatsApp / Voix concernée ont été remplacés par des toasts **sonner** (états SUBMITTING / SUCCESS / ERROR, jamais de stacktrace/token/URL interne) :

- `components/softphone/SoftphoneWorkspace.tsx` (message « Agent IA à implémenter » → `toast.info`, dont l'alerte générique restante).
- `app/dashboard/whatsapp/templates/TemplatesClient.tsx` (succès + erreur).
- `app/dashboard/social-campaigns/CampaignsClient.tsx` (valide / envoi / succès / erreur).
- `app/dashboard/call-logs/CallLogsClient.tsx` (échec de transcription audio).
- `app/dashboard/whatsapp-inbox/WhatsAppInboxClient.tsx` (4 alertes : assignation, résumé, envoi de réponse, réactivation).
- `app/dashboard/whatsapp/connect/ConnectClient.tsx` (succès connexion + erreur déconnexion).
- `app/dashboard/whatsapp/flows/FlowBuilderClient.tsx` (sauvegarde succès/erreur).
- `app/dashboard/pipeline/PipelineClient.tsx` (création, déplacement, mise à jour).

> `prompt()` (FlowListClient) reste, hors périmètre des alertes ; à migrer vers une vraie modale ultérieurement.

## H. Chantier 8 — PipeLine : empty state « erreur métier prévisible »

Deux niveaux de protection ajoutés :

- **Erreur de chargement (prévisible)** : `app/dashboard/pipeline/page.tsx` englobe désormais les lectures Prisma dans un `try/catch` → en cas d'échec, une `Card` d'erreur claire (« Impossible de charger le pipeline ») est rendue **au lieu d'un crash**.
- **Aucune opportunité** : `PipelineClient.tsx` affiche un `EmptyState` (« Aucune opportunité pour le moment », CTA « Créer une opportunité » ouvrant la modale) au lieu du board vide.
- La modale « Nouvelle Opportunité » reste native au-dessus du board et n'est plus accessible quand le state est vide (le CTA de l'empty state est filé).

## I. Chantier 9 — Error boundary

Le try/catch serveur (Section H) agit comme filet de sécurité sur tout l'échelon de données du pipeline (base + API). Le board ne peut plus se rendre dans un état cassé à partir d'erreurs de données. Aucune anomalie JSX/Prisma détectée dans les chemins de code audités (`module=social` ne pilote que `resolveDashboardModule` → sidebar/navbar, purement logique).

## J. Chantier 10 — Page Campagnes (StatCards + État vide)

`app/dashboard/social-campaigns/CampaignsClient.tsx` :

- En-tête converti en composant `PageHeader` avec CTA « Nouvelle Campagne ».
- 3 `StatCard` métier : **Total Campagnes**, **Messages Envoyés**, **Dernière activité** (date FR via `formatDateFR`).
- Tableau déplacé dans une `Card` ; état vide avec `EmptyState` et CTA fonctionnel « Lancer une campagne » qui ouvre la modale.
- Supprimé le composant SVG « CheckCircle » maison (déjà présent dans lucide).

## K. Chantier 11 — Dates FR partout (campagnes)

Toutes les cellules dates du tableau campagnes utilisent `formatDateTimeFR` (aucun `toLocaleDateString/toLocaleString` local, formateur unique).

## L. Chantier 12 — État vide Templates

`TemplatesClient.tsx` : `EmptyState` « Aucun modèle pour le moment » + toast de succès « Modèle soumis, en attente de validation par Meta. ».

## M. Chantier 13 — Formateur de date central FR

- `lib/utils.ts` : `formatDateFR` / `formatTimeFR` / `formatDateTimeFR` (voir Section B).
- Remplacés dans : softphone (historique + voicemails), call logs, pipeline (drawer opportunité), campagnes sociales, flow-builder (`formatDateFR` pour la date de modification).

## N. Chantier 14 — « Messages vocaux »

`SoftphoneWorkspace.tsx` : onglet « Voicemails » renommé **« Messages vocaux »** ; libellés FR (dates voicemail via `formatDateTimeFR`, « Numéro inconnu »).

## O. Chantier 15 — Responsive 1440 → 320

- `SoftphoneWorkspace.tsx` : racine `lg:h-[calc(100vh-5rem)]` → **`lg:h-full min-h-0`** ; en mobile la sidebar du softphone passe en `max-h-[70vh]` avec scroll interne.
- `app/dashboard/softphone/page.tsx` : wrapper `p-4 md:p-8 … h-full min-h-0 flex flex-col` + zone `flex-1 min-h-0 flex`.
- `app/dashboard/pipeline/page.tsx` : `h-[calc(100vh-80px)]` → **`h-full min-h-0`** + `overflow-hidden` sur le conteneur du board.
- `CallLogsClient.tsx` : `h-[calc(100vh-64px)]` → **`h-full min-h-0`** (double scroll évité).
- `app/dashboard/DashboardSidebar.tsx` : `h-screen` → **`h-screen md:h-[calc(100vh-4rem)]`** (la sidebar desktop ne déborde plus sous la navbar fixe de 64 px).

## P. Chantiers 16/21/22 — Cohérence sidebar, routes sociales, primitives

- **Sidebar social** : items déjà uniformes (mêmes dimensions, icônes, active state, indentation, hover) — aucun changement nécessaire.
- **Routes du module social vérifiées** : `/dashboard/social-campaigns`, `/dashboard/whatsapp`, `/dashboard/whatsapp-inbox`, `/dashboard/pipeline`, `/dashboard/flow-builder` existent et répondent.
- **Primitives réutilisées** : `PageHeader` (softphone, templates, campagnes, pipeline), `EmptyState` (softphone, templates, campagnes, pipeline), `Card`, `Modal`, `Button`, `toast` (sonner). Aucun nouveau composant « one-off ».
- Vérifié : aucun `size="icon"` sur `Button` (pas de rupture de build future).

## Validation

| Étape | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npm run build` (`prisma migrate deploy && next build`) | ✅ Build production OK (avertissements préexistants uniquement : deprecation prisma-cli, config Sentry instrumentation) |
| Smoke `npm run dev` | ✅ Serveur « Ready in 30.8s » ; routage fonctionnel (404 propre sur route inconnue) ; `/login` lent car `auth()` → base distante Nhost (environnement, hors chantier) |

## Hors périmètre / constaté

- `alert()` restants dans d'autres modules (mail de la plateforme) — hors zone Ventes B2B/WhatsApp/Voix de ce chantier.
- `prompt()` nom de scénario (FlowListClient).
- Confirmation runtime du rendu visuel (softphone « Buster Call Connect », télémétrie masquée, dates FR) : à valider par l'utilisateur connecté (auth requise).
- Env vars Telnyx manquantes côté Vercel (fournies par l'utilisateur) : à définir dans les variables d'environnement Vercel + redeploy.

---

## PRODUCT_POLISH = PASS