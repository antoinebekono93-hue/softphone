const fs = require('fs');
const path = require('path');

const rootDir = 'app/dashboard';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Simple structural replacements
      let original = content;
      content = content.replace(/bg-\[var\(--apple-bg-secondary\)\] border border-\[var\(--apple-border\)\]/g, 'glass-panel border-none');
      content = content.replace(/apple-surface border border-\[var\(--apple-border\)\]/g, 'glass-panel');
      content = content.replace(/apple-surface/g, 'glass-panel');
      content = content.replace(/apple-btn/g, 'btn-primary-gradient');
      content = content.replace(/bg-\[var\(--apple-accent\)\] text-\[var\(--text-primary\)\] rounded-full/g, 'btn-primary-gradient');
      content = content.replace(/text-\[var\(--apple-text-secondary\)\]/g, 'text-[var(--text-secondary)]');
      content = content.replace(/text-\[var\(--apple-text-primary\)\]/g, 'text-[var(--text-primary)]');
      content = content.replace(/var\(--apple-bg-primary\)/g, 'var(--bg-surface-solid)');
      content = content.replace(/var\(--apple-key-bg\)/g, 'var(--bg-surface-hover)');
      content = content.replace(/var\(--apple-key-hover\)/g, 'var(--bg-surface-hover)');
      content = content.replace(/var\(--apple-border\)/g, 'var(--border-subtle)');
      content = content.replace(/var\(--apple-accent\)/g, 'cyan-500');
      content = content.replace(/var\(--apple-success\)/g, 'emerald-500');
      
      if (content !== original) {
        console.log('Updated structural classes in', fullPath);
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDirectory(rootDir);
console.log('Done.');
