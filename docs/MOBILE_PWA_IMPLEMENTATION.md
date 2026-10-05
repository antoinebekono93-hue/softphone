# Mobile et PWA — réalisation du 4 octobre 2026

## Changements
- Navigation mobile Discussions / Appels / Contacts / Assistant / Plus.
- Écran Plus pour retrouver les outils de gestion.
- Retour liste/détail de la messagerie, URL de conversation et bouton Retour du navigateur.
- Liste conservée dans le DOM pendant la lecture pour conserver son défilement.
- Clavier mobile : hauteur VisualViewport, navigation basse masquée pendant la saisie, zoom autorisé.
- Raccourci vers un appel actif, avec espace réservé pour ne pas masquer la saisie.
- Téléphonie montée dans le layout dashboard, persistante entre ses pages, retirée du layout public.
- Brouillons locaux par organisation, utilisateur et contact. Erreurs HTTP et réseau visibles, texte conservé.
- Canaux d’envoi limités aux SMS et WhatsApp réellement pris en charge par l’API.
- État d’envoi provisoire affiché immédiatement ; suppression de cet état après échec.
- Annulation/ignorance des anciennes requêtes lors d’un changement de conversation.
- Connexion temps réel stable entre les conversations, déduplication des événements par identifiant.
- Snapshots IndexedDB : au maximum 60 entrées, expiration après 7 jours, 100 contacts / 100 messages par snapshot.
- Lecture des snapshots lorsque le réseau est coupé et écran de secours /~offline pour un démarrage sans réseau.
- L’écran de secours permet de préparer un brouillon ; reprise explicite en ligne pour envoyer.
- Historique d’appels isolé par organisation et utilisateur ; anciennes données non attribuables supprimées.
- Purge des données privées à la déconnexion/changement de compte et effacement des vues sur notification inter-onglets.
- Reconnexion sans rechargement forcé. Nouveau service worker en attente jusqu’à fermeture des anciennes fenêtres.
- Requêtes API et documents authentifiés non mis en cache par le service worker ; fichiers statiques et icônes seulement.
- Manifestes harmonisés, entrée sur la messagerie, suppression de la fausse capture d’écran.
- Modales et tiroirs : focus contenu/restauré, gestion des empilements, bouton Fermer tactile et présentation mobile.
- Réduction des animations respectée, boutons partagés plus faciles à toucher, focus visible.
- Lectures des trois sources de l’historique lancées en parallèle.
- Vrai lecteur audio pour les messages vocaux disponibles ; suppression du lecteur factice.
- Destinations de notifications limitées aux routes internes du dashboard.

## Vérifications
Le script scripts/test-mobile-experience.ts couvre les canaux autorisés, les brouillons par conversation, les erreurs HTTP, le mode hors ligne, les réponses tardives et le focus des modales.
Commande : npm run test:mobile.
Les scénarios ont passé pendant cette réalisation. Le contrôle TypeScript a également passé ; les dernières retouches font l’objet d’un contrôle final.
La vérification visuelle est limitée par des erreurs de connexion du navigateur de test. Aucun résultat sur appareil réel ni score de performance n’est revendiqué.

## Limites et suite nécessaire
- Pas de file d’envoi automatique hors ligne : le serveur et les fournisseurs doivent d’abord garantir la déduplication et gérer les résultats incertains pour éviter les doubles messages/facturations.
- Pas de garantie d’appel entrant ou continu écran verrouillé : validation iOS/Android réelle nécessaire.
- Les snapshots sont une copie locale bornée, non une synchronisation complète ou un archivage.
- Le cache du navigateur peut être évincé ; l’interface gère l’absence de données.
- Le contenu local n’est pas chiffré par ce changement. Sa durée, son périmètre et son effacement sont contrôlés.
- Pas de mesure Core Web Vitals, de virtualisation/pagination complète des listes, ni de refonte exhaustive des nombreux modules métier.
- Le service worker est désactivé en développement : son installation, son cycle de mise à jour et le démarrage hors ligne demandent une validation sur build de production servi en HTTPS.
- Aucun envoi réel, aucune migration et aucun déploiement n’ont été effectués.
- Les modifications déjà présentes dans le softphone et la bannière d’installation ont été conservées.
