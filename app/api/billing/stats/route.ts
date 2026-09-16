import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const transactions = await prisma.walletTransaction.findMany({
      where: {
        organizationId: org.id,
        amount: { lt: 0 } // only costs
      }
    });

    let smsCost = 0;
    let callCost = 0;
    let dataCost = 0;

    transactions.forEach(t => {
      const absAmount = Math.abs(t.amount.toNumber());
      if (t.type === 'SMS') smsCost += absAmount;
      if (t.type === 'CALL') callCost += absAmount;
      if (t.type === 'DATA_ESIM') dataCost += absAmount;
    });

    return NextResponse.json({
      smsCost,
      callCost,
      dataCost,
      totalCost: smsCost + callCost + dataCost
    });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
