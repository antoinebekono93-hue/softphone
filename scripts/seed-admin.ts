import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Super Admin...');

  // 1. Check if super admin organization exists
  let org = await prisma.organization.findFirst({
    where: { name: 'Admin Corp' }
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Admin Corp',
        slug: 'admin-corp',
        planStatus: 'ACTIVE',
      }
    });
    console.log('Created Admin Organization.');
  }

  // 2. Create the super admin user
  const adminEmail = 'admin@antigravity.io';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    // Note: In production with bcrypt, this should be a hashed password.
    // For now, it relies on the current SHA-256 implementation or will be updated when bcrypt is added.
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update('Admin123!').digest('hex');

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Super Admin',
        passwordHash: hash,
        role: 'ADMIN',
        isSuperAdmin: true,
        organizationId: org.id,
      }
    });
    console.log(`Created Super Admin user: ${adminEmail} (password: Admin123!)`);
  } else {
    // Ensure the flag is set
    await prisma.user.update({
      where: { email: adminEmail },
      data: { isSuperAdmin: true }
    });
    console.log(`Updated existing user ${adminEmail} to be Super Admin.`);
  }

  console.log('Done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
