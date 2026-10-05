#!/usr/bin/env node
/**
 * BUSTER CALL — Branding Check Script
 * ====================================
 * Détecte les anciens brandings interdits dans les zones UI publiques.
 * 
 * Usage: node scripts/check-branding.js
 * 
 * Exit code 0 = OK
 * Exit code 1 = Forbidden brand terms found in public UI
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ============================================================
// FORBIDDEN BRAND TERMS (in public/user-facing UI)
// ============================================================
const FORBIDDEN_TERMS = [
  'Softphone Xi',
  'Softphone-Xi',
  'softphone-xi',
  // "Antigravity" as brand (not as a science concept)
  'Antigravity',
];

// Telnyx is forbidden only when used as a visible brand in marketing/UI
// (not in technical contexts)
const FORBIDDEN_TELNYX_CONTEXTS = [
  />\s*Telnyx\s*</,          // JSX text node: >Telnyx<
  /"Telnyx Voice"/,          // String literal "Telnyx Voice"
  /'Telnyx Voice'/,          // String literal 'Telnyx Voice'
  /"Telnyx WebRTC"/,         // String literal "Telnyx WebRTC"
  /'Telnyx WebRTC'/,         // String literal 'Telnyx WebRTC'
  /Telnyx Mission Control/,  // UI title
];

// ============================================================
// FILES/DIRS TO CHECK (user-facing zones)
// ============================================================
const PUBLIC_DIRS = [
  'app/page.tsx',
  'app/about',
  'app/pricing',
  'app/terms',
  'app/privacy',
  'app/refund-policy',
  'app/acceptable-use',
  'app/contact',
  'app/onboarding',
  'app/register',
  'app/login',
  'app/integrations',
  'app/secteurs',
  'app/ia',
  'app/receptionniste-ia',
  'app/etudes-de-cas',
  'components/landing',
  'components/marketing',
  'components/pwa',
  'components/dashboard/Sidebar.tsx',
  'components/dashboard/MobileBottomNav.tsx',
  'public/manifest.json',
  'app/layout.tsx',
  'lib/site-config.ts',
];

// ============================================================
// FILES/PATTERNS TO SKIP (technical zones)
// ============================================================
const SKIP_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  // Technical telnyx files — OK to have Telnyx
  /lib\/telnyx/,
  /app\/god-mode\/telnyx\/actions\.ts$/,  // Has technical+user mix, handled manually
  /app\/api\/telnyx/,
  /app\/api\/admin\/telnyx/,
];

const SKIP_LINE_PATTERNS = [
  /^\s*(\/\/|\/\*|\*)/,           // Comments
  /^\s*import\s/,                  // Import statements
  /TELNYX_[A-Z_]+/,               // Env var names
  /telnyx[A-Z]\w*/,               // camelCase telnyx vars (telnyxClient, etc.)
  /process\.env\./,               // Env var access
  /api\.telnyx\.com/,             // API URLs
  /console\.(log|error|warn)/,    // Dev logs
  /getConfiguredTelnyx|saveTelnyx|fetchTelnyx|ensureTelnyx/,
  /@telnyx\//,                    // Package references
  /from ['"]telnyx['"]/,          // SDK imports
  /\.vercel\.app/,                // Deployment fallback URLs (not user-visible brand)
  /vercel\.app["']/,              // Same
];

// ============================================================
// SCANNER
// ============================================================

let violations = [];
let filesChecked = 0;

function shouldSkipLine(line) {
  return SKIP_LINE_PATTERNS.some(p => p.test(line));
}

function checkFile(filePath) {
  const relPath = path.relative(ROOT, filePath);
  
  if (SKIP_PATTERNS.some(p => p.test(filePath))) return;
  if (!filePath.match(/\.(tsx?|jsx?|json|md|html)$/)) return;
  
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return;
  }
  
  filesChecked++;
  const lines = content.split('\n');
  
  lines.forEach((line, i) => {
    if (shouldSkipLine(line)) return;
    
    // Check forbidden terms
    for (const term of FORBIDDEN_TERMS) {
      if (line.includes(term)) {
        violations.push({
          file: relPath,
          line: i + 1,
          text: line.trim().slice(0, 120),
          term,
          category: 'FORBIDDEN_BRAND',
        });
      }
    }
    
    // Check forbidden Telnyx contexts in UI
    for (const pattern of FORBIDDEN_TELNYX_CONTEXTS) {
      if (pattern.test(line)) {
        violations.push({
          file: relPath,
          line: i + 1,
          text: line.trim().slice(0, 120),
          term: 'Telnyx (visible brand)',
          category: 'FORBIDDEN_TELNYX_BRAND',
        });
      }
    }
  });
}

function scanDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const stat = fs.statSync(dirPath);
  if (stat.isFile()) {
    checkFile(dirPath);
    return;
  }
  
  if (!stat.isDirectory()) return;
  
  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    if (SKIP_PATTERNS.some(p => p.test(fullPath))) continue;
    
    const entryStat = fs.statSync(fullPath);
    if (entryStat.isDirectory()) {
      scanDir(fullPath);
    } else {
      checkFile(fullPath);
    }
  }
}

// ============================================================
// MAIN
// ============================================================

console.log('\n🔍 BUSTER CALL — Branding Check');
console.log('================================\n');

for (const publicPath of PUBLIC_DIRS) {
  const fullPath = path.join(ROOT, publicPath);
  scanDir(fullPath);
}

console.log(`Files checked: ${filesChecked}`);
console.log(`Violations found: ${violations.length}\n`);

if (violations.length === 0) {
  console.log('✅ PASS — No forbidden brand terms found in public UI zones.');
  console.log('\nPUBLIC_ANTIGRAVITY_OCCURRENCES = 0');
  console.log('PUBLIC_SOFTPHONE_BRAND_OCCURRENCES = 0');
  console.log('PUBLIC_TELNYX_BRAND_OCCURRENCES = 0');
  console.log('BUSTER_CALL_BRANDING = READY');
  process.exit(0);
} else {
  console.log('❌ FAIL — Forbidden brand terms detected:\n');
  
  const byFile = {};
  for (const v of violations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }
  
  for (const [file, vs] of Object.entries(byFile)) {
    console.log(`  📄 ${file}`);
    for (const v of vs) {
      console.log(`    Line ${v.line} [${v.category}] "${v.term}"`);
      console.log(`    → ${v.text}`);
    }
    console.log('');
  }
  
  const antigravityCount = violations.filter(v => v.term === 'Antigravity').length;
  const softphoneCount = violations.filter(v => v.term.includes('Softphone')).length;
  const telnyxCount = violations.filter(v => v.category === 'FORBIDDEN_TELNYX_BRAND').length;
  
  console.log(`PUBLIC_ANTIGRAVITY_OCCURRENCES = ${antigravityCount}`);
  console.log(`PUBLIC_SOFTPHONE_BRAND_OCCURRENCES = ${softphoneCount}`);
  console.log(`PUBLIC_TELNYX_BRAND_OCCURRENCES = ${telnyxCount}`);
  console.log('BUSTER_CALL_BRANDING = NEEDS_WORK');
  
  process.exit(1);
}
