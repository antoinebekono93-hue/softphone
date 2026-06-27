import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const messages = await prisma.smsMessage.findMany({
      where: { organizationId: org.id }
    });

    const totalMessages = messages.length;
    const totalCost = messages.reduce((acc, msg) => acc + msg.cost, 0);
    const deliveredCount = messages.filter(m => m.status === 'DELIVERED').length;
    const deliverabilityRate = totalMessages > 0 ? (deliveredCount / totalMessages) * 100 : 0;

    const countryMap = new Map<string, { count: number, cost: number }>();
    messages.forEach(msg => {
      if (msg.country) {
        const existing = countryMap.get(msg.country) || { count: 0, cost: 0 };
        countryMap.set(msg.country, { 
          count: existing.count + 1, 
          cost: existing.cost + msg.cost 
        });
      }
    });

    const countries = Array.from(countryMap.entries()).map(([country, stats]) => ({
      country,
      count: stats.count,
      cost: stats.cost
    })).sort((a, b) => b.cost - a.cost);

    return NextResponse.json({
      totalMessages,
      totalCost,
      deliverabilityRate,
      countries
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
