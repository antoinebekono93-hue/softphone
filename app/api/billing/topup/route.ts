import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { creditWallet } from "@/lib/billing";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // SIMULATION : Au lieu de créer une session Stripe Checkout,
    // on crédite directement le wallet pour le test.
    await creditWallet(
      session.user.organizationId,
      amount,
      `Rechargement simulé via Tableau de bord (+${amount}$)`
    );

    return NextResponse.json({ success: true, message: "Wallet recharged successfully" });
  } catch (error: any) {
    console.error("[/api/billing/topup POST] Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
