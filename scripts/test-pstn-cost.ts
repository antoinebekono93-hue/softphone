/**
 * Testc ad hoc de la logique de facturation PSTN (fonction pure computePstnCost).
 * Exécution : npx tsx scripts/test-pstn-cost.ts
 */

import { computePstnCost } from "../lib/pstn-cost";

type Case = {
  name: string;
  durationSeconds: number;
  costPerMinute: number;
  includedPerMinute: number;
  usedThisMonth: number;
  expect: Partial<{
    totalCost: number;
    includedMinutesUsed: number;
    walletMinutesUsed: number;
    walletCost: number;
    durationMinutes: number;
  }>;
};

const CASES: Case[] = [
  {
    name: "Sans minutes incluses (plan Appels Illimités : includedMinutes=0) — tout au wallet",
    durationSeconds: 120, // 2 min
    costPerMinute: 0.02,
    includedPerMinute: 0,
    usedThisMonth: 0,
    expect: { durationMinutes: 2, includedMinutesUsed: 0, walletMinutesUsed: 2, totalCost: 0.04, walletCost: 0.04 },
  },
  {
    name: "Appel entièrement couvert par les minutes incluses — wallet à 0",
    durationSeconds: 300, // 5 min
    costPerMinute: 0.02,
    includedPerMinute: 100,
    usedThisMonth: 20,
    expect: { includedMinutesUsed: 5, walletMinutesUsed: 0, totalCost: 0.1, walletCost: 0 },
  },
  {
    name: "Appel partiellement couvert : 3 min incluses restantes puis wallet",
    durationSeconds: 300, // 5 min
    costPerMinute: 0.02,
    includedPerMinute: 100,
    usedThisMonth: 97,
    expect: { includedMinutesUsed: 3, walletMinutesUsed: 2, totalCost: 0.1, walletCost: 0.04 },
  },
  {
    name: "Minutes incluses épuisées — tout au wallet",
    durationSeconds: 60, // 1 min
    costPerMinute: 0.15,
    includedPerMinute: 50,
    usedThisMonth: 50,
    expect: { includedMinutesUsed: 0, walletMinutesUsed: 1, totalCost: 0.15, walletCost: 0.15 },
  },
  {
    name: "Réserve de minutes supérieure à l'appel (remainingIncluded > durée)",
    durationSeconds: 30, // 0.5 min
    costPerMinute: 0.02,
    includedPerMinute: 100,
    usedThisMonth: 0,
    expect: { includedMinutesUsed: 0.5, walletMinutesUsed: 0, totalCost: 0.01, walletCost: 0 },
  },
  {
    name: "Coût par seconde non arrondi à la minute (75s = 1.25 min)",
    durationSeconds: 75,
    costPerMinute: 0.20,
    includedPerMinute: 0,
    usedThisMonth: 0,
    expect: { durationMinutes: 1.25, walletMinutesUsed: 1.25, totalCost: 0.25, walletCost: 0.25 },
  },
  {
    name: "usedThisMonth dépasse included — pas de minutes incluses",
    durationSeconds: 120,
    costPerMinute: 0.02,
    includedPerMinute: 10,
    usedThisMonth: 999,
    expect: { includedMinutesUsed: 0, walletMinutesUsed: 2, totalCost: 0.04, walletCost: 0.04 },
  },
];

const round = (n: number, p = 6) => Math.round(n * 10 ** p) / 10 ** p;

let failures = 0;

for (const c of CASES) {
  const r = computePstnCost({
    durationSeconds: c.durationSeconds,
    costPerMinute: c.costPerMinute,
    includedPerMinute: c.includedPerMinute,
    usedThisMonth: c.usedThisMonth,
  });

  const checks: string[] = [];
  let ok = true;
  for (const [key, expected] of Object.entries(c.expect)) {
    const k = key as keyof typeof r;
    const got = round(r[k]);
    if (got !== expected) {
      ok = false;
      checks.push(`  ${key}: attendu ${expected}, obtenu ${got}`);
    }
  }

  if (ok) {
    console.log(`PASS  ${c.name}`);
  } else {
    failures++;
    console.log(`FAIL  ${c.name}`);
    console.log(`  durée=${r.durationMinutes}min incluses=${r.includedMinutesUsed}min wallet=${r.walletMinutesUsed}min total=${r.totalCost}$ walletCost=${r.walletCost}$`);
    for (const chk of checks) console.log(chk);
  }
}

console.log("");
console.log(failures === 0 ? `TOUS LES TESTS PASSENT (${CASES.length})` : `${failures} TEST(S) EN ÉCHEC`);
process.exit(failures === 0 ? 0 : 1);
