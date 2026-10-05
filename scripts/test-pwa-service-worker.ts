/* Regression checks for the PWA / offline configuration.
   Run with: npm run test:pwa
   These are static contract assertions — no browser or network required. */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
let failed = 0;
let passed = 0;

function check(label: string, condition: boolean) {
  if (condition) { passed++; return; }
  failed++;
  console.error(`  FAIL ${label}`);
}

function read(relative: string) {
  return readFileSync(resolve(root, relative), "utf8");
}

console.log("\nPWA / offline configuration\n");

const nextConfig = read("next.config.ts");
const sw = read("worker/index.ts");
const dashboardLayout = read("app/dashboard/layout.tsx");
const rootLayout = read("app/layout.tsx");
const messagesLayout = read("app/dashboard/messages/layout.tsx");
const onlineHook = read("hooks/useOnline.ts");

console.log("  next.config.ts");
check("reloadOnOnline is disabled", /reloadOnOnline:\s*false/.test(nextConfig));
check("skipWaiting is disabled", /skipWaiting:\s*false/.test(nextConfig));
check("clientsClaim is disabled", /clientsClaim:\s*false/.test(nextConfig));
check("cacheStartUrl is disabled", /cacheStartUrl:\s*false/.test(nextConfig));
check("cacheOnFrontEndNav is disabled", /cacheOnFrontEndNav:\s*false/.test(nextConfig));
check("aggressive front-end nav caching is off", /aggressiveFrontEndNavCaching:\s*false/.test(nextConfig));
check("custom worker source is the audited worker", /customWorkerSrc:\s*["'`]worker["'`]/.test(nextConfig));
check("outdated precaches are cleaned up", /cleanupOutdatedCaches:\s*true/.test(nextConfig));
check("navigation fallback points at /~offline", /fallbacks:\s*\{[^}]*document:\s*["'`]\/~offline["'`]/.test(nextConfig));

console.log("  worker/index.ts");
check("does not skipWaiting on install", !/skipWaiting\s*\(/.test(sw) && !/skipWaiting:\s*true/.test(sw));
check("does not claim uncontrolled clients", !/clientsClaim\s*\(/.test(sw));
check("purges legacy caches", /cacheName|caches\.delete|legacy|Legacy/.test(sw));
check("validates notification target before opening", /url|origin/.test(sw));
check("never opens a cache for authenticated API traffic",
  !/cache\.match\(\s*request[\s\S]{0,120}?\/api\//.test(sw));

console.log("  provider placement");
const communicationProvider = read("components/providers/CommunicationProvider.tsx");
const telephonyProviders = ["TelnyxProvider", "AppCallProvider", "GlobalAppIncomingCall", "GlobalIncomingCall"];
check("the dashboard shell mounts CommunicationProvider", dashboardLayout.includes("CommunicationProvider"));
for (const provider of telephonyProviders) {
  check(`${provider} is mounted once, in CommunicationProvider`, communicationProvider.includes(provider));
  check(`${provider} is absent from the public layout`, !rootLayout.includes(provider));
}
check("no telephony provider is mounted in the public layout",
  !/TelnyxProvider|AppCallProvider|GlobalIncomingCall|GlobalAppIncomingCall/.test(rootLayout));

console.log("  offline behaviour");
check("useOnline never triggers a page reload", !/location\.reload|window\.location\.reload/.test(onlineHook));
check("useOnline exposes an online flag", /onLine/.test(onlineHook));
check("the legacy messages layout no longer hardcodes 100vh",
  !messagesLayout.includes("100vh") && !messagesLayout.includes("h-screen"));

console.log("  manifest");
const manifestPath = resolve(root, "public/manifest.json");
check("public/manifest.json exists", existsSync(manifestPath));
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(read("public/manifest.json"));
  check("name is Buster Call", manifest.name === "Buster Call");
  check("short_name is 12 characters or fewer",
    typeof manifest.short_name === "string" && [...manifest.short_name].length <= 12);
  check("start_url targets the inbox", manifest.start_url === "/dashboard/inbox");
  check("display is standalone", manifest.display === "standalone");
  check("theme_color and background_color are set",
    typeof manifest.theme_color === "string" && typeof manifest.background_color === "string");
  check("192px icon is declared", manifest.icons?.some((i: { sizes: string }) => i.sizes === "192x192"));
  check("512px icon is declared", manifest.icons?.some((i: { sizes: string }) => i.sizes === "512x512"));
  check("no screenshot entry is faked", !("screenshots" in manifest));
  const missingIcons = (manifest.icons ?? [])
    .map((i: { src: string }) => i.src)
    .filter((src: string) => !existsSync(resolve(root, "public", src.replace(/^\//, ""))));
  check(`every declared icon file exists${missingIcons.length ? ` (missing: ${missingIcons.join(", ")})` : ""}`,
    missingIcons.length === 0);
}

console.log(`\nPWA configuration: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);