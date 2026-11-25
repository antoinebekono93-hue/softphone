# BUSTER CALL — NATIVE DIALER REFERENCE REPORT

Mission : reproduction fidèle de l'écran Clavier (référence visuelle jointe) dans
`apps/mobile`. Aucun commit, push ni déploiement n'a été effectué.

## Fichiers modifiés

- `apps/mobile/constants/theme.ts` — nouveaux tokens de couleur (encre navy `ink`/`inkSoft`,
  bleu de marque `brandBlue`/`brandBlueDeep`/`brandBlueSoft`), nuances de surface froide,
  typographie et dimensions ajustées à la référence (logo 44, profil 46, champ 56, touches 88,
  bouton d'appel 78, secondaires 50, icônes d'onglets 20).
- `apps/mobile/components/NativeDialerHeader.tsx` — logo en dégradé bleu, titre en encre,
  slogan bleu-gris, bouton profil circulaire gris-bleu.
- `apps/mobile/components/NativeDialerNumberField.tsx` — champ pilule (rayon plein), drapeau +
  indicatif + chevron, séparateur vertical, `TextInput` réel, effacement.
- `apps/mobile/hooks/useDialerState.ts` — saisie manuelle (`setNumber`), initialisation +237
  conservée au niveau de l'écran.
- `apps/mobile/components/NativeDialerScreen.tsx` — initialisation `+237`, saisie clavier,
  dismissal du clavier virtuel lors des touches, mesure par `onLayout`.
- `apps/mobile/components/NativeDialerKeypad.tsx` — grille 3 colonnes × 4 rangées, touches
  circulaires 88, espacement colonnes large / lignes serrées, retour visuel au toucher.
- `apps/mobile/components/NativeCallActions.tsx` — Ajouter un contact (gauche), gros bouton
  d'appel vert (centre), bouton vidéo (droite).
- `apps/mobile/components/NativeBottomTabBar.tsx` — barre flottante arrondie, icônes
  Favoris/Récents/Contacts/Clavier/Messagerie, pilule bleue autour de l'onglet actif,
  texte/icône bleus à l'actif, respect de la safe area.
- `apps/mobile/components/NativePhoneShell.tsx` — inchangé structurellement (onglets déjà présents).

## Composants créés / réutilisés

- Réutilisés : `NativeDialerHeader`, `NativeDialerNumberField`, `NativeDialerKeypad`,
  `NativeCallActions`, `NativeBottomTabBar`, `NativeCountryPicker`, `NativeDialerScreen`,
  `useDialerState`, `useHaptics`.
- Aucun nouveau composant créé ; l'architecture existante a été préservée.

## Fonctionnalités réellement opérationnelles

- Saisie manuelle du numéro via le champ texte (sanitisation `+`, `*`, `#`).
- Touches du clavier ajoutent les chiffres ; appui long sur 0 ajoute `+`.
- Effacement du dernier chiffre (et état désactivé si champ vide).
- Sélecteur de pays réel (`NativeCountryPicker`) : indicatif non figé, initial `+237`
  (Cameroun) si aucune préférence.
- Bouton d'appel transmet le numéro au routeur existant (`createNativeCallService` →
  `/api/call-route`), avec Alert honnête sur l'état PARTIAL de la couche média.
- Navigation entre les 5 onglets fonctionnelle.
- Boutons « Ajouter un contact » et « Appel vidéo » présentent un état honnête
  (Alert « bientôt disponible ») — aucune réussite simulée.
- Retour haptique et visuel au toucher sur les touches.

## Tests exécutés et résultats

- `npm --prefix apps/mobile run typecheck` (tsc --noEmit) : **PASS**.
- ESLint direct (9 fichiers modifiés) : **PASS** (0 erreur).
- `npm run test:mobile` : **PASS**.
- `npm run test:mobile-detail` : **PASS**.
- `npm run test:mobile-active-call` : **PASS** (80/80).
- `npm run test:mobile-incoming-call` : **PASS** (96/96).
- `npm run test:mobile-media-engine` : **PASS** (132/132).
- `npx tsc --noEmit` (racine) : **PASS**.
- Export Expo Web (`npx expo export --platform web`) : **PASS** (bundle généré).
- Export Expo Android (`npx expo export --platform android`) : **PASS**.

## Validation visuelle

- Tentative de validation visuelle effectuée via export Web + navigateur intégré
  (iframe 390×844) : page `/phone/` rendue sans erreur console.
- Métriques mesurées (px → points) :
  - Champ numéro : 358×56, pilule, position (16,81).
  - Touches : 12 cercles de 88×88, 3 colonnes, espacement colonnes ~22, lignes ~5.
  - Bouton d'appel : 78×78 centré (156,675), secondaires 50×50.
  - Onglets : 5, hauteur 59, pilule bleue autour de l'actif.
  - Logo 44×44, profil 46×46.
- **Aucune capture d'écran n'a pu être inspectée visuellement par le modèle** (le modèle
  ne supporte pas l'entrée image). La validation visuelle repose donc sur des métriques
  automatisées et sur la comparaison proportionnelle avec l'image de référence ; elle n'est
  **pas** déclarée PASS sans réserve.

## Problèmes restants

- Pas d'émulateur Android ni de Xcode disponibles → aucun rendu natif réel ni capture
  sur device.
- Les drapeaux sont rendus en emoji (dépendant de la plateforme) ; sur le rendu Web
  Windows ils apparaissent en lettres, mais sur iOS/Android ils s'affichent correctement.
- La couche média native reste PARTIAL (pas de WebRTC natif) — hors périmètre de cette
  mission, aucune modification backend/API/auth/DB/Telnyx.
- La couleur d'accent globale (teal) est conservée pour les autres écrans ; le bleu de
  la référence est appliqué à l'écran Clavier conformément à l'image prioritaire.
- Dossier `apps/mobile/android` (prébuild) et `dist-web` (export) sont des artefacts de
  build non commités.

## Règles respectées

- Aucune modification de l'application web Next.js.
- Aucune suppression de fonctionnalité existante.
- Aucun git reset / checkout / clean / stash.
- Aucune modification de migration ou base de données.
- Aucun déploiement, commit ni push.
- Travaux non liés préservés.
