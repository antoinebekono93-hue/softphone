import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Exécution via Vercel Cron ou Trigger manuel
export async function GET(req: Request) {
  try {
    // Dans une application de production, on sécurise cette route via un token Vercel Cron ou une clé secrète.
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contacts = await prisma.contact.findMany({
      where: {
        totalSpent: { gt: 0 } // Seulement les clients ayant déjà acheté
      }
    });

    let updatedCount = 0;

    for (const contact of contacts) {
      let riskScore = 0;
      
      // 1. Récence (Recency)
      if (contact.lastPurchaseAt) {
        const daysSinceLastPurchase = Math.floor((Date.now() - contact.lastPurchaseAt.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastPurchase > 90) {
          riskScore += 50; // Risque majeur
        } else if (daysSinceLastPurchase > 60) {
          riskScore += 30; // Risque modéré
        } else if (daysSinceLastPurchase > 30) {
          riskScore += 10; // Risque faible
        }
      } else {
        // S'il n'a pas de date mais a dépensé, c'est une donnée asymétrique, risque modéré
        riskScore += 20;
      }

      // 2. Fréquence (Frequency)
      // Un client qui achetait beaucoup et s'arrête est plus risqué qu'un acheteur ponctuel
      if (contact.purchaseCount > 5 && riskScore >= 30) {
         riskScore += 20; // Churn d'un client très fidèle
      }

      // 3. Modulateur VIP
      // Perdre un VIP est critique, l'IA lève le drapeau rouge plus vite
      if (contact.isVip && riskScore >= 20) {
        riskScore += 15;
      }

      // Plafonner à 100
      riskScore = Math.min(riskScore, 100);

      // Calcul de la LTV simple (Total dépensé, mais on pourrait ajouter des projections futures)
      const ltv = contact.totalSpent;

      // Update in DB
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          churnRiskScore: riskScore,
          lifetimeValue: ltv
        }
      });

      updatedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Analytics prédictifs mis à jour pour ${updatedCount} contacts.` 
    });

  } catch (error: any) {
    console.error("[Cron Predictive Analytics Error]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
