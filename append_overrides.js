const fs = require('fs');
const override = `
/* =========================================
   APPLE FINAL OVERRIDES
   ========================================= */
.glass {
  background-color: var(--apple-bg-secondary) !important;
  border: 1px solid var(--apple-border) !important;
  box-shadow: var(--apple-shadow-soft) !important;
}
.btn-primary {
  background: var(--apple-accent) !important;
  color: var(--apple-accent-text) !important;
  border-radius: 98px !important;
  box-shadow: none !important;
}
`;
fs.appendFileSync('app/globals.css', override);
console.log("Overrides appended!");
