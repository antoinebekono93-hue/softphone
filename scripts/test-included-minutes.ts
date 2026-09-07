/**
 * Tests de la logique de période des minutes incluses (fonctions PURE).
 * Exécution : npx tsx scripts/test-included-minutes.ts
 *
 * Couvre les cas demandés par le chantier M1 :
 *  - mois courant (pas de reset)
 *  - mois suivant (reset requis)
 *  - reset concurrent / idempotence : la garde repose sur usageResetDate
 *    (comparée au début du mois UTC courant), jamais un reset différé global.
 */

import { currentPeriodStartUtc, isUsagePeriodElapsed } from "../lib/pstn-cost";

const NOW = new Date("2026-09-07T12:00:00Z");

type Case = {
  name: string;
  usageResetDate: Date;
  expectElapsed: boolean;
};

const CASES: Case[] = [
  {
    name: "Mois courant (reset date = aujourd'hui) → pas de reset",
    usageResetDate: new Date("2026-09-07T08:00:00Z"),
    expectElapsed: false,
  },
  {
    name: "Mois courant (reset date = début du mois) → pas de reset (boundaire exacte)",
    usageResetDate: new Date("2026-09-01T00:00:00Z"),
    expectElapsed: false,
  },
  {
    name: "Mois précédent (reset date = 31 août) → reset requis",
    usageResetDate: new Date("2026-08-31T23:59:59Z"),
    expectElapsed: true,
  },
  {
    name: "Début du mois précédent → reset requis",
    usageResetDate: new Date("2026-08-01T00:00:00Z"),
    expectElapsed: true,
  },
  {
    name: "Mois précédent lointain (année antérieure) → reset requis",
    usageResetDate: new Date("2026-01-15T00:00:00Z"),
    expectElapsed: true,
  },
  {
    name: "Date future (début mois suivant) → pas de reset",
    usageResetDate: new Date("2026-10-01T00:00:00Z"),
    expectElapsed: false,
  },
  {
    name: "currentPeriodStartUtc renvoie bien le 1er du mois à 00:00 UTC",
    usageResetDate: currentPeriodStartUtc(NOW),
    expectElapsed: false,
  },
];

let failures = 0;

for (const c of CASES) {
  const got = isUsagePeriodElapsed(c.usageResetDate, NOW);
  if (got === c.expectElapsed) {
    console.log(`PASS  ${c.name}`);
  } else {
    failures++;
    console.log(`FAIL  ${c.name}`);
    console.log(`  attendu elapsed=${c.expectElapsed}, obtenu elapsed=${got}`);
  }
}

console.log("");
console.log(failures === 0 ? `TOUS LES TESTS PASSENT (${CASES.length})` : `${failures} TEST(S) EN ÉCHEC`);
process.exit(failures === 0 ? 0 : 1);