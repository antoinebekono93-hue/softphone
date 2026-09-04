import { PrismaClient, Prisma } from '@prisma/client';

/**
 * SEED DES PLANS COMMERCIAUX — Phase 1 "Appels Illimités"
 * =======================================================
 * Catégorie cible APP_TO_APP (WebRTC natif P2P) : les plans à `unlimitedCalls: true`
 * offrent des appels APP_TO_APP illimités COMMERCIALEMENT.
 *
 * Les champs maxCallDurationSeconds / maxConcurrentCalls / maxCallsPerHour /
 * maxCallsPerDay sont des PROTECTIONS TECHNIQUES / fair-use et ne constituent
 * PAS le quota commercial APP_TO_APP.
 *
 * APP_TO_PSTN reste TOUJOURS soumis au wallet/quota + pré-autorisation,
 * indépendamment de unlimitedCalls.
 *
 * allowedDestinations = "" signifie "aucune restriction configurée"
 * (jamais "aucune destination autorisée").
 *
 * Idempotent : upsert par `name` (les Stripe/Flutterwave IDs éventuels sont
 * préservés s'ils existent déjà).
 *
 * Exécution (une fois la migration appliquée) :
 *   npx tsx prisma/seedPlans.ts
 */
const prisma = new PrismaClient();

type PlanSeed = {
  name: string;
  monthlyPrice: string;
  includedMinutes: number;
  includedSms: number;
  unlimitedCalls: boolean;
  maxCallDurationSeconds: number;
  maxConcurrentCalls: number;
  maxCallsPerHour: number;
  maxCallsPerDay: number;
  allowedDestinations: string;
  blockedDestinations: string;
  internationalEnabled: boolean;
  hasRecording: boolean;
  hasTransfer: boolean;
  hasAdvancedAnalytics: boolean;
  hasCallRouting: boolean;
  preAuthRequired: boolean;
  isActive: boolean;
  features: string[];
};

const plans: PlanSeed[] = [
  {
    // OFFRE PHARE : APP_TO_APP illimité (commercial), PSTN soumis wallet
    name: 'Appels Illimités',
    monthlyPrice: '29.0000',
    includedMinutes: 0,
    includedSms: 0,
    unlimitedCalls: true,
    maxCallDurationSeconds: 3600, // fair-use
    maxConcurrentCalls: 1, // fair-use
    maxCallsPerHour: 20, // fair-use
    maxCallsPerDay: 100, // fair-use
    allowedDestinations: '', // aucune restriction configurée
    blockedDestinations: '', // aucune restriction configurée
    internationalEnabled: false,
    hasRecording: false,
    hasTransfer: false,
    hasAdvancedAnalytics: false,
    hasCallRouting: false,
    preAuthRequired: true,
    isActive: true,
    features: ['Appels app-to-app illimités', 'Numéro de téléphone inclus'],
  },
  {
    name: 'Basic',
    monthlyPrice: '9.0000',
    includedMinutes: 100,
    includedSms: 50,
    unlimitedCalls: false,
    maxCallDurationSeconds: 1800,
    maxConcurrentCalls: 1,
    maxCallsPerHour: 15,
    maxCallsPerDay: 60,
    allowedDestinations: '',
    blockedDestinations: '',
    internationalEnabled: false,
    hasRecording: false,
    hasTransfer: false,
    hasAdvancedAnalytics: false,
    hasCallRouting: false,
    preAuthRequired: true,
    isActive: true,
    features: ['100 minutes PSTN', '50 SMS', 'Agents illimités'],
  },
  {
    name: 'Standard',
    monthlyPrice: '29.0000',
    includedMinutes: 500,
    includedSms: 200,
    unlimitedCalls: false,
    maxCallDurationSeconds: 3600,
    maxConcurrentCalls: 2,
    maxCallsPerHour: 30,
    maxCallsPerDay: 150,
    allowedDestinations: '',
    blockedDestinations: '',
    internationalEnabled: false,
    hasRecording: true,
    hasTransfer: false,
    hasAdvancedAnalytics: false,
    hasCallRouting: false,
    preAuthRequired: true,
    isActive: true,
    features: ['500 minutes PSTN', '200 SMS', 'Enregistrement des appels'],
  },
  {
    name: 'Premium',
    monthlyPrice: '79.0000',
    includedMinutes: 2000,
    includedSms: 1000,
    unlimitedCalls: true,
    maxCallDurationSeconds: 7200,
    maxConcurrentCalls: 5,
    maxCallsPerHour: 60,
    maxCallsPerDay: 400,
    allowedDestinations: '',
    blockedDestinations: '',
    internationalEnabled: true,
    hasRecording: true,
    hasTransfer: true,
    hasAdvancedAnalytics: true,
    hasCallRouting: true,
    preAuthRequired: true,
    isActive: true,
    features: [
      '2000 minutes PSTN',
      '1000 SMS',
      'International',
      'Appels illimités (app-to-app)',
      'Routage intelligent',
      'Analytiques avancées',
    ],
  },
];

async function main() {
  console.log('Seeding pricing plans (Phase 1)...');

  for (const plan of plans) {
    const existing = await prisma.pricingPlan.findFirst({ where: { name: plan.name } });

    const data = {
      name: plan.name,
      monthlyPrice: new Prisma.Decimal(plan.monthlyPrice),
      includedMinutes: plan.includedMinutes,
      includedSms: plan.includedSms,
      unlimitedCalls: plan.unlimitedCalls,
      maxCallDurationSeconds: plan.maxCallDurationSeconds,
      maxConcurrentCalls: plan.maxConcurrentCalls,
      maxCallsPerHour: plan.maxCallsPerHour,
      maxCallsPerDay: plan.maxCallsPerDay,
      allowedDestinations: plan.allowedDestinations,
      blockedDestinations: plan.blockedDestinations,
      internationalEnabled: plan.internationalEnabled,
      hasRecording: plan.hasRecording,
      hasTransfer: plan.hasTransfer,
      hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
      hasCallRouting: plan.hasCallRouting,
      preAuthRequired: plan.preAuthRequired,
      isActive: plan.isActive,
    };

    let planId: string;
    if (existing) {
      await prisma.pricingPlan.update({ where: { id: existing.id }, data });
      planId = existing.id;
      console.log(`  updated: ${plan.name}`);
    } else {
      const created = await prisma.pricingPlan.create({ data });
      planId = created.id;
      console.log(`  created: ${plan.name}`);
    }

    // Features (idempotent : wipe + re-create pour ce plan)
    await prisma.planFeature.deleteMany({ where: { pricingPlanId: planId } });
    for (const name of plan.features) {
      await prisma.planFeature.create({ data: { name, pricingPlanId: planId } });
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
