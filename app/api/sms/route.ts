import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const period = searchParams.get("period");

    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const whereClause: any = { organizationId: org.id };

    if (type && type !== "ALL") {
      whereClause.type = type;
    }
    
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (period && period !== "all") {
      const days = period === '7d' ? 7 : 30;
      const date = new Date();
      date.setDate(date.getDate() - days);
      whereClause.sentAt = { gte: date };
    }

    const messages = await prisma.smsMessage.findMany({
      where: whereClause,
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching SMS:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
