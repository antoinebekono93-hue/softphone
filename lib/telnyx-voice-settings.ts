const ANCHOR_SITES = new Set([
  "Latency", "Chicago, IL", "Ashburn, VA", "San Jose, CA", "Sydney, Australia",
  "Amsterdam, Netherlands", "London, UK", "Toronto, Canada", "Vancouver, Canada",
  "Frankfurt, Germany", "Chennai, IN",
]);
const DTMF_TYPES = new Set(["RFC 2833", "Inband", "SIP INFO"]);
const SIP_URI_PREFERENCES = new Set(["disabled", "internal", "unrestricted"]);
const NOISE_SUPPRESSION = new Set(["disabled", "inbound", "outbound", "both"]);
const ANI_OVERRIDE = new Set(["normal", "always", "never"]);
const NUMBER_FORMATS = new Set(["+e164", "e164", "national", "sip_username"]);

function optionalBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function optionalString(value: unknown, max = 255) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}

function nullablePositiveInteger(value: unknown, max = 100000) {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : undefined;
}

function enumValue(value: unknown, allowed: Set<string>) {
  return typeof value === "string" && allowed.has(value) ? value : undefined;
}

function numberFormat(value: unknown) {
  if (typeof value !== "string") return undefined;
  // Telnyx response examples also use "+E.164" while the accepted-value
  // validation names the same format "+e164".
  const normalized = value.trim().toLowerCase().replace("e.164", "e164");
  return NUMBER_FORMATS.has(normalized) ? normalized : undefined;
}

function callControlInbound(value: any) {
  if (!value || typeof value !== "object") return undefined;
  return Object.fromEntries(Object.entries({
    channel_limit: nullablePositiveInteger(value.channel_limit),
    shaken_stir_enabled: optionalBoolean(value.shaken_stir_enabled),
    sip_subdomain: optionalString(value.sip_subdomain, 255),
    sip_subdomain_receive_settings: enumValue(value.sip_subdomain_receive_settings, new Set(["only_my_connections", "from_anyone"])),
  }).filter(([, item]) => item !== undefined));
}

function callControlOutbound(value: any) {
  if (!value || typeof value !== "object") return undefined;
  return Object.fromEntries(Object.entries({
    channel_limit: nullablePositiveInteger(value.channel_limit),
    outbound_voice_profile_id: value.outbound_voice_profile_id === null ? null : optionalString(value.outbound_voice_profile_id, 64),
  }).filter(([, item]) => item !== undefined));
}

function rtcpSettings(value: any) {
  if (!value || typeof value !== "object") return undefined;
  const frequency = nullablePositiveInteger(value.report_frequency_secs, 60);
  return Object.fromEntries(Object.entries({
    port: enumValue(value.port, new Set(["rtcp-mux", "rtp+1"])),
    capture_enabled: optionalBoolean(value.capture_enabled),
    report_frequency_secs: frequency,
  }).filter(([, item]) => item !== undefined));
}

function jitterBuffer(value: any) {
  if (!value || typeof value !== "object") return undefined;
  const min = nullablePositiveInteger(value.jitterbuffer_msec_min, 2000);
  const max = nullablePositiveInteger(value.jitterbuffer_msec_max, 2000);
  if (typeof min === "number" && typeof max === "number" && min > max) {
    throw new Error("JITTER_BUFFER_RANGE_INVALID");
  }
  return Object.fromEntries(Object.entries({
    enable_jitter_buffer: optionalBoolean(value.enable_jitter_buffer),
    jitterbuffer_msec_min: min,
    jitterbuffer_msec_max: max,
  }).filter(([, item]) => item !== undefined));
}

function stringArray(value: unknown, pattern?: RegExp) {
  const input = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return [...new Set(input.map(String).map((item) => item.trim()).filter((item) => item && (!pattern || pattern.test(item))))];
}

function optionalE164(value: unknown) {
  if (value === null || value === "") return null;
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^\+[1-9]\d{6,14}$/.test(value.trim())) {
    throw new Error("ANI_OVERRIDE_E164_INVALID");
  }
  return value.trim();
}

