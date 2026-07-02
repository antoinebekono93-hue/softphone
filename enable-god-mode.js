const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'antoinebekono93@gmail.com' },
    data: { isSuperAdmin: true }
  });
  console.log("God mode enabled for:", user.email, "- isSuperAdmin:", user.isSuperAdmin);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
