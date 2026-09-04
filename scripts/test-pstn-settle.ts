/**
 * Test ad hoc de la réconciliation settlement ↔ réservation (fonction PURE computeSettleAdjustment).
 * Exécution : npx tsx scripts/test-pstn-settle.ts
 *
 * Vérifie notamment la règle #6 :
 *   - actualCost < reservation.amount → différence REMBOURSÉE
 *   - actualCost = reservation.amount → AUCUN ajustement
 *   - actualCost > reservation.amount → supplément DÉBITÉ atomiquement (gte)
 */

import { computeSettleAdjustment } from "../lib/pstn-cost";

type Case = {
  name: string;
  heldAmount: number;
  actualWalletCost: number;
  expect: { extraDebit: number; refund: number };
};

const CASES: Case[] = [
  {
    name: "actualCost < hold (10 < 20) → remboursement de 10",
    heldAmount: 20,
    actualWalletCost: 10,
    expect: { extraDebit: 0, refund: 10 },
  },
  {
    name: "actualCost = hold (10 = 10) → aucun ajustement",
    heldAmount: 10,
    actualWalletCost: 10,
    expect: { extraDebit: 0, refund: 0 },
  },
  {
    name: "actualCost > hold (25 > 20) → débit supplémentaire de 5",
    heldAmount: 20,
    actualWalletCost: 25,
    expect: { extraDebit: 5, refund: 0 },
  },
  {
    name: "hold = 0 (aucune pré-déduction, minutes incluses) → on débite tout le réel",
    heldAmount: 0,
    actualWalletCost: 12,
    expect: { extraDebit: 12, refund: 0 },
  },
  {
    name: "hold = 0 et réel = 0 (entièrement couvert) → aucun ajustement",
    heldAmount: 0,
    actualWalletCost: 0,
    expect: { extraDebit: 0, refund: 0 },
  },
];

const round = (n: number, p = 6) => Math.round(n * 10 ** p) / 10 ** p;

let failures = 0;
for (const c of CASES) {
  const r = computeSettleAdjustment({ heldAmount: c.heldAmount, actualWalletCost: c.actualWalletCost });
  const extraOk = round(r.extraDebit) === c.expect.extraDebit;
  const refundOk = round(r.refund) === c.expect.refund;
  if (extraOk && refundOk) {
    console.log(`PASS  ${c.name}`);
  } else {
    failures++;
    console.log(`FAIL  ${c.name}`);
    console.log(`  attendu extraDebit=${c.expect.extraDebit}, refund=${c.expect.refund}`);
    console.log(`  obtenu extraDebit=${r.extraDebit}, refund=${r.refund}`);
  }
}

console.log("");
console.log(failures === 0 ? `TOUS LES TESTS PASSENT (${CASES.length})` : `${failures} TEST(S) EN ÉCHEC`);
process.exit(failures === 0 ? 0 : 1);
