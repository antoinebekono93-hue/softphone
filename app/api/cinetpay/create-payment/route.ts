import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getCinetPayClient,
  getCinetPayCurrencyForCountry,
  getCinetPayOperators,
  resolveClientCountry,
  toChargeAmount,
} from "@/lib/cinetpay";

/**
 * POST /api/cinetpay/create-payment
 *
 * Initialise un paiement CinetPay pour recharger le portefeuille de
 * l'organisation connectée, puis renvoie l'URL de la passerelle de paiement.
 *
 * Le pays du client est détecté automatiquement (en-têtes géo de l'hébergeur,
 * fuseau horaire du navigateur, Accept-Language, pays par défaut) et transmis à
 * CinetPay, de sorte que la passerelle n'affiche que les opérateurs mobile money
 * de ce pays.
 *
 * L'ancien flux Stripe/Flutterwave a été mis en commentaire dans l'UI
 * (voir app/dashboard/settings/billing/page.tsx). CinetPay est désormais
 * le moyen de paiement principal.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const body = await request.json();
    const amount = Number(body?.amount); // Montant en EUR (devise du wallet affichée)
    const overrideCountry = typeof body?.country === "string" ? body.country : null;
    const timeZone = typeof body?.timeZone === "string" ? body.timeZone : null;

    if (!Number.isFinite(amount) || amount < 1) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { users: { take: 1 } },
    });

    if (!org) {
      return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const client = getCinetPayClient();

    // Détection automatique du pays du client : en-têtes géo de l'hébergeur,
    // fuseau horaire du navigateur, Accept-Language, puis pays par défaut.
    // Le pays retenu est toujours un pays CinetPay configuré, ce qui restreint
    // la passerelle aux opérateurs mobile money de ce seul pays.
    const country = resolveClientCountry({
      override: overrideCountry,
      headers: request.headers,
      timeZone,
      configured: client.countries(),
    });

    const chargeCurrency = getCinetPayCurrencyForCountry(country);
    const chargeAmount = toChargeAmount(amount, chargeCurrency);

    // Identifiant marchand unique (max 30 caractères côté CinetPay).
    const merchantTransactionId = `BC${Date.now()}${crypto
      .randomBytes(4)
      .toString("hex")}`.slice(0, 30);

    const email =
      session.user.email ||
      org.users[0]?.email ||
      `billing+${org.slug}@example.com`;

    const nameParts = (org.name || "Buster Call").trim().split(/\s+/).filter(Boolean);
    const clientFirstName = (nameParts[0] || "Client").slice(0, 255) || "Client";
    const clientLastName =
      (nameParts.slice(1).join(" ") || "Buster").slice(0, 255) || "Buster";

    const payment = await client.payment.initialize(
      {
        currency: chargeCurrency,
        merchantTransactionId,
        amount: chargeAmount,
        lang: "fr",
        designation: "Recharge Portefeuille Buster Call",
        clientEmail: email,
        clientFirstName,
        clientLastName,
        successUrl: `${origin}/dashboard/settings/billing?status=success_cinetpay`,
        failedUrl: `${origin}/dashboard/settings/billing?status=cancel`,
        notifyUrl: `${origin}/api/cinetpay/webhook`,
        channel: "PUSH",
      },
      country,
    );

    // On enregistre l'intention de paiement AVANT la redirection : c'est cette
    // ligne qui permet au webhook de retrouver l'organisation et le montant
    // exact à créditer (le webhook CinetPay ne transmet pas le montant).
    await prisma.paymentIntent.create({
      data: {
        organizationId: orgId,
        merchantTransactionId,
        providerTransactionId: payment.transactionId,
        amount: new Prisma.Decimal(amount),
        chargeAmount,
        chargeCurrency,
        chargeCountry: country,
        notifyToken: payment.notifyToken,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      url: payment.paymentUrl,
      paymentToken: payment.paymentToken,
      transactionId: payment.transactionId,
      country,
      currency: chargeCurrency,
      operators: getCinetPayOperators(country),
    });
  } catch (error) {
    console.error("[CinetPay] Erreur d'initialisation du paiement:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors de l'initialisation du paiement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
