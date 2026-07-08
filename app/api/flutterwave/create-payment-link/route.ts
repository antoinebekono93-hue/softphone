import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const body = await request.json();
    const { amount } = body; // Montant en euros/XOF/USD selon la configuration

    if (!amount || amount < 5) {
      return NextResponse.json({ error: 'Le montant minimum de recharge est de 5' }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { users: { take: 1 } }
    });

    if (!org) {
      return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 });
    }

    const userEmail = org.users[0]?.email || 'contact@example.com';
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Générer une référence de transaction unique
    const txRef = `WALLET_TOPUP_${orgId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // On passe l'organizationId et le montant dans tx_ref ou meta pour le webhook
    const payload = {
      tx_ref: txRef,
      amount: amount.toString(),
      currency: "EUR", // Peut être XOF ou autre selon la config
      redirect_url: `${origin}/dashboard/settings/billing?status=success_flutterwave`,
      meta: {
        type: 'WALLET_TOPUP',
        organizationId: orgId,
        amount: amount.toString()
      },
      customer: {
        email: userEmail,
        name: org.name
      },
      customizations: {
        title: "Recharge Portefeuille IA & Télécom",
        description: `Crédit de ${amount}€ pour l'utilisation des Agents IA`
      }
    };

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.status === "success" && data.data && data.data.link) {
      return NextResponse.json({ url: data.data.link });
    } else {
      console.error("[Flutterwave] Payment Init Failed:", data);
      return NextResponse.json({ error: "Erreur lors de l'initialisation du paiement Flutterwave" }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Flutterwave] Checkout Erreur:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
