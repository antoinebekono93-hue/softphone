const fs = require('fs');

let oldCss = fs.readFileSync('old_globals.css', 'utf8');

// Remove the body block so it doesn't overwrite Apple's body
oldCss = oldCss.replace(/body\s*{[^}]+}/g, '/* old body removed */');

// Remove the html block just in case
oldCss = oldCss.replace(/html\s*{[^}]+}/g, '/* old html removed */');

const finalCss = '\n/* =========================================\n   RESTORED VANILLA UTILITIES & TOKENS\n   ========================================= */\n' + oldCss;

fs.appendFileSync('app/globals.css', finalCss);
console.log("Merge completed!");
