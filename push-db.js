const { execSync } = require('child_process');

let url = process.env.DATABASE_URL || "";
if (url) {
  // Sanitize URL for prisma db push (remove pgbouncer which causes search_path errors on direct push)
  url = url.replace("&pgbouncer=true", "").replace("?pgbouncer=true", "");
  url = url.replace("&schema=public", "").replace("?schema=public", "");
  
  const separator = url.includes("?") ? "&" : "?";
  if (!url.includes("connection_limit=")) {
    url += `${separator}connection_limit=1`;
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
