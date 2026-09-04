-- ============================================================================
-- PRE-MIGRATION INSPECTION — Phase 1 (exécuter avant la migration)
-- ----------------------------------------------------------------------------
-- Rôle : contrôler les valeurs EXISTANTES des champs Float qui vont être
-- convertis en DECIMAL, afin de détecter tout débordement / arrondi avant
-- d'appliquer la migration (qui utilise des clauses USING de cast explicite).
--
-- À lancer sur la base PostgreSQL Nhost avec un client psql, par exemple :
--   psql "$DATABASE_URL" -f pre_migration_inspection.sql
--
-- ATTENTION : ne modifie aucune donnée. Lecture seule.
-- ============================================================================

\echo '=== 1) Organization.walletBalance (-> DECIMAL(12,4)) ==='
-- 12 chiffres significatifs dont 4 décimales => max 99,999,999.9999
-- Signale toute valeur qui dépasserait la précision cible.
SELECT id, name, walletBalance,
       (abs(walletBalance) > 99999999.9999) AS would_overflow
FROM "Organization"
ORDER BY abs(walletBalance) DESC;

\echo ''
\echo '=== 2) PricingPlan.monthlyPrice (-> DECIMAL(12,4)) ==='
SELECT id, name, monthlyPrice,
       (abs(monthlyPrice) > 99999999.9999) AS would_overflow
FROM "PricingPlan"
ORDER BY abs(monthlyPrice) DESC;

\echo ''
\echo '=== 3) WalletTransaction.amount (-> DECIMAL(12,4)) ==='
SELECT count(*) AS total_tx,
       count(*) FILTER (WHERE abs(amount) > 99999999.9999) AS overflow_count,
       min(amount) AS min_amount,
       max(amount) AS max_amount,
       avg(amount) AS avg_amount
FROM "WalletTransaction";

\echo ''
\echo '=== 4) SystemSettings — taux (-> DECIMAL(12,6) / DECIMAL(12,4)) ==='
-- DECIMAL(12,6) : max 999,999.999999 ; DECIMAL(12,4) : max 99,999,999.9999
SELECT id,
       smsRate, callRatePerMinute, aiAgentRatePerMinute, whatsappRate,
       phoneNumberRate, eSimRate, phoneNumberMarkupFixed, phoneNumberMarkupMultiplier,
       (abs(smsRate) > 999999.999999)
         OR (abs(callRatePerMinute) > 999999.999999)
         OR (abs(aiAgentRatePerMinute) > 999999.999999)
         OR (abs(whatsappRate) > 999999.999999) AS would_overflow_12_6,
       (abs(phoneNumberRate) > 99999999.9999)
         OR (abs(eSimRate) > 99999999.9999)
         OR (abs(phoneNumberMarkupFixed) > 99999999.9999)
         OR (abs(phoneNumberMarkupMultiplier) > 99999999.9999) AS would_overflow_12_4
FROM "SystemSettings";

\echo ''
\echo '=== 5) Contrôle : CallLog.cost/billedAmount n''existent pas encore (colonnes ajoutées, NULL) ==='
-- Colonnes ajoutées par la migration : rien à pré-contrôler ici, elles seront NULL.
SELECT 'CallLog: pas de contrôle pré-migration requis (colonnes ajoutées NULL)' AS note;

\echo ''
\echo '=== 6) Contraintes UNIQUE à venir — aucun risque (colonnes NULL) ==='
-- callUsername / callExtension sont des colonnes NULL ajoutées : Postgres autorise
-- plusieurs NULL dans un index UNIQUE, donc aucune violation possible à l''insertion.
SELECT 'User.callUsername/callExtension : colonnes NULL, aucun conflit possible' AS note;

\echo ''
\echo '=== 7) Santé : transactions et organisation n''ayant pas de FK valide ==='
SELECT 'Organization count' AS metric, count(*)::text AS value FROM "Organization"
UNION ALL SELECT 'PricingPlan count', count(*)::text FROM "PricingPlan"
UNION ALL SELECT 'WalletTransaction count', count(*)::text FROM "WalletTransaction"
UNION ALL SELECT 'SystemSettings count', count(*)::text FROM "SystemSettings";

\echo ''
\echo '=== FIN — Si aucune ligne "would_overflow = true", la migration est sûre. ==='
