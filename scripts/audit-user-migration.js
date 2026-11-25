const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:Jord%40ne300122@kgebwferveweznnuutxc.db.eu-central-1.nhost.run:5432/kgebwferveweznnuutxc'
});

async function main() {
  console.log('--- USERS ---');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isSuperAdmin: true,
      organizationId: true,
      passwordHash: true,
      emailVerified: true
    }
  });
  console.log(`Found ${users.length} users:`);
  for (const u of users) {
    const hashType = !u.passwordHash ? 'NULL' : u.passwordHash.startsWith('$2') ? 'BCRYPT' : 'SHA256_LEGACY';
    console.log(`- [${u.id}] ${u.email} | role: ${u.role} | org: ${u.organizationId} | hashType: ${hashType} (${u.passwordHash ? u.passwordHash.slice(0, 7) : ''}...)`);
  }

  console.log('\n--- ACCOUNTS (OAUTH) ---');
  const accounts = await prisma.account.findMany();
  console.log(`Found ${accounts.length} accounts:`, accounts);

  console.log('\n--- SESSIONS ---');
  const sessions = await prisma.session.findMany();
  console.log(`Found ${sessions.length} sessions`);

  console.log('\n--- SCHEMAS & TABLES IN NHOST DB ---');
  const schemas = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT table_schema FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema;
  `);
  console.log('Schemas:', schemas);

  const authTables = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth' ORDER BY table_name;
  `);
  console.log('Auth tables:', authTables);

  if (authTables.length > 0) {
    const authUsersColumns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'auth' AND table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    console.log('\n--- auth.users COLUMNS ---');
    console.log(authUsersColumns);

    const existingNhostUsers = await prisma.$queryRawUnsafe(`
      SELECT count(*) FROM auth.users;
    `);
    console.log('Count auth.users:', existingNhostUsers);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
