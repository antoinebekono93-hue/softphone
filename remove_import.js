const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf8');
css = css.replace(/@import url[^;]+;/g, '/* @import removed */');
fs.writeFileSync('app/globals.css', css);
console.log("Removed @import from CSS.");
