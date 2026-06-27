const fs = require('fs');
const css = fs.readFileSync('app/globals.css', 'utf8').split('\n');
const endIdx = css.findIndex(line => line.includes('RESTORED VANILLA UTILITIES & TOKENS'));
if (endIdx > -1) {
   fs.writeFileSync('app/globals.css', css.slice(0, endIdx - 1).join('\n'));
   console.log('Cleaned globals.css. Removed ' + (css.length - endIdx) + ' lines of legacy code.');
} else {
   console.log('Already cleaned or string not found.');
}
