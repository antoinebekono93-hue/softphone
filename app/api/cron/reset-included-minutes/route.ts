import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/security";
import { currentPeriodStartUtc } from "@/lib/pstn-cost";

export const dynamic = "force-dynamic";

/**
 * Remise à zéro mensuelle du compteur de minutes incluses.
 *
 * `usageResetDate` est la SOURCE DE VÉRITÉ : chaque organisation porte la date
 * de début de sa période de minutes incluses courante. On ne remet à zéro QUE
 * les organisations dont la période a réellement basculé (usageResetDate
 * antérieur au début du mois UTC courant) — jamais de reset aveugle sur les
 * compteurs encore dans leur période.
 *
 * Propriétés :
 *  - idempotent : une fois `usageResetDate` passé à `now`, le prédicat échoue
 *    aux exécutions suivantes du même mois ;
 *  - atomique/concurrent : `updateMany` est une seule instruction UPDATE
 *    conditionnelle ; deux crons simultanés ne font pas de double reset
 *    (le second voit usageResetDate déjà à jour) ;
 *  - multi-organisations : le reset est appliqué organisateur par l'UPDATE
 *    conditionnel sur toutes les lignes éligibles simultanément.
 * Sécurisé par CRON_SECRET (fail-closed en production).
 */
export async function GET(req: Request) {
  if (!requireCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const periodStart = currentPeriodStartUtc();
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Seules les organisations dont la période a basculé sont réinitialisées.
      const updated = await tx.organization.updateMany({
        where: { usageResetDate: { lt: periodStart } },
        data: {
          minutesUsedThisMonth: 0,
          usageResetDate: now,
        },
      });
      return updated.count;
    });

    return NextResponse.json({ success: true, resetCount: result });
  } catch (err) {
    console.error("[cron/reset-included-minutes] failed", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}