import assert from "node:assert/strict";
import {
  callControlApplicationPayload,
  credentialConnectionPayload,
  outboundVoiceProfilePayload,
} from "../lib/telnyx-voice-settings";

const connection = credentialConnectionPayload({
  webhook_event_url: "https://voice.example.com/api/webhooks/telecom",
  call_cost_in_webhooks: false,
  anchorsite_override: "Latency",
  inbound: {
    ani_number_format: "+E.164",
    dnis_number_format: "invalid",
    codecs: ["opus", "PCMU", "malicious-codec"],
    channel_limit: 12,
  },
  outbound: { ani_override: "+12025550123", ani_override_type: "always", localization: "fr" },
  rtcp_settings: { port: "rtcp-mux", capture_enabled: true, report_frequency_secs: 10 },
  jitter_buffer: { enable_jitter_buffer: true, jitterbuffer_msec_min: 60, jitterbuffer_msec_max: 200 },
});
assert.equal(connection.call_cost_in_webhooks, true);
assert.deepEqual((connection.inbound as any).codecs, ["OPUS", "PCMU"]);
assert.equal((connection.inbound as any).ani_number_format, "+e164");
assert.equal((connection.inbound as any).dnis_number_format, undefined);
assert.equal((connection.outbound as any).localization, "FR");
assert.equal((connection.outbound as any).ani_override, "+12025550123");
assert.equal((connection.outbound as any).ani_override_type, "always");

const callControl = callControlApplicationPayload({
  application_name: "Production router",
  webhook_event_url: "https://voice.example.com/api/webhooks/telecom",
  inbound: { channel_limit: 20, shaken_stir_enabled: true, injected: "blocked" },
  outbound: { channel_limit: 10, outbound_voice_profile_id: "ovp-1", injected: "blocked" },
});
assert.equal(callControl.call_cost_in_webhooks, true);
assert.equal((callControl.inbound as any).injected, undefined);
assert.equal((callControl.outbound as any).injected, undefined);

const outbound = outboundVoiceProfilePayload({
  name: "Europe production",
  concurrent_call_limit: 25,
  whitelisted_destinations: ["fr", "BE", "bad"],
  max_destination_rate: 0.5,
  daily_spend_limit: 100,
  daily_spend_limit_enabled: true,
});
assert.deepEqual(outbound.whitelisted_destinations, ["FR", "BE"]);
assert.equal(outbound.daily_spend_limit, "100.00");

assert.throws(
  () => credentialConnectionPayload({ outbound: { ani_override: "always", ani_override_type: "always" } }),
  /ANI_OVERRIDE_E164_INVALID/,
);
assert.throws(
  () => credentialConnectionPayload({ webhook_event_url: "http://voice.example.com/webhook" }),
  /HTTPS_REQUIRED/,
);
assert.throws(
  () => credentialConnectionPayload({
    jitter_buffer: { enable_jitter_buffer: true, jitterbuffer_msec_min: 300, jitterbuffer_msec_max: 60 },
  }),
  /JITTER_BUFFER_RANGE_INVALID/,
);
assert.throws(
  () => outboundVoiceProfilePayload({ name: "x", max_destination_rate: 1, daily_spend_limit: 1 }),
  /PROFILE_NAME_REQUIRED/,
);

console.log("PASS  Telnyx Voice settings are validated and production-safe");
