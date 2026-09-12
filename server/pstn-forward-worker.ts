import { processDuePstnForwards } from "../lib/pstn-forwarding";
import { processDuePstnVoicemails } from "../lib/pstn-voicemail";

const intervalMs = Math.max(500, Number(process.env.PSTN_FORWARD_POLL_MS) || 1000);
let stopped = false;

async function run() {
  console.log(`[PSTN Forward Worker] started (poll=${intervalMs}ms)`);
  while (!stopped) {
    try {
      const [forwarding, voicemail] = await Promise.all([processDuePstnForwards(), processDuePstnVoicemails()]);
      if (forwarding.scanned || voicemail.scanned) console.log(`[PSTN Worker] forwarding=${forwarding.started}/${forwarding.scanned} voicemail=${voicemail.started}/${voicemail.scanned}`);
    } catch (error) {
      console.error("[PSTN Forward Worker] cycle failed", error);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

process.on("SIGINT", () => { stopped = true; });
process.on("SIGTERM", () => { stopped = true; });
void run();
