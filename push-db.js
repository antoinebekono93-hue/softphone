const { execSync } = require('child_process');

let url = process.env.DATABASE_URL || "";
if (url) {
try {
  const parsedUrl = new URL(url);
  // Remove problematic params for direct push
  parsedUrl.searchParams.delete("pgbouncer");
  parsedUrl.searchParams.delete("schema");
  parsedUrl.searchParams.set("connection_limit", "1");
  url = parsedUrl.toString();
} catch (e) {
  // Ignore parsing errors, try the original URL
}
}

console.log("Running prisma db push with sanitized connection string...");
try {
  execSync('npx prisma db push --accept-data-loss', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit'
  });
  console.log("Database push successful!");
} catch (e) {
  console.error("Database push failed:", e.message);
  process.exit(1);
}
