import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "Antigravity Demo",
          slug: "antigravity-demo",
          walletBalance: 50.00
        }
      });
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      balance: org.walletBalance,
      transactions
    });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
