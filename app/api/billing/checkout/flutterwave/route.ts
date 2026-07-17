import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const sessionAuth = await auth();
    if (!sessionAuth?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: sessionAuth.user.organizationId }
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";
    
    // Create a unique transaction reference
    const tx_ref = `topup_flw_${org.id}_${Date.now()}`;

    const flutterwavePayload = {
      tx_ref,
      amount: amount,
      currency: "USD", // Keeping in USD as agreed
      redirect_url: `${origin}/dashboard/billing?success=true`,
      payment_options: "card, mobilemoney, ussd, banktransfer",
      customer: {
        email: "billing@" + org.slug + ".com", // We use a dummy email
        name: org.name,
      },
      customizations: {
        title: "Recharge Wallet (Antigravity)",
        description: "Crédit prépayé pour les appels, SMS et IA",
        logo: "https://your-app-logo-url.com/logo.png", // Replace with actual logo URL in prod
      },
      meta: {
        organizationId: org.id,
        type: "TOP_UP_FLUTTERWAVE",
      }
    };

    // Fetch the payment link from Flutterwave v3 API
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY || "FLWSECK_TEST-dummy"}`
      },
      body: JSON.stringify(flutterwavePayload)
    });

    const responseData = await response.json();

    if (response.ok && responseData.status === "success") {
      return NextResponse.json({ url: responseData.data.link });
    } else {
      console.error("[Flutterwave API Error]", responseData);
      return NextResponse.json({ error: "Failed to generate Flutterwave payment link" }, { status: 500 });
    }

  } catch (error) {
    console.error("[Flutterwave Checkout Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