export function requiredHttpsUrl(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field}_REQUIRED`);
  const url = new URL(value.trim());
  if (url.protocol !== "https:") throw new Error(`${field}_HTTPS_REQUIRED`);
  return url.toString();
}

export function optionalHttpsUrl(value: unknown, field: string): string | null | undefined {
  if (value === null || value === "") return null;
  if (value === undefined) return undefined;
  return requiredHttpsUrl(value, field);
}

export function credentialConnectionPayload(body: any, create = false) {
  const inbound = body?.inbound && typeof body.inbound === "object" ? {
    ani_number_format: numberFormat(body.inbound.ani_number_format),
    dnis_number_format: numberFormat(body.inbound.dnis_number_format),
    codecs: stringArray(body.inbound.codecs, /^(OPUS|G722|PCMU|PCMA|G729|VP8|H264)$/i).map((item) => item.toUpperCase()),
    default_routing_method: enumValue(body.inbound.default_routing_method, new Set(["sequential", "round-robin"])),
    channel_limit: nullablePositiveInteger(body.inbound.channel_limit),
    generate_ringback_tone: optionalBoolean(body.inbound.generate_ringback_tone),
    isup_headers_enabled: optionalBoolean(body.inbound.isup_headers_enabled),
    prack_enabled: optionalBoolean(body.inbound.prack_enabled),
    sip_compact_headers_enabled: optionalBoolean(body.inbound.sip_compact_headers_enabled),
    timeout_1xx_secs: nullablePositiveInteger(body.inbound.timeout_1xx_secs, 600),
    timeout_2xx_secs: nullablePositiveInteger(body.inbound.timeout_2xx_secs, 600),
    shaken_stir_enabled: optionalBoolean(body.inbound.shaken_stir_enabled),
    simultaneous_ringing: enumValue(body.inbound.simultaneous_ringing, new Set(["enabled", "disabled"])),
  } : undefined;
  const outbound = body?.outbound && typeof body.outbound === "object" ? {
    call_parking_enabled: optionalBoolean(body.outbound.call_parking_enabled),
    // Telnyx exposes two distinct properties: the E.164 number and the policy.
    // Sending the policy in ani_override makes outbound configuration invalid.
    ani_override: optionalE164(body.outbound.ani_override),
    ani_override_type: enumValue(body.outbound.ani_override_type, ANI_OVERRIDE),
    channel_limit: nullablePositiveInteger(body.outbound.channel_limit),
    instant_ringback_enabled: optionalBoolean(body.outbound.instant_ringback_enabled),
    generate_ringback_tone: optionalBoolean(body.outbound.generate_ringback_tone),
    localization: optionalString(body.outbound.localization, 2)?.toUpperCase(),
    t38_reinvite_source: enumValue(body.outbound.t38_reinvite_source, new Set(["customer", "telnyx"])),
    outbound_voice_profile_id: body.outbound.outbound_voice_profile_id || null,
  } : undefined;
  const payload: Record<string, unknown> = {
    connection_name: optionalString(body?.connection_name, 128),
    active: optionalBoolean(body?.active),
    conversation_persistence: optionalBoolean(body?.conversation_persistence),
    anchorsite_override: enumValue(body?.anchorsite_override, ANCHOR_SITES),
    sip_uri_calling_preference: enumValue(body?.sip_uri_calling_preference, SIP_URI_PREFERENCES),
    default_on_hold_comfort_noise_enabled: optionalBoolean(body?.default_on_hold_comfort_noise_enabled),
    dtmf_type: enumValue(body?.dtmf_type, DTMF_TYPES),
    encode_contact_header_enabled: optionalBoolean(body?.encode_contact_header_enabled),
    encrypted_media: body?.encrypted_media === null ? null : enumValue(body?.encrypted_media, new Set(["SRTP"])),
    onnet_t38_passthrough_enabled: optionalBoolean(body?.onnet_t38_passthrough_enabled),
    ios_push_credential_id: body?.ios_push_credential_id === undefined ? undefined : body.ios_push_credential_id || null,
    android_push_credential_id: body?.android_push_credential_id === undefined ? undefined : body.android_push_credential_id || null,
    webhook_event_url: body?.webhook_event_url === undefined ? undefined : requiredHttpsUrl(body.webhook_event_url, "WEBHOOK_EVENT_URL"),
    webhook_event_failover_url: optionalHttpsUrl(body?.webhook_event_failover_url, "WEBHOOK_FAILOVER_URL"),
    webhook_api_version: enumValue(body?.webhook_api_version, new Set(["1", "2"])),
    webhook_timeout_secs: body?.webhook_timeout_secs === undefined ? undefined : Math.max(0, Math.min(30, Math.floor(Number(body.webhook_timeout_secs)))),
    call_cost_in_webhooks: true,
    tags: body?.tags === undefined ? undefined : stringArray(body.tags).slice(0, 100),
    noise_suppression: enumValue(body?.noise_suppression, NOISE_SUPPRESSION),
    noise_suppression_details: body?.noise_suppression_details && typeof body.noise_suppression_details === "object" ? {
      engine: enumValue(body.noise_suppression_details.engine, new Set(["deep_filter_net"])),
      attenuation_limit: Math.max(0, Math.min(100, Number(body.noise_suppression_details.attenuation_limit) || 0)),
    } : undefined,
    rtcp_settings: rtcpSettings(body?.rtcp_settings),
    jitter_buffer: jitterBuffer(body?.jitter_buffer),
    inbound,
    outbound,
  };
  if (create) {
    payload.user_name = optionalString(body?.user_name, 32);
    payload.password = optionalString(body?.password, 128);
    if (!payload.connection_name || !payload.user_name || !payload.password) {
      throw new Error("CONNECTION_NAME_USERNAME_PASSWORD_REQUIRED");
    }
  }
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

export function callControlApplicationPayload(body: any) {
  const applicationName = optionalString(body?.application_name, 128);
  if (!applicationName) throw new Error("APPLICATION_NAME_REQUIRED");
  return Object.fromEntries(Object.entries({
    application_name: applicationName,
    webhook_event_url: requiredHttpsUrl(body?.webhook_event_url, "WEBHOOK_EVENT_URL"),
    webhook_event_failover_url: optionalHttpsUrl(body?.webhook_event_failover_url, "WEBHOOK_FAILOVER_URL"),
    webhook_api_version: enumValue(body?.webhook_api_version, new Set(["1", "2"])) || "2",
    webhook_timeout_secs: body?.webhook_timeout_secs === undefined ? undefined : Math.max(0, Math.min(30, Math.floor(Number(body.webhook_timeout_secs)))),
    call_cost_in_webhooks: true,
    active: optionalBoolean(body?.active),
    anchorsite_override: enumValue(body?.anchorsite_override, ANCHOR_SITES),
    dtmf_type: enumValue(body?.dtmf_type, DTMF_TYPES),
    first_command_timeout: optionalBoolean(body?.first_command_timeout),
    first_command_timeout_secs: nullablePositiveInteger(body?.first_command_timeout_secs, 120),
    tags: body?.tags === undefined ? undefined : stringArray(body.tags).slice(0, 100),
    redact_dtmf_debug_logging: optionalBoolean(body?.redact_dtmf_debug_logging),
    inbound: callControlInbound(body?.inbound),
    outbound: callControlOutbound(body?.outbound),
  }).filter(([, value]) => value !== undefined));
}

export function outboundVoiceProfilePayload(body: any) {
  const name = optionalString(body?.name, 128);
  if (!name || name.length < 3) throw new Error("PROFILE_NAME_REQUIRED");
  const concurrent = nullablePositiveInteger(body?.concurrent_call_limit);
  const maxRate = Number(body?.max_destination_rate);
  const dailyLimit = Number(body?.daily_spend_limit);
  if (!Number.isFinite(maxRate) || maxRate < 0) throw new Error("MAX_DESTINATION_RATE_INVALID");
  if (!Number.isFinite(dailyLimit) || dailyLimit < 0) throw new Error("DAILY_SPEND_LIMIT_INVALID");
  return {
    name,
    traffic_type: "conversational",
    service_plan: "global",
    usage_payment_method: "rate-deck",
    enabled: body?.enabled !== false,
    concurrent_call_limit: concurrent,
    tags: stringArray(body?.tags).slice(0, 100),
    whitelisted_destinations: stringArray(body?.whitelisted_destinations, /^[A-Za-z]{2}$/).map((item) => item.toUpperCase()),
    max_destination_rate: maxRate,
    daily_spend_limit: dailyLimit.toFixed(2),
    daily_spend_limit_enabled: Boolean(body?.daily_spend_limit_enabled),
    billing_group_id: body?.billing_group_id || null,
    ...(body?.call_recording ? { call_recording: body.call_recording } : {}),
    ...(body?.calling_window ? { calling_window: body.calling_window } : {}),
  };
}
