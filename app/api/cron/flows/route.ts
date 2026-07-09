import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeFlow } from "@/lib/flow-engine";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Endpoint appelé par Vercel Cron (ou manuellement via scheduler)
 * toutes les minutes pour reprendre l'exécution des scénarios en pause.
 * GET /api/cron/flows
 */
export async function GET(req: Request) {
  try {
    // Vérification de sécurité CRON (facultative en dev, recommandée en prod)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // return new NextResponse('Unauthorized', { status: 401 }); // Désactivé pour la démo
    }

    const now = new Date();

    // Trouver tous les enrollments actifs dont le délai est écoulé
    const enrollmentsToResume = await prisma.whatsAppFlowEnrollment.findMany({
      where: {
        status: "ACTIVE",
        nextRunAt: {
          lte: now // Less than or equal to Now
        }
      },
      take: 50 // Traiter par lots pour éviter les timeouts serverless
    });

    console.log(`[Cron Flows] ${enrollmentsToResume.length} scénarios à reprendre.`);

    for (const enrollment of enrollmentsToResume) {
      try {
        // Optionnel : Effacer nextRunAt avant d'exécuter pour éviter la réentrance
        await prisma.whatsAppFlowEnrollment.update({
          where: { id: enrollment.id },
          data: { nextRunAt: null }
        });

        // Relancer le moteur à partir du currentNodeId
        await executeFlow(enrollment.id);
      } catch (e) {
        console.error(`[Cron Flows] Erreur lors de la reprise de ${enrollment.id}:`, e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: enrollmentsToResume.length 
    });

  } catch (error) {
    console.error("[Cron Flows] Fatal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
