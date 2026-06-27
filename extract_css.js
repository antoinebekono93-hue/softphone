const fs = require('fs');

const logPath = 'C:\\Users\\Antoine\\.gemini\\antigravity\\brain\\36d26c72-f82a-4280-94c8-55573e2cef67\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (let line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (let call of data.tool_calls) {
        let argsStr = call.args || call.arguments || (call.function && call.function.arguments);
        if (typeof argsStr === 'string') {
           const args = JSON.parse(argsStr);
           if (args.TargetFile && args.TargetFile.endsWith('globals.css') && args.CodeContent) {
             fs.writeFileSync('old_globals.css', args.CodeContent);
             console.log("SUCCESS");
             process.exit(0);
           }
        } else if (typeof argsStr === 'object') {
           const args = argsStr;
           if (args.TargetFile && args.TargetFile.endsWith('globals.css') && args.CodeContent) {
             fs.writeFileSync('old_globals.css', args.CodeContent);
             console.log("SUCCESS");
             process.exit(0);
           }
        }
      }
    }
  } catch (e) {}
}
console.log("FAIL");
