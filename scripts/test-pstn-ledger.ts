/**
 * Tests d'intégration ledger PSTN (base de données).
 * Exécution : npx tsx scripts/test-pstn-ledger.ts
 *
 * Vérifie que le grand livre correspond EXACTEMENT aux mouvements wallets :
 *   finalBalance - initialBalance == SUM(WalletTransaction.amount)
 *
 * Cas couverts (exigences A3) :
 *  - CASE A : actualCost = hold
 *  - CASE B : actualCost > hold  (extraDebit, SETTLE = delta)
 *  - CASE C : actualCost < hold  (refund)
 *  - settlement appelé deux fois / webhook hangup dupliqué → aucun second débit
 *  - release + settlement : release gagne → aucun débit wallet
 *  - settlement puis release → aucun remboursement
 *
 * Nécessite une base PostgreSQL joignable. Si la base est injoignable,
 * le test est signalé SKIP (pas d'échec).
 */

import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ── Chargement .env / .env.local (sans dotenv) AVANT tout import lib/* ─────
// Même approche que test-webhook-idempotence.ts : validateEnv est fail-closed.
const ROOT = join(__dirname, "..");
for (const file of [".env", ".env.local"]) {
  const p = join(ROOT, file);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !m[1].startsWith("NEXT_PUBLIC") && !(m[1] in process.env)) {
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[m[1]] = val;
    }
  }
}
// Le pooler Nhost (transaction mode) n'accepte qu'un faible nombre de
// connexions via le query engine : on borne le pool des tests à 2.
if (process.env.DATABASE_URL?.includes("pgbouncer=true") && !/connection_limit=/.test(process.env.DATABASE_URL)) {
  process.env.DATABASE_URL += "&connection_limit=1&pool_timeout=120";
}

let prisma: PrismaClient;
let preAuthorizeCall: typeof import("../lib/pstn-billing").preAuthorizeCall;
let settlePstnCall: typeof import("../lib/pstn-billing").settlePstnCall;
let releasePstnReservation: typeof import("../lib/pstn-billing").releasePstnReservation;

const COST_PER_MINUTE = "0.1";
let failures = 0;

async function ping(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function setupOrg(label: string) {
  const slug = `ledger-test-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const plan = await prisma.pricingPlan.create({
    data: {
      name: `LT ${label}`,
      includedMinutes: 0,
      preAuthRequired: true,
      maxCallDurationSeconds: 600,
      maxConcurrentCalls: 10,
      isActive: true,
    },
  });
  const org = await prisma.organization.create({
    data: {
      name: slug,
      slug,
      walletBalance: 100,
      planStatus: "ACTIVE",
      pricingPlanId: plan.id,
    },
  });
  return { org, plan };
}

async function callLogOf(orgId: string, controlId: string) {
  return prisma.callLog.create({
    data: {
      telnyxCallControlId: controlId,
      direction: "outbound",
      status: "COMPLETED",
      fromNumber: "+1000000000",
      toNumber: "+1000000001",
      organizationId: orgId,
    },
  });
}

async function ledgerDelta(orgId: string): Promise<number> {
  const agg = await prisma.walletTransaction.aggregate({
    where: { organizationId: orgId },
    _sum: { amount: true },
  });
  return agg._sum.amount?.toNumber() ?? 0;
}

async function balanceOf(orgId: string): Promise<number> {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  return org!.walletBalance.toNumber();
}

async function checkLedger(orgId: string, label: string): Promise<void> {
  const delta = await ledgerDelta(orgId);
  const finalBalance = await balanceOf(orgId);
  const expectedDelta = finalBalance - 100; // wallet initial = 100
  if (Math.abs(delta - expectedDelta) < 0.0001) {
    console.log(`PASS  ${label} (ledger=${delta}, walletΔ=${expectedDelta})`);
  } else {
    failures++;
    console.log(`FAIL  ${label}: Σ ledger=${delta} mais walletΔ=${expectedDelta}`);
  }
}

async function run() {
  // Imports lib/* APRÈS la pré-charge .env (validateEnv fail-closed).
  prisma = (await import("../lib/prisma")).prisma;
  const billing = await import("../lib/pstn-billing");
  preAuthorizeCall = billing.preAuthorizeCall;
  settlePstnCall = billing.settlePstnCall;
  releasePstnReservation = billing.releasePstnReservation;

  const dbUp = await ping();
  if (!dbUp) {
    console.log("SKIP  Base de données injoignable — tests d'intégration ledger non exécutés.");
    console.log("      (à exécuter en staging/CI avec DATABASE_URL valide)");
    process.exit(0);
  }

  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { callRatePerMinute: new Prisma.Decimal(COST_PER_MINUTE), aiAgentRatePerMinute: new Prisma.Decimal("0.2") },
    create: { id: "default", callRatePerMinute: new Prisma.Decimal(COST_PER_MINUTE), aiAgentRatePerMinute: new Prisma.Decimal("0.2") },
  });

  // CASE A : durée = plafond estimé → actualCost == hold
  {
    const { org } = await setupOrg("A");
    const ctrl = `ctrl-a-${org.id}`;
    const callLog = await callLogOf(org.id, ctrl);
    const pre = await preAuthorizeCall({ organizationId: org.id, callControlId: ctrl, callLogId: callLog.id });
    if (!pre.authorized) { failures++; console.log(`FAIL  CASE A : pré-autorisation refusée ${pre.reason}`); }
    else {
      const first = await settlePstnCall({ callControlId: ctrl, organizationId: org.id, callLogId: callLog.id, durationSeconds: 600 });
      if (first.billed === true) {
        console.log(`PASS  CASE A hold=${pre.heldAmount} → settlement billed=${first.billed}`);
      } else {
        failures++; console.log(`FAIL  CASE A : settlement non facturé (billed=${first.billed})`);
      }
      // hold = 10 min × 0.1 = 1 ; réel = 10 min × 0.1 = 1 → aucun ajustement.
      await checkLedger(org.id, `CASE A (actual = hold, hold=${pre.heldAmount})`);
      const second = await settlePstnCall({ callControlId: ctrl, organizationId: org.id, callLogId: callLog.id, durationSeconds: 600 });
      const secondOk = second.billed === false;
      if (secondOk) console.log("PASS  CASE A idempotence : second settlement → billed=false");
      else { failures++; console.log(`FAIL  CASE A idempotence : re-facturation (billed=${second.billed})`); }
      await checkLedger(org.id, "idempotence (settlement x2) : ledger inchangé");
    }
  }

  // CASE B : durée > plafond estimé → extraDebit
  {
    const { org } = await setupOrg("B");
    const ctrl = `ctrl-b-${org.id}`;
    const callLog = await callLogOf(org.id, ctrl);
    const pre = await preAuthorizeCall({ organizationId: org.id, callControlId: ctrl, callLogId: callLog.id });
    if (!pre.authorized) { failures++; console.log(`FAIL  CASE B : pré-autorisation refusée ${pre.reason}`); }
    else {
      const settle = await settlePstnCall({ callControlId: ctrl, organizationId: org.id, callLogId: callLog.id, durationSeconds: 900 }); // 15 min → 1.5
      const expectExtra = Math.abs((settle.walletCost - settle.heldAmount) - 0.5) < 0.0001;
      if (expectExtra && settle.heldAmount === pre.heldAmount) {
        console.log(`PASS  CASE B (actual > hold : extraDebit=${(settle.walletCost - settle.heldAmount).toFixed(2)})`);
      } else {
        failures++;
        console.log(`FAIL  CASE B : held=${settle.heldAmount}, walletCost=${settle.walletCost}`);
      }
      await checkLedger(org.id, "CASE B (actual > hold)");
    }
  }

  // CASE C : durée < plafond estimé → refund
  {
    const { org } = await setupOrg("C");
    const ctrl = `ctrl-c-${org.id}`;
    const callLog = await callLogOf(org.id, ctrl);
    const pre = await preAuthorizeCall({ organizationId: org.id, callControlId: ctrl, callLogId: callLog.id });
    if (!pre.authorized) { failures++; console.log(`FAIL  CASE C : pré-autorisation refusée ${pre.reason}`); }
    else {
      const settle = await settlePstnCall({ callControlId: ctrl, organizationId: org.id, callLogId: callLog.id, durationSeconds: 300 }); // 5 min → 0.5
      const expectRefund = Math.abs(settle.refunded - 0.5) < 0.0001;
      if (expectRefund) {
        console.log(`PASS  CASE C (actual < hold : refund=${settle.refunded.toFixed(2)})`);
      } else {
        failures++;
        console.log(`FAIL  CASE C : refund=${settle.refunded}, attendu 0.5`);
      }
      await checkLedger(org.id, "CASE C (actual < hold)");
    }
  }

  // release + settlement concurrent (release gagne) → aucun débit wallet
  {
    const { org } = await setupOrg("D");
    const ctrl = `ctrl-d-${org.id}`;
    const callLog = await callLogOf(org.id, ctrl);
    const pre = await preAuthorizeCall({ organizationId: org.id, callControlId: ctrl, callLogId: callLog.id });
    if (!pre.authorized) { failures++; console.log(`FAIL  CASE D : pré-autorisation refusée ${pre.reason}`); }
    else {
      const released = await releasePstnReservation({ organizationId: org.id, callControlId: ctrl, callLogId: callLog.id, reason: "NO_ANSWER" });
      const settle = await settlePstnCall({ callControlId: ctrl, organizationId: org.id, callLogId: callLog.id, durationSeconds: 600 });
      const ok = released && settle.billed === false && Math.abs(settle.walletCost - 0) < 0.0001;
      if (ok) {
        console.log("PASS  release → settlement : aucun débit wallet (billed=false)");
      } else {
        failures++;
        console.log(`FAIL  CASE D : released=${released}, billed=${settle.billed}`);
      }
      await checkLedger(org.id, "release+settle : wallet net = remboursement du hold");
    }
  }

  // settlement puis release → aucun remboursement supplémentaire
  {
    const { org } = await setupOrg("E");
    const ctrl = `ctrl-e-${org.id}`;
    const callLog = await callLogOf(org.id, ctrl);
    const pre = await preAuthorizeCall({ organizationId: org.id, callControlId: ctrl, callLogId: callLog.id });
    if (!pre.authorized) { failures++; console.log(`FAIL  CASE E : pré-autorisation refusée ${pre.reason}`); }
    else {
      await settlePstnCall({ callControlId: ctrl, organizationId: org.id, callLogId: callLog.id, durationSeconds: 600 });
      const released = await releasePstnReservation({ organizationId: org.id, callControlId: ctrl, callLogId: callLog.id, reason: "NO_ANSWER" });
      if (released === false) {
        console.log("PASS  settle → release : pas de remboursement (réservation déjà SETTLED)");
      } else {
        failures++;
        console.log("FAIL  CASE E : release a remboursé après settlement");
      }
      await checkLedger(org.id, "settle+release : ledger inchangé après settlement");
    }
  }

  console.log("");
  console.log(failures === 0 ? "TOUS LES TESTS LEDGER PASSENT" : `${failures} TEST(S) EN ÉCHEC`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Erreur inattendue du test ledger:", err);
  process.exit(1);
});