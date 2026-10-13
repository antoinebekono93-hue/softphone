# Next.js : rendre Buster Call propre et fluide sur mobile

Recherche et inspection du code : 10 octobre 2026. Version déclarée du projet : Next.js 16.2.9, React 19.2.4. Les documentations en ligne peuvent décrire une version plus récente : aucune migration n'est nécessaire pour les corrections proposées ici.

## Conclusion

Next.js convient à ce projet. Les premiers problèmes identifiés concernent la composition mobile et les effets graphiques, pas un besoin de changer de framework. Un site fluide combine une mise en page lisible, une réaction rapide aux gestes et un affichage initial rapide. Un bon score Lighthouse ne suffit pas à garantir les trois.

## Constats dans le projet

| Priorité | Constat vérifiable dans le code initial | Conséquence et intervention |
| --- | --- | --- |
| P0 | HeroSection : cadre mobile au ratio 21/9, téléphone de largeur 320 px et hauteur 80 %, contenu masqué | Aperçu beaucoup trop bas sur téléphone. Remplacer la hauteur mobile par celle du contenu ; conserver le ratio ordinateur. |
| P0 | ProductShowcase : transcription de 320 px positionnée à droite dans une carte de hauteur fixe | Risque de texte coupé ou superposé. Remettre la transcription dans le flux mobile et laisser grandir la carte. |
| P1 | MarketingHeader : ouverture par max-height, plafond 480 px, tiroir sans défilement propre | Menu contraint en paysage ; recalculs pendant l'ouverture. Utiliser une hauteur maximale liée au viewport, un défilement interne et une transition transform/opacity. |
| P1 | HeroSection : titre initialement transparent, révélation de chaque mot avec filtre blur | Le contenu principal attend une animation. Afficher le titre dès le HTML initial. |
| P1 | HeroSection : deux grandes surfaces floutées animées à l'infini | Coût graphique potentiel pendant le défilement. Remplacer par un dégradé radial statique. |
| P1 | ProductShowcase : quatre barres animées via height | Travail de mise en page répété. Utiliser scaleY avec origine en bas. |
| P2 | De nombreux composants marketing sont clients pour leurs animations | Examiner la taille du JavaScript avant de convertir les sections statiques en composants serveur. |
| P2 | Bandeau TrustBar animé avec contenu dupliqué | Préférer une liste compacte statique sur mobile ; conserver toutes les capacités lisibles. |

Déjà présents : next/font pour les polices, viewport device-width, zoom autorisé, unités dvh dans le dashboard, safe areas et styles reduced-motion. Il faut consolider ces bases, pas les ajouter une deuxième fois.

## Enseignements de la recherche

### 1. Construire la composition pour les petits écrans

Choisir les points de rupture selon le contenu. Utiliser Grid/Flex, min-width: 0 dans les enfants flexibles, largeur maximale de 100 % et hauteur automatique pour les blocs de texte. Réserver les ratios fixes aux médias qui les supportent réellement. Garder une action principale visible, des marges cohérentes et des commandes confortables au toucher (objectif de conception : 44 à 48 px). Vérifier 320, 360, 390, 430, 768 et 1440 px, ainsi que le paysage et le zoom.

