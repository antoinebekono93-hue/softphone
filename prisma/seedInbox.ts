import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Get the first organization to attach our data to
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error("No organization found. Please run the main seed first.");
    process.exit(1);
  }

  console.log(`Seeding inbox data for organization: ${org.name} (${org.id})`);

  // 2. We need a phone number to assign these logs to. Let's find one or create one.
  let phone = await prisma.phoneNumber.findFirst({
    where: { organizationId: org.id }
  });

  if (!phone) {
    phone = await prisma.phoneNumber.create({
      data: {
        number: "+33123456789",
        telnyxId: "mock_telnyx_id_for_seed",
        organizationId: org.id,
      }
    });
  }

  // 3. Create some SMS Messages
  await prisma.smsMessage.createMany({
    data: [
      {
        telnyxMessageId: `msg_${Date.now()}_1`,
        direction: "INBOUND",
        body: "Bonjour, je souhaite prendre rendez-vous pour demain matin. Est-ce possible ?",
        fromNumber: "+33611223344",
        toNumber: phone.number,
        organizationId: org.id,
        phoneNumberId: phone.id,
        sentAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      },
      {
        telnyxMessageId: `msg_${Date.now()}_2`,
        direction: "OUTBOUND",
        body: "Bien sûr, j'ai une disponibilité à 10h. Cela vous convient-il ?",
        fromNumber: phone.number,
        toNumber: "+33611223344",
        organizationId: org.id,
        phoneNumberId: phone.id,
        sentAt: new Date(Date.now() - 1000 * 60 * 25), // 25 mins ago
      },
      {
        telnyxMessageId: `msg_${Date.now()}_3`,
        direction: "INBOUND",
        body: "Parfait, à demain 10h !",
        fromNumber: "+33611223344",
        toNumber: phone.number,
        organizationId: org.id,
        phoneNumberId: phone.id,
        sentAt: new Date(Date.now() - 1000 * 60 * 20), // 20 mins ago
      }
    ]
  });

  // 4. Create some Call Logs with AI Transcriptions
  await prisma.callLog.create({
    data: {
      telnyxCallControlId: `call_${Date.now()}_1`,
      direction: "INBOUND",
      status: "COMPLETED",
      fromNumber: "+33799887766",
      toNumber: phone.number,
      duration: 145,
      organizationId: org.id,
      phoneNumberId: phone.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      endedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 145000),
      aiSummary: "Le client (M. Dupont) a appelé pour demander le tarif de la licence Premium. L'Agent IA lui a indiqué le prix de 99$/mois et lui a envoyé le lien d'inscription par SMS.",
      transcriptionText: "Agent: Bonjour et bienvenue chez Antigravity. Comment puis-je vous aider ?\nClient: Bonjour, je voulais connaître le prix de votre abonnement premium.\nAgent: L'abonnement Premium est à 99 dollars par mois, sans engagement. Souhaitez-vous que je vous envoie le lien d'inscription par SMS ?\nClient: Oui je veux bien, merci.\nAgent: C'est envoyé. Passez une excellente journée !",
    }
  });

  await prisma.callLog.create({
    data: {
      telnyxCallControlId: `call_${Date.now()}_2`,
      direction: "INBOUND",
      status: "VOICEMAIL",
      fromNumber: "+33655443322",
      toNumber: phone.number,
      duration: 25,
      organizationId: org.id,
      phoneNumberId: phone.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      endedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 25000),
      aiSummary: "Nouveau message vocal : Un livreur cherche à accéder au bâtiment.",
      transcriptionText: "Bonjour, c'est le livreur UPS. Je suis devant la porte du bâtiment B mais je n'ai pas le code. Pouvez-vous me rappeler au plus vite ? Merci.",
    }
  });

  await prisma.callLog.create({
    data: {
      telnyxCallControlId: `call_${Date.now()}_3`,
      direction: "INBOUND",
      status: "NO_ANSWER",
      fromNumber: "+442071234567",
      toNumber: phone.number,
      duration: 0,
      organizationId: org.id,
      phoneNumberId: phone.id,
      startedAt: new Date(),
    }
  });

  console.log("Inbox seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
