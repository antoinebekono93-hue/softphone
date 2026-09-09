import { processDuePstnForwards } from "../lib/pstn-forwarding";

const intervalMs = Math.max(500, Number(process.env.PSTN_FORWARD_POLL_MS) || 1000);
let stopped = false;

async function run() {
  console.log(`[PSTN Forward Worker] started (poll=${intervalMs}ms)`);
  while (!stopped) {
    try {
      const result = await processDuePstnForwards();
      if (result.scanned) console.log(`[PSTN Forward Worker] scanned=${result.scanned} started=${result.started}`);
    } catch (error) {
      console.error("[PSTN Forward Worker] cycle failed", error);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

process.on("SIGINT", () => { stopped = true; });
process.on("SIGTERM", () => { stopped = true; });
void run();
