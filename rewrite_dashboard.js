const fs = require('fs');
const path = require('path');

const files = [
  'app/dashboard/page.tsx',
  'app/dashboard/calls/page.tsx',
  'app/dashboard/numbers/page.tsx',
  'app/dashboard/settings/page.tsx',
  'app/dashboard/billing/page.tsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replacements
  content = content.replace(/\bglass\b/g, 'apple-surface');
  content = content.replace(/\bglass-heavy\b/g, 'apple-surface');
  content = content.replace(/\btext-white\b/g, 'text-[var(--apple-text-primary)]');
  content = content.replace(/\btext-gray-[345]00\b/g, 'text-[var(--apple-text-secondary)]');
  content = content.replace(/\bborder-white\/[0-9]+\b/g, 'border-[var(--apple-border)]');
  content = content.replace(/\bbg-white\/5\b/g, 'bg-[var(--apple-key-bg)]');
  content = content.replace(/\bhover:bg-white\/[0-9]+\b/g, 'hover:bg-[var(--apple-key-hover)]');
  content = content.replace(/\bdivide-white\/[0-9]+\b/g, 'divide-[var(--apple-border)]');
  content = content.replace(/\bbg-\[#050508\]\b/g, 'bg-[var(--apple-bg-primary)]');
  content = content.replace(/\bbg-\[#0a0a0f\]\b/g, 'bg-[var(--apple-bg-secondary)]');
  content = content.replace(/\btext-cyan-400\b/g, 'text-[var(--apple-accent)]');
  content = content.replace(/\bbg-cyan-500\/[0-9]+\b/g, 'bg-[var(--apple-accent)]/10');
  
  // Remove glow effects
  content = content.replace(/<div className="absolute[^>]*blur-\[30px\][^>]*>\s*<\/div>/g, '');
  
  fs.writeFileSync(fullPath, content);
  console.log('Updated ' + file);
});
