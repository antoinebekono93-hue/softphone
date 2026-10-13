# Buster Call — Refonte UI/UX mobile « app Téléphone »

Rapport de refonte de l'expérience mobile du module d'appel Buster Call
(`/dashboard/softphone`) pour reproduire l'app Téléphone d'iPhone.

- **Périmètre** : mobile uniquement (`< md`). Le desktop est inchangé.
- **Marque** : « Buster Call » uniquement (aucun libellé Antigravity / Telnyx / Softphone visible).
- **Exécution** : locale (aucun commit, push ou déploiement).

---

## 1. Objectif

Offrir, sur mobile, une expérience d'appel native type iOS : 5 onglets bas
(Favoris, Récents, Contacts, Clavier, Messagerie), clavier circulaire tactile,
listes propres, écran d'appel plein cadre — **sans modifier** la logique métier
existante (routage, WebRTC, PSTN, App-to-App, historique, voicemail).

## 2. Résultat

Un shell mobile plein écran, monté uniquement sur mobile, qui remplace visuellement
l'atelier desktop tout en réutilisant strictement les contextes et API existants.

```
┌─────────────────────────────┐
│                  [accueil]  │  safe-area top + sortie discrète
├─────────────────────────────┤
│                             │
│        Vue d'onglet         │  scroll vertical
│   (Favoris/Récents/…)       │
│                             │
├─────────────────────────────┤
│  ☆   🕘   👥   ⌗   💬       │  5 onglets (Clavier central, actif par défaut)
└─────────────────────────────┘
```

## 3. Fichiers créés

Tous dans `components/mobile/phone/` :

| Fichier | Rôle |
| --- | --- |
| `MobilePhoneShell.tsx` | Shell mobile, onglets, modale contact, montage de l'écran d'appel |
| `MobileBottomTabBar.tsx` | Barre d'onglets basse (safe-area, badges) |
| `usePhoneData.ts` | Chargement `/api/contacts`, `/api/calls`, `/api/voicemails` + rafraîchissement temps réel |
| `phone-utils.ts` | Types de présentation + helpers (initiales, formatage, correspondance contact, libellés) |
| `ScreenTitle.tsx` | Grand titre type iOS + rappel « Buster Call » |
| `EmptyStateMobile.tsx` | État vide épuré |
| `DialerKeypad.tsx` | Clavier circulaire (appui long `0` → `+`) |
| `DialerNumberField.tsx` | Champ numéro (sélecteur pays, formatage à la frappe, effacement) |
| `ContactListMobile.tsx` | Liste de contacts (groupes alphabétiques collants ou plate) |
| `RecentCallList.tsx` | Lignes d'appels récents (type d'appel, manqué en rouge, info) |
| `MobileFavoritesView.tsx` | Onglet Favoris |
| `MobileRecentsView.tsx` | Onglet Récents (Tous / Manqués) + détail d'appel |
| `MobileContactsView.tsx` | Onglet Contacts (recherche + A-Z) |
| `MobileDialerView.tsx` | Onglet Clavier (Externe PSTN / Interne annuaire) |
| `MobileMessagesView.tsx` | Onglet Messagerie (boîte vocale + accès messagerie) |
| `MobileActiveCall.tsx` | Écran d'appel actif plein cadre (PSTN et App-to-App) |

## 4. Fichiers modifiés

| Fichier | Modification |
| --- | --- |
| `app/globals.css` | Ajout du bloc `Buster Call — Mobile Phone` : `.bc-light`, `.bc-phone`, `.bc-cell`, `.bc-key`, `.bc-field` + scrollbars masquées. |
| `app/dashboard/softphone/page.tsx` | Ajout de `<MobilePhoneShell />` (mobile) ; l'atelier desktop passe en `hidden md:flex` (toujours monté, donc sonnerie/reconnexion préservées). |

## 5. Architecture & décisions

- **Isolation mobile** : le shell est `position: fixed; inset: 0; z-index: 45`.
  - au-dessus de la nav mobile/entête globale (`z-40`) qu'il recouvre ;
  - sous les overlays d'appel entrants existants : `IncomingCall`/`GlobalIncomingCall`
    (`z-50`) et `GlobalAppIncomingCall` (`z-100`).
