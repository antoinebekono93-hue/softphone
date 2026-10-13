/**
 * Tests A4 / A5 — Idempotence ATOMIQUE des webhooks (Stripe + Flutterwave).
 *
 * OBSOLÈTE : Stripe et Flutterwave ont été désactivés au profit de CinetPay.
 * Les routes /api/stripe/webhook et /api/flutterwave/webhook renvoient
 * désormais 410 Gone ; il n'y a donc plus de webhooks à tester ici.
 *
 * L'idempotence est désormais assurée côté CinetPay via la contrainte unique
 * WebhookEvent (provider, eventId), couverte par les tests d'intégration CinetPay.
 *
 * Exécution : npx tsx scripts/test-webhook-idempotence.ts
 */

console.log(
  "SKIP  Tests d'idempotence Stripe/Flutterwave : fournisseurs désactivés (basculés vers CinetPay)."
);
console.log("");
console.log("Résultat : 0 échec(s), tests obsolètes sautés.");
process.exit(0);
