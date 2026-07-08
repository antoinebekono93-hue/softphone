import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-06-24.dahlia' as any,
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const body = await request.json();
    const { amount } = body; // Montant en euros (ex: 10, 50, 100)

    if (!amount || amount < 5) {
      return NextResponse.json({ error: 'Le montant minimum de recharge est de 5€' }, { status: 400 });
    }

    // Récupérer l'organisation pour vérifier si on a déjà un customer_id
    const org = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!org) {
      return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 });
    }

    // URL de retour pour Stripe
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Créer la session de paiement
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: org.stripeCustomerId || undefined,
      client_reference_id: orgId, // IMPORTANT : Utilisé dans le webhook pour créditer le compte
      metadata: {
        type: 'WALLET_TOPUP',
        organizationId: orgId,
        amount: amount.toString()
      },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Recharge Portefeuille IA & Télécom',
              description: `Crédit de ${amount}€ pour l'utilisation des Agents IA, SMS et Appels Vocaux.`
            },
            unit_amount: amount * 100, // Stripe attend le montant en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard/settings/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/settings/billing?status=cancel`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('[Stripe Checkout] Erreur:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
