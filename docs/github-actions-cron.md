# Tâches planifiées de production

Les tâches périodiques sont déclenchées par GitHub Actions afin que le projet
reste déployable sur Vercel Hobby. Le fichier `vercel.json` ne déclare donc
aucun Vercel Cron.

## Secrets GitHub requis

Dans **GitHub > Settings > Secrets and variables > Actions**, créer :

- `PROD_URL` : URL HTTPS canonique de la production, sans chemin, par exemple
  `https://application-softphone-xi.vercel.app` ;
- `CRON_SECRET` : secret aléatoire fort, identique à la variable
  `CRON_SECRET` configurée dans Vercel pour l'environnement Production.

Le secret ne doit jamais être ajouté au dépôt. Après configuration, lancer
manuellement le workflow **Production cron jobs**, groupe `all`, puis vérifier
que chaque endpoint renvoie un code HTTP 2xx.

## Planification (UTC)

| Fréquence | Routes | Fonction |
| --- | --- | --- |
| Toutes les 5 min | `app-calls-timeout`, `pstn-calls-timeout` | Filet de sécurité pour les appels expirés |
| Toutes les 5 min | `workers/pstn-forwarding` | Récupération des transferts en retard |
| Toutes les 5 min | `flows`, `campaign-worker`, `workers/dialer` | Automatisations et campagnes |
| Toutes les 15 min | `billing-sync` | Réconciliation des coûts CDR Telnyx |
| Tous les jours à 02:23 | `predictive-analytics` | Mise à jour des indicateurs CRM |
| Le 1er du mois à 00:05 | `reset-included-minutes` | Renouvellement idempotent des minutes incluses |

GitHub Actions ne garantit pas une exécution à la seconde près et peut retarder
un workflow planifié. Les appels entrants, sortants, le raccrochage et la
facturation initiale restent pilotés par les webhooks Telnyx : ils ne dépendent
pas de ces tâches périodiques.

## Transfert APP_THEN_FORWARD

Le déclenchement après 5 à 60 secondes ne doit pas dépendre de GitHub Actions.
Le processus suivant doit être déployé sur un runtime permanent :

```bash
npm run worker:pstn-forward
```

Il utilise `DATABASE_URL`, les paramètres Telnyx de production et, si défini,
`PSTN_FORWARD_POLL_MS` (1 000 ms par défaut). L'appel GitHub toutes les cinq
minutes vers `workers/pstn-forwarding` est uniquement un filet de récupération.

## Routes volontairement non planifiées

- `api/cron/sequences` n'est pas activée : ses actions SMS, WhatsApp et AI Call
  contiennent encore des implémentations simulées.
- `api/workers/sms` n'est pas une tâche planifiée et contient encore un numéro
  d'expéditeur de substitution. Elle doit être rendue multi-tenant avant usage
  en production.

## Limites opérationnelles

Les horaires GitHub sont exprimés en UTC. Sur un dépôt public, GitHub peut
désactiver les workflows planifiés après 60 jours sans activité. Les exécutions
peuvent aussi être retardées en période de forte charge ; les routes sont donc
conçues pour être rejouables et le workflow effectue des tentatives limitées.
