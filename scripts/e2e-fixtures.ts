import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import bcrypt from "bcryptjs";

const PROJECT_DIR = "C:/Users/Antoine/3D Objects/github/2";

function getRaw(name: string): string {
  try {
    return readFileSync(`${PROJECT_DIR}/${name}`, "utf8");
  } catch {
    return "";
  }
}

function injectEnv(fileName: string, overwrite: boolean) {
  for (const line of getRaw(fileName).split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const k = m[1];
    if (overwrite || !(k in process.env)) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[k] = v;
    }
  }
}

injectEnv(".env", false);
injectEnv(".env.local", true);

const ORG_SLUG = "e2e-test-org";
const USERS = [
  { email: "e2e.alice@test.local", name: "E2E Alice", callUsername: "alice.e2e", callExtension: "4001", password: "E2E-Pass-2026!" },
  { email: "e2e.bob@test.local", name: "E2E Bob", callUsername: "bob.e2e", callExtension: "4002", password: "E2E-Pass-2026!" },
];

let prismaHandle: { prisma: any } | null = null;

async function main() {
  prismaHandle = await import(pathToFileURL(`${PROJECT_DIR}/lib/prisma.ts`).href);
  const { prisma } = prismaHandle as { prisma: any };
  const existing = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
  const org =
    existing ??
    (await prisma.organization.create({
      data: {
        name: "E2E Test Org",
        slug: ORG_SLUG,
        planStatus: "TRIALING",
        walletBalance: 10,
      },
    }));
  console.log(`org id: ${org.id} name=${org.name} slug=${org.slug} planStatus=${org.planStatus}`);

  for (const u of USERS) {
    const hash = bcrypt.hashSync(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        callUsername: u.callUsername,
        callExtension: u.callExtension,
        isCallable: true,
        organizationId: org.id,
        passwordHash: hash,
      },
      create: {
        email: u.email,
        name: u.name,
        role: "AGENT",
        callUsername: u.callUsername,
        callExtension: u.callExtension,
        isCallable: true,
        organizationId: org.id,
        passwordHash: hash,
      },
    });
    console.log(`user: ${u.email} id=${user.id.slice(0, 6)}... callUsername=${user.callUsername} callExtension=${user.callExtension} isCallable=${user.isCallable} hashPrefix=${user.passwordHash?.slice(0, 4)}`);
  }

  const check = await prisma.user.findMany({
    where: { organizationId: org.id, isCallable: true },
    select: { id: true, email: true, callUsername: true, callExtension: true, passwordHash: true },
  });
  console.log(`VERIFY: org users callable=${check.length}`);
  for (const c of check) {
    console.log(` - ${c.email} @${c.callUsername} ext=${c.callExtension} bcrypt=${c.passwordHash?.startsWith("$2")}`);
  }
}

main()
  .catch((e) => {
    console.error("[E2E-FIXTURES] ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    if (prismaHandle) await prismaHandle.prisma.$disconnect();
  });