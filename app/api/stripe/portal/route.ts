import { NextResponse } from "next/server";

// ANCIEN MODE DE PAIEMENT (Stripe) — DÉSACTIVÉ.
// Le flux de paiement a été basculé vers CinetPay.
// Le code original est conservé ci-dessous, entièrement commenté.

export async function POST() {
  return NextResponse.json(
    { error: "Le paiement Stripe est désactivé. Utilisez CinetPay." },
    { status: 410 }
  );
}

// ---------------------------------------------------------------------------
// CODE ORIGINAL (commenté)
// ---------------------------------------------------------------------------

// import { NextResponse } from "next/server";
// import { auth } from "@/auth";
// import { stripe } from "@/lib/stripe";
// import { prisma } from "@/lib/prisma";
//
// /**
//  * POST /api/stripe/portal
//  *
//  * Creates a Stripe Customer Portal session for the authenticated user.
//  * Allows them to manage their subscription, payment method, and invoices.
//  */
// export async function POST() {
//   try {
//     const session = await auth();
//
//     if (!session?.user?.organizationId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//
//     const org = await prisma.organization.findUnique({
//       where: { id: session.user.organizationId },
//       select: { stripeCustomerId: true },
//     });
//
//     if (!org?.stripeCustomerId) {
//       return NextResponse.json(
//         { error: "No billing account found" },
//         { status: 404 }
//       );
//     }
//
//     const portalSession = await stripe.billingPortal.sessions.create({
//       customer: org.stripeCustomerId,
//       return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
//     });
//
//     return NextResponse.json({ url: portalSession.url });
//   } catch (error) {
//     console.error("[Stripe Portal] Error:", error);
//     return NextResponse.json(
//       { error: "Failed to create portal session" },
//       { status: 500 }
//     );
//   }
// }
