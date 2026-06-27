import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.smsMessage.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.phoneNumber.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      walletBalance: 150.00,
      minutesUsedThisMonth: 3420,
    },
  });

  console.log(`Created organization: ${org.name}`);

  // Create User
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@acmecorp.com',
      organizationId: org.id,
      role: 'OWNER',
    },
  });

  console.log(`Created user: ${user.name}`);

  // Create Phone Numbers
  const number1 = await prisma.phoneNumber.create({
    data: {
      number: '+15551234567',
      friendlyName: 'Main Office',
      telnyxId: 'telnyx_id_1',
      country: 'US',
      organizationId: org.id,
      assignedUserId: user.id,
    },
  });

  const number2 = await prisma.phoneNumber.create({
    data: {
      number: '+33612345678',
      friendlyName: 'Support FR',
      telnyxId: 'telnyx_id_2',
      country: 'FR',
      organizationId: org.id,
    },
  });

  console.log('Created phone numbers');

  // Create Call Logs
  const callLogsData = [
    {
      telnyxCallControlId: 'call_1',
      direction: 'INBOUND',
      status: 'COMPLETED',
      fromNumber: '+19876543210',
      toNumber: number1.number,
      duration: 125,
      organizationId: org.id,
      userId: user.id,
      phoneNumberId: number1.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      answeredAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 5000),
      endedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 130000),
    },
    {
      telnyxCallControlId: 'call_2',
      direction: 'OUTBOUND',
      status: 'NO_ANSWER',
      fromNumber: number2.number,
      toNumber: '+33987654321',
      duration: 0,
      organizationId: org.id,
      userId: user.id,
      phoneNumberId: number2.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      endedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 30000),
    },
    {
      telnyxCallControlId: 'call_3',
      direction: 'INBOUND',
      status: 'COMPLETED',
      fromNumber: '+447700900077',
      toNumber: number1.number,
      duration: 340,
      organizationId: org.id,
      userId: user.id,
      phoneNumberId: number1.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      answeredAt: new Date(Date.now() - 1000 * 60 * 60 * 48 + 4000),
      endedAt: new Date(Date.now() - 1000 * 60 * 60 * 48 + 344000),
    }
  ];

  for (const call of callLogsData) {
    await prisma.callLog.create({ data: call });
  }
  console.log('Created call logs');

  // Create SMS Messages
  const smsData = [
    {
      telnyxMessageId: 'msg_1',
      direction: 'OUTBOUND',
      body: 'Hello! Your appointment is confirmed for tomorrow.',
      status: 'DELIVERED',
      type: 'SMS',
      cost: 0.005,
      country: 'US',
      fromNumber: number1.number,
      toNumber: '+19876543210',
      organizationId: org.id,
      userId: user.id,
      phoneNumberId: number1.id,
      sentAt: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      telnyxMessageId: 'msg_2',
      direction: 'INBOUND',
      body: 'Thank you. I will be there.',
      status: 'DELIVERED',
      type: 'SMS',
      cost: 0.000,
      country: 'US',
      fromNumber: '+19876543210',
      toNumber: number1.number,
      organizationId: org.id,
      userId: user.id,
      phoneNumberId: number1.id,
      sentAt: new Date(Date.now() - 1000 * 60 * 55),
    },
    {
      telnyxMessageId: 'msg_3',
      direction: 'OUTBOUND',
      body: 'Promo: Get 20% off all softphone plans this weekend!',
      status: 'UNDELIVERED',
      type: 'SMS',
      cost: 0.007,
      country: 'FR',
      fromNumber: number2.number,
      toNumber: '+33987654321',
      organizationId: org.id,
      userId: user.id,
      phoneNumberId: number2.id,
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    }
  ];

  for (const sms of smsData) {
    await prisma.smsMessage.create({ data: sms });
  }
  console.log('Created SMS messages');

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