Source : [Google — Responsive web design basics](https://web.dev/articles/responsive-web-design-basics).

### 2. Éviter les saccades de rendu

Les animations de largeur, hauteur et position peuvent déclencher du travail de mise en page. Favoriser transform et opacity, sans supposer qu'une animation est gratuite : une très grande surface floutée reste coûteuse. Éviter le défilement artificiel, les filtres décoratifs continus et l'application globale de will-change. Les éléments purement décoratifs doivent pouvoir rester statiques sur téléphone.

Source : [Google — Rendering performance](https://web.dev/articles/rendering-performance).

### 3. Réduire le JavaScript au démarrage

Garder le contenu statique dans les composants serveur ; isoler les interactions dans de petites frontières clientes. Mesurer les modules réellement chargés. Utiliser next/dynamic pour les graphiques, éditeurs et interfaces lourdes lorsque leur usage est différé. Masquer un composant avec CSS ne supprime pas son chargement ni ses effets JavaScript. Ne pas retarder sans analyse les fonctions nécessaires à la réception d'appels.

Sources : [Next.js — Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [Next.js — Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading).

### 4. Accélérer les interactions

Une interaction lente peut venir d'une tâche JavaScript déjà en cours, du gestionnaire lui-même ou du rendu suivant. Profiler les filtres, recherches, menus et changements d'onglets. Réduire les traitements synchrones et les mises à jour d'état inutiles. Pour les longues listes, examiner pagination ou virtualisation après mesure. Un cache de données privées doit rester isolé par utilisateur et organisation.

Source : [Google — Optimize INP](https://web.dev/articles/optimize-inp).

### 5. Images, polices et stabilité

Pour les images réelles, utiliser next/image avec des dimensions et un attribut sizes adapté. Ne pas charger paresseusement le visuel principal si c'est l'élément LCP. Réserver la place des médias et des états de chargement. Le projet utilise déjà next/font : mesurer avant d'ajouter d'autres préchargements. Le visuel du téléphone de l'accueil est du HTML/CSS, donc next/image ne corrige pas son problème de proportions.

Sources : [Next.js — Image](https://nextjs.org/docs/app/api-reference/components/image), [Google — Optimize LCP](https://web.dev/articles/optimize-lcp), [Google — Optimize CLS](https://web.dev/articles/optimize-cls).

### 6. Navigation et chargement progressif

Utiliser Link pour les liens internes et des états de chargement pertinents pour les routes dynamiques. Adapter le préchargement aux parcours : précharger des dizaines de destinations ou des données lourdes n'est pas toujours utile sur mobile. Ne pas rendre toutes les pages clientes pour accélérer les transitions.

Source : [Next.js — Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating).

### 7. Accessibilité et sobriété

Un menu fermé ne doit pas conserver ses liens dans le parcours clavier. Prévoir Escape, focus visible, fermeture à la sélection et restauration du défilement. Respecter prefers-reduced-motion jusque dans les animations JavaScript : un style CSS seul ne neutralise pas forcément une animation pilotée par une bibliothèque. Garder les contenus importants visibles sans attendre leur animation.

Source : [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).

### 8. Optimisations avancées à mesurer

content-visibility: auto peut réduire le travail de rendu des sections éloignées, mais nécessite une taille intrinsèque plausible et une validation des ancres, de l'accessibilité et du défilement. Ne pas l'appliquer globalement aux interfaces interactives ou aux conteneurs de menus.

Source : [MDN — content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility).

## Mesures attendues

| Indicateur | Cible de référence | Interprétation |
| --- | --- | --- |
| LCP | ≤ 2,5 s | Affichage du contenu principal |
| INP | ≤ 200 ms | Réactivité des interactions |
| CLS | ≤ 0,1 | Stabilité de la mise en page |
| Défilement | Pas de saccades répétées sur téléphone représentatif | Vérification par trace et essai réel |
| Lisibilité | Aucun contenu utile coupé ou débordement de page | Portrait, paysage et zoom |

Les seuils Web Vitals s'évaluent au 75e percentile des visites, en distinguant mobile et ordinateur. Aucun résultat chiffré avant/après n'a encore été établi pour ce projet. Une mesure en mode développement ne représente pas la production.

## Ordre de travail recommandé

1. Corriger les défauts de proportions et le menu partagé (changements locaux de cette intervention).
2. Vérifier visuellement accueil, tarifs, connexion et inscription sur les tailles retenues.
3. Avec une session de test, vérifier dashboard, messagerie, appels, clavier virtuel et navigation du bas.
4. Produire une build sans exécuter de migration de base de données pour cet audit visuel ; profiler trois chargements comparables avec réseau et CPU ralentis.
5. Mesurer JavaScript, longues tâches et animations hors écran ; prioriser les modules réellement responsables.
6. Après déploiement, confirmer les résultats sur Safari iOS et Chrome Android, puis suivre les Web Vitals réels.

Référence transversale : [Next.js — Production checklist](https://nextjs.org/docs/app/guides/production-checklist).
