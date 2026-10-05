const ts = require("typescript");
const fs = require("node:fs");
const files = [
"app/dashboard/inbox/InboxClient.tsx","app/dashboard/inbox/page.tsx","app/dashboard/layout.tsx",
"app/layout.tsx","app/~offline/page.tsx","components/layout/MobileBottomNav.tsx","components/ui/modal.tsx",
"hooks/useCallHistory.ts","hooks/useMobileDetail.ts","hooks/useOnline.ts","lib/offline-store.ts",
"components/providers/CommunicationProvider.tsx","components/pwa/PrivateStorageBoundary.tsx",
"next.config.ts","worker/index.ts","scripts/test-mobile-experience.ts"
];
let errors = 0;
for (const file of files) {
 const result = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  fileName: file, reportDiagnostics: true,
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext }
 });
 for (const d of result.diagnostics || []) {
  if (d.category === ts.DiagnosticCategory.Error) { errors++; console.error(file, ts.flattenDiagnosticMessageText(d.messageText, "\n")); }
 }
}
console.log(files.length + " changed modules parsed; syntax errors: " + errors);
process.exitCode = errors ? 1 : 0;
