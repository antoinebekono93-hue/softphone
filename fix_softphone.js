const fs = require('fs');
const path = require('path');

const dir = 'components/softphone';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const fullPath = path.join(dir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  content = content.replace(/\btext-primary\b/g, 'text-[var(--apple-text-primary)]');
  content = content.replace(/\btext-secondary\b/g, 'text-[var(--apple-text-secondary)]');
  content = content.replace(/\bgray-400\b/g, '[var(--apple-text-secondary)]');
  
  fs.writeFileSync(fullPath, content);
  console.log('Fixed text colors in ' + file);
});
