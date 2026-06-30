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
      where: { id: session.user.organizationId },
      select: { walletBalance: true }
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      balance: org.walletBalance,
      transactions
    });
  } catch (error) {
    console.error("[/api/billing/wallet GET] Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
