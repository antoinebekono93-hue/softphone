const fs = require('fs');
let content = fs.readFileSync('auth.ts', 'utf8');

const replacement = `      const { fetchWithCache } = await import("@/lib/redis");
      const dbUser = await fetchWithCache("jwt-user-claim:" + userId, async () => {
        return await prisma.user.findUnique({
          where: { id: userId as string },
          select: accountSessionSelect,
        });
      }, 60);`;

content = content.replace(/      const dbUser = await prisma\.user\.findUnique\(\{\s*where: \{ id: userId as string \},\s*select: accountSessionSelect,\s*\}\);/, replacement);
fs.writeFileSync('auth.ts', content);
