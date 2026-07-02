const { PrismaClient } = require('@prisma/client');

async function test(url) {
  const prisma = new PrismaClient({ datasourceUrl: url });
  try {
    const c = await prisma.user.count();
    console.log('SUCCESS:', url, '->', c);
  } catch(e) {
    console.log('ERROR:', url, '->', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const base = 'postgresql://postgres:Jord%40ne300122@kgebwferveweznnuutxc.db.eu-central-1.nhost.run:5432/kgebwferveweznnuutxc';
  await test(base + '?schema=public&sslmode=require&pgbouncer=true');
  await test(base + '?schema=public&sslmode=require');
  await test(base + '?sslmode=require');
}
run();
