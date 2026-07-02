const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:Jord%40ne300122@kgebwferveweznnuutxc.db.eu-central-1.nhost.run:5432/kgebwferveweznnuutxc'
});
prisma.user.count().then(console.log).catch(console.error).finally(() => prisma.$disconnect());
