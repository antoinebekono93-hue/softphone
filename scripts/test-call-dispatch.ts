import assert from "node:assert/strict";
import { dispatchCallRoute } from "../lib/call-dispatch";

async function main() {
  const calls: string[] = [];
  const handlers = {
    app: async (destination: string) => { calls.push(`APP:${destination}`); },
    pstn: async (destination: string) => { calls.push(`PSTN:${destination}`); },
  };
  await dispatchCallRoute({ type: "APP_TO_APP", destination: "+237600000002" }, handlers);
  assert.deepEqual(calls, ["APP:+237600000002"]);
  console.log("PASS internal route never invokes PSTN handler");
  calls.length = 0;
  await dispatchCallRoute({ type: "APP_TO_PSTN", destination: "+33123456789" }, handlers);
  assert.deepEqual(calls, ["PSTN:+33123456789"]);
  console.log("PASS external route invokes only PSTN handler");
  for (const reason of ["CALLEE_BUSY", "OFFLINE", "REALTIME_UNAVAILABLE"]) {
    calls.length = 0;
    await assert.rejects(dispatchCallRoute({ type: "APP_TO_APP", destination: "+237600000002" }, {
      ...handlers,
      app: async () => { throw new Error(reason); },
    }), new RegExp(reason));
    assert.deepEqual(calls, []);
    console.log(`PASS ${reason}: no paid fallback`);
  }
  for (const route of [null, {}, { type: "UNKNOWN", destination: "+237600000002" }, { type: "APP_TO_PSTN", destination: " " }]) {
    calls.length = 0;
    await assert.rejects(dispatchCallRoute(route, handlers), /INVALID_CALL_ROUTE/);
    assert.deepEqual(calls, []);
  }
  console.log("PASS invalid decisions cannot launch a call");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