- **Thème** : `.bc-light` force une palette claire iOS (fond `#f2f2f7`, cellules
  blanches, accent Buster Call cyan `#0a97b0`, vert appel `#34c759`, rouge manqué
  `#ff3b30`), quel que soit le thème sombre du dashboard.
- **Sortie** : comme le shell recouvre la navigation globale, un bouton discret
  (haut-droite) ramène vers l'application (`/dashboard/inbox`).
- **Desktop préservé** : l'atelier `SoftphoneWorkspace` reste monté en
  `hidden md:flex`. Ses effets globaux (dont `useRingtone`, la sonnerie)
  continuent donc de fonctionner sur mobile, sans double sonnerie.

## 6. Reprise de la logique existante (aucun backend modifié)

| Besoin | Réutilisation |
| --- | --- |
| Routage des appels | `useCallRouter().routeCall` (décision serveur APP_TO_APP / PSTN) |
| PSTN (Telnyx) | `useTelnyx()` : `callState`, `muteMicrophone`, `hangupCall`, `sendDTMF`, `requestAudioUnlock` |
| App-to-App | `useAppCall()` : annuaire d'équipe, `muteAppMic`, `hangupAppCall`, durée, `retryRemoteAudio` |
| Récents | `GET /api/calls` |
| Contacts / Favoris | `GET /api/contacts` (Favoris = VIP ou client à forte valeur) |
| Messagerie vocale | `GET /api/voicemails` (+ audio `/api/voicemails/[id]/audio`) |
| Temps réel | Évènements `softphone:voicemail` / `softphone:missed-call` déjà émis |

Aucun changement sur : Telnyx, WebRTC, Pusher, Prisma, facturation, routage,
webhooks, sécurité.

## 7. Incohérences corrigées

- **Formatage du numéro** : formatage « à la frappe » via `libphonenumber-js`
  (déjà présent) plutôt qu'un simple regroupement, pour un rendu natif.
- **Saisie** : champ en lecture seule au clavier maison → suppression du risque
  de double caractère (saisie clavier physique + keypad acoustique gérés
  exclusivement, avec garde `activeElement`).
- **Palette** : thème clair natif dédié au module, au lieu du thème sombre global,
  via neutralisation explicite des `!important` des champs globaux (`.bc-field`).
- **Correspondance contact ↔ appel** : `/api/calls` n'expose pas de relation
  contact ; rapprochement côté client par comparaison de numéros (E.164 / national).

## 8. Validation

| Contrôle | Commande | Résultat |
| --- | --- | --- |
| Types | `npx tsc --noEmit` | **PASS** (0 erreur, exit 0) |
| Lint | `npx eslint components/mobile/phone app/dashboard/softphone/page.tsx` | **PASS** (0 erreur, exit 0) |
| Build production | `npx next build --webpack` | **PASS** (`✓ Compiled successfully`, exit 0) |

> Le build standard (`npm run build`) exécute au préalable
> `prisma migrate deploy` ; la compilation a donc été validée directement via
> `next build --webpack`, hors étape base de données.

## 9. Limitations connues

- **Favoris** : dérivés des contacts (VIP / forte valeur) faute de notion de
  favori explicite en base. Aucun nouveau champ backend n'a été introduit.
- **Messagerie** : l'onglet affiche la boîte vocale réelle ; les SMS / WhatsApp
  restent dans la messagerie complète via `/dashboard/inbox`.
- **Appels vidéo** : non activés (audio uniquement, conforme à l'existant).
- **Écran d'appel** : les sonneries entrantes restent affichées par les overlays
  globaux existants ; l'écran plein cadre gère les appels sortants et actifs.

## 10. Test manuel conseillé

1. Ouvrir `/dashboard/softphone` sur un viewport mobile (≤ 430 px).
2. Vérifier les 5 onglets, le clavier (appui long `0` → `+`), le sélecteur pays.
3. Lancer un appel externe, un appel interne (onglet « Interne »), recevoir un
   appel entrant (overlay global au-dessus du shell).
4. Contrôler Récents (filtre Manqués), Contacts (recherche + A-Z),
   Messagerie (lecture vocale), Favoris.
5. Vérifier que le desktop (≥ md) est strictement inchangé.
