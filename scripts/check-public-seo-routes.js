#!/usr/bin/env node
/**
 * BUSTER CALL — Public SEO route regression check
 * =================================================
 * The auth proxy used to redirect /sitemap.xml and /robots.txt to /login,
 * which silently broke indexing in production. This script is the guard.
 *
 * Usage:
 *   node scripts/check-public-seo-routes.js
 *   SEO_BASE_URL=https://softphone-xi.vercel.app node scripts/check-public-seo-routes.js
 *
 * Always runs the static check (proxy allowlist + no localhost in SEO config).
 * When SEO_BASE_URL (or --url) is provided, also performs live HTTP checks.
 *
 * Exit code 0 = PASS, 1 = FAIL
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// Routes that must never sit behind the auth guard.
const REQUIRED_PUBLIC_PATHS = ["/sitemap.xml", "/robots.txt", "/manifest.json"];

const failures = [];
const notes = [];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

// ---------------------------------------------------------------
// 1. Static: each SEO route must be reachable without a token
// ---------------------------------------------------------------
const proxy = read("proxy.ts");
const publicPathsBlock = (proxy.match(/const publicPaths\s*=\s*\[([\s\S]*?)\];/) || [])[1] || "";
// The guard also has an inline bypass chain further down the file.
const bypassBlock = (proxy.match(/isPublicPath\(pathname\)\s*\|\|([\s\S]*?)\)\s*\{/) || [])[1] || "";

function isListedIn(block, route) {
  return block.includes(`"${route}"`) || block.includes(`'${route}'`);
}

for (const route of REQUIRED_PUBLIC_PATHS) {
  const inPublicPaths = isListedIn(publicPathsBlock, route);
  const inBypass = isListedIn(bypassBlock, route);

  if (inPublicPaths) {
    notes.push(`${route} is listed in proxy publicPaths`);
  } else if (inBypass) {
    notes.push(`${route} is allowed by the proxy bypass chain`);
  } else {
    failures.push(
      `proxy.ts does not expose "${route}" — crawlers would be redirected to /login`
    );
  }
}

// sitemap.xml and robots.txt are the two that must be explicit in publicPaths,
// because a regression there is what broke indexing in the first place.
for (const route of ["/sitemap.xml", "/robots.txt"]) {
  if (!isListedIn(publicPathsBlock, route)) {
    failures.push(`proxy.ts publicPaths must explicitly contain "${route}"`);
  }
}

// ---------------------------------------------------------------
// 2. Static: no localhost may leak into public SEO surfaces
// ---------------------------------------------------------------
const SEO_FILES = [
  "app/layout.tsx",
  "app/sitemap.ts",
  "app/robots.ts",
  "lib/site-config.ts",
];

for (const rel of SEO_FILES) {
  if (!fs.existsSync(path.join(ROOT, rel))) continue;
  const content = read(rel);
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*)/.test(line)) return;
    // Only flag localhost when used as an actual URL origin fallback.
    if (/["'`]https?:\/\/(www\.)?localhost(:\d+)?\/?["'`]/.test(line)) {
      failures.push(`${rel}:${i + 1} exposes a localhost origin: ${line.trim()}`);
    }
  });
}

// ---------------------------------------------------------------
// 3. Static: canonical origin must be a real https origin
// ---------------------------------------------------------------
const siteConfig = read("lib/site-config.ts");
const originMatch = siteConfig.match(/const PUBLIC_ORIGIN\s*=([\s\S]*?);\s*$/m);
if (!originMatch) {
  failures.push("lib/site-config.ts: could not locate PUBLIC_ORIGIN");
} else if (!/https:\/\//.test(originMatch[1])) {
  failures.push("PUBLIC_ORIGIN has no https:// fallback — canonicals could break");
} else {
  notes.push("PUBLIC_ORIGIN has an https fallback");
}

// ---------------------------------------------------------------
// 4. Optional live HTTP check
// ---------------------------------------------------------------
function argUrl() {
  const idx = process.argv.indexOf("--url");
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return process.env.SEO_BASE_URL || "";
}

async function liveCheck() {
  const base = argUrl().replace(/\/$/, "");
  if (!base) {
    notes.push("live check skipped (no --url / SEO_BASE_URL provided)");
    return;
  }

  const expectations = [
    { route: "/sitemap.xml", type: "xml" },
    { route: "/robots.txt", type: "text" },
  ];

  for (const { route, type } of expectations) {
    const url = `${base}${route}`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status !== 200) {
        failures.push(`${url} returned HTTP ${res.status} (expected 200, no redirect)`);
        continue;
      }
      if (type === "xml" && !(res.headers.get("content-type") || "").includes("xml")) {
        failures.push(`${url} content-type is not xml: ${res.headers.get("content-type")}`);
        continue;
      }
      const body = await res.text();
      if (type === "xml" && !body.includes("<loc>")) {
        failures.push(`${url} returned no <loc> entries`);
        continue;
      }
      if (type === "text" && !/^User-Agent:/im.test(body)) {
        failures.push(`${url} does not look like a robots.txt`);
        continue;
      }
      notes.push(`${url} -> 200, content-type ok`);
    } catch (err) {
      failures.push(`${url} request failed: ${err.message}`);
    }
  }
}

(async () => {
  console.log("\n🔍 BUSTER CALL — Public SEO route check");
  console.log("=======================================\n");

  await liveCheck();

  console.log("Checks performed:");
  for (const note of notes) console.log(`  ✓ ${note}`);

  if (failures.length === 0) {
    console.log("\n✅ PASS — SEO routes stay public and no localhost origin is exposed.");
    console.log("\nSEO_SITEMAP_PUBLIC = PASS");
    console.log("SEO_ROBOTS_PUBLIC = PASS");
    console.log("SEO_CANONICAL_ORIGIN = REAL_HTTPS");
    process.exit(0);
  } else {
    console.log("\n❌ FAIL — SEO regression detected:\n");
    for (const failure of failures) console.log(`  ✗ ${failure}`);
    console.log("\nSEO_ROUTES_REGRESSION = FAIL");
    process.exit(1);
  }
})();