import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "No org" }, { status: 404 });

    const { amount } = await request.json();
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Simulate Top-up
    const updatedOrg = await prisma.organization.update({
      where: { id: org.id },
      data: {
        walletBalance: { increment: amount },
        walletTransactions: {
          create: {
            amount: amount,
            type: "TOP_UP",
            description: `Recharge par carte bancaire (${amount}€)`
          }
        }
      }
    });

    return NextResponse.json({ success: true, newBalance: updatedOrg.walletBalance });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
