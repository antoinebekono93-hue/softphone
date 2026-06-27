import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import SmsDashboardClient from "./SmsDashboardClient";
import { redirect } from "next/navigation";

// SERVER COMPONENT : Récupère les données de la base (ou de l'API Telnyx en async) AVANT de rendre le composant
export default async function SmsDashboardPage() {
  const session = await auth();
  let orgId = session?.user?.organizationId;

  // Fallback pour la démo si non connecté
  if (!orgId) {
    let defaultOrg = await prisma.organization.findFirst();
    if (!defaultOrg) {
      // Création automatique d'une org de test pour éviter le redirect en mode démo
      defaultOrg = await prisma.organization.create({
        data: {
          name: "Antigravity Demo",
          slug: "antigravity-demo",
          walletBalance: 50.00
        }
      });
    }
    orgId = defaultOrg.id;
  }

  // Récupération asynchrone des données lourdes côté serveur
  const messages = await prisma.smsMessage.findMany({
    where: { organizationId: orgId },
    orderBy: { sentAt: 'desc' },
    take: 100 // On peut limiter la charge initiale
  });

  const totalMessages = await prisma.smsMessage.count({
    where: { organizationId: orgId }
  });

  const totalCostObj = await prisma.smsMessage.aggregate({
    where: { organizationId: orgId },
    _sum: { cost: true }
  });
  const totalCost = totalCostObj._sum.cost || 0;

  const deliveredCount = await prisma.smsMessage.count({
    where: { organizationId: orgId, status: 'DELIVERED' }
  });

  const deliverabilityRate = totalMessages > 0 ? (deliveredCount / totalMessages) * 100 : 0;

  // Aggrégation géographique
  const countryAgg = await prisma.smsMessage.groupBy({
    by: ['country'],
    where: { organizationId: orgId, country: { not: null } },
    _sum: { cost: true },
    _count: { id: true }
  });

  const countries = countryAgg.map(c => ({
    country: c.country || 'Inconnu',
    count: c._count.id,
    cost: c._sum.cost || 0
  })).sort((a, b) => b.cost - a.cost);

  const initialStats = {
    totalMessages,
    totalCost,
    deliverabilityRate,
    countries
  };

  // Récupération des contacts pour les campagnes SMS
  const contacts = await prisma.contact.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true, phone: true }
  });

  // On passe les données pré-chargées au Client Component
  return (
    <SmsDashboardClient 
      initialMessages={JSON.parse(JSON.stringify(messages))} 
      initialStats={initialStats} 
      contacts={contacts}
    />
  );
}
