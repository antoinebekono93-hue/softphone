const fs = require('fs');
const path = require('path');

const rootDir = 'app/god-mode';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let original = content;
      content = content.replace(/bg-\[#0a0a0a\] border border-white\/10/g, 'glass-panel border-none');
      content = content.replace(/bg-\[#0a0a0a\] border border-white\/5/g, 'glass-panel border-none');
      content = content.replace(/bg-\[#0a0a0a\]/g, 'glass-panel');
      content = content.replace(/text-white\/50/g, 'text-[var(--text-secondary)]');
      content = content.replace(/text-white\/40/g, 'text-[var(--text-secondary)]');
      content = content.replace(/text-white\/60/g, 'text-[var(--text-secondary)]');
      content = content.replace(/text-white/g, 'text-[var(--text-primary)]');
      content = content.replace(/border-white\/10/g, 'border-[var(--border-subtle)]');
      content = content.replace(/border-white\/5/g, 'border-[var(--border-subtle)]');
      content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-[var(--bg-surface-hover)]');
      content = content.replace(/bg-white\/5/g, 'bg-[var(--bg-surface-hover)]');
      content = content.replace(/bg-white\/10/g, 'bg-[var(--bg-surface-hover)]');
      
      // Button conversions if any exist
      content = content.replace(/bg-red-600 hover:bg-red-700/g, 'btn-primary-gradient');
      content = content.replace(/bg-red-500 hover:bg-red-600/g, 'btn-primary-gradient');
      
      if (content !== original) {
        console.log('Updated god-mode classes in', fullPath);
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDirectory(rootDir);
console.log('Done.');
