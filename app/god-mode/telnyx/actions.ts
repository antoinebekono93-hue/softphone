"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/security";
import { canonicalizePhoneNumber } from "@/lib/phone-number";
import { ensureTelnyxNumberCodeControlled, purchaseTelnyxNumber } from "@/lib/telnyx-number-purchase";
import { getConfiguredTelnyxClient } from "@/lib/telnyx";
import { callControlApplicationPayload, credentialConnectionPayload, outboundVoiceProfilePayload } from "@/lib/telnyx-voice-settings";

// 1. Get or Create System Settings
export async function getSystemSettings() {
  await requireSuperAdmin();
  let settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    // Keep the Telnyx console operational even while an unrelated pricing
    // migration is waiting to be deployed.
    select: { id: true, telnyxApiKey: true, telnyxConnectionId: true },
  });

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: { id: "default" },
      select: { id: true, telnyxApiKey: true, telnyxConnectionId: true },
    });
  }

  return {
    id: settings.id,
    telnyxConnectionId: settings.telnyxConnectionId,
    telnyxApiKeyConfigured: Boolean(settings.telnyxApiKey?.trim() || process.env.TELNYX_API_KEY?.trim()),
  };
}

// 2. Save API Key
export async function saveTelnyxApiKey(apiKey: string) {
  await requireSuperAdmin();
  const normalized = apiKey.trim();
  if (!normalized) return { error: "La clé API Telnyx est obligatoire." };
  // Validate before replacing the operational key. An invalid secret must
  // never take the production control plane offline.
  const validation = await fetch("https://api.telnyx.com/v2/balance", {
    headers: { Authorization: `Bearer ${normalized}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!validation.ok) return { error: `Telnyx a refusé cette clé (HTTP ${validation.status}).` };
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { telnyxApiKey: normalized },
    create: { id: "default", telnyxApiKey: normalized },
    select: { id: true },
  });
  revalidatePath("/god-mode/telnyx");
  return { success: true };
}

async function configuredApiKey() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { telnyxApiKey: true },
  });
  const apiKey = settings?.telnyxApiKey?.trim() || process.env.TELNYX_API_KEY?.trim();
  if (!apiKey) throw new Error("Clé API Telnyx non configurée dans God Mode.");
  return apiKey;
}

/** Connection used by both number provisioning and WebRTC token issuance. */
export async function saveTelnyxVoiceConnection(connectionId: string) {
  await requireSuperAdmin();
  if (!connectionId.trim()) return { error: "Sélectionnez une connexion SIP." };
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { telnyxConnectionId: connectionId },
    create: { id: "default", telnyxConnectionId: connectionId },
    select: { id: true },
  });
  revalidatePath("/god-mode/telnyx");
  return { success: true };
}

async function telnyxPatch(path: string, body: Record<string, unknown>) {
  const apiKey = await configuredApiKey();
  const response = await fetch(`https://api.telnyx.com/v2${path}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function updateCredentialConnection(connectionId: string, settings: {
  webhook_event_url: string;
  webhook_event_failover_url?: string;
  webhook_api_version: "1" | "2";
  webhook_timeout_secs: number;
  active?: boolean;
  conversation_persistence?: boolean;
  connection_name?: string;
  anchorsite_override?: string;
  dtmf_type?: "RFC 2833" | "Inband" | "SIP INFO";
  sip_uri_calling_preference?: "disabled" | "internal" | "unrestricted";
  default_on_hold_comfort_noise_enabled?: boolean;
  encode_contact_header_enabled?: boolean;
  onnet_t38_passthrough_enabled?: boolean;
  ios_push_credential_id?: string | null;
  android_push_credential_id?: string | null;
  encrypted_media?: "SRTP" | null;
  noise_suppression?: "inbound" | "outbound" | "both" | "disabled";
  noise_suppression_details?: { engine: "deep_filter_net"; attenuation_limit: number };
  tags?: string[];
  rtcp_settings?: { port: "rtcp-mux" | "rtp+1"; capture_enabled: boolean; report_frequency_secs: number };
  jitter_buffer?: { enable_jitter_buffer: boolean; jitterbuffer_msec_min: number; jitterbuffer_msec_max: number };
  inbound?: {
    ani_number_format: string;
    dnis_number_format: string;
    codecs: string[];
    default_routing_method: "sequential" | "round-robin";
    channel_limit: number | null;
    generate_ringback_tone: boolean;
    shaken_stir_enabled: boolean;
    simultaneous_ringing: "enabled" | "disabled";
    timeout_1xx_secs: number;
    timeout_2xx_secs: number;
    prack_enabled: boolean;
    isup_headers_enabled: boolean;
    sip_compact_headers_enabled: boolean;
  };
  outbound?: {
    outbound_voice_profile_id: string | null;
    channel_limit: number | null;
    ani_override: "always" | "normal" | "never";
    call_parking_enabled: boolean;
    instant_ringback_enabled: boolean;
    generate_ringback_tone: boolean;
    localization: string;
    t38_reinvite_source: "customer" | "telnyx";
  };
}) {
  await requireSuperAdmin();
  try {
    if (!connectionId.trim()) throw new Error("Identifiant de connexion manquant.");
    const data = await telnyxPatch(`/credential_connections/${connectionId}`, credentialConnectionPayload(settings));
    return { data: data.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateCallControlApplication(applicationId: string, settings: {
  application_name: string;
  webhook_event_url: string;
  webhook_event_failover_url?: string;
  webhook_api_version: "1" | "2";
  webhook_timeout_secs: number;
  active: boolean;
  anchorsite_override?: string;
  dtmf_type?: "RFC 2833" | "Inband" | "SIP INFO";
  first_command_timeout?: boolean;
  first_command_timeout_secs?: number;
  redact_dtmf_debug_logging?: boolean;
  tags?: string[];
  inbound?: {
    channel_limit: number | null;
    shaken_stir_enabled: boolean;
    sip_subdomain?: string;
    sip_subdomain_receive_settings?: "only_my_connections" | "from_anyone";
  };
  outbound?: { channel_limit: number | null; outbound_voice_profile_id: string | null };
}) {
  await requireSuperAdmin();
  try {
    const data = await telnyxPatch(`/call_control_applications/${applicationId}`, callControlApplicationPayload(settings));
    return { data: data.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

/** Explicit admin operation: reattach existing application numbers to the
 * selected voice connection. No number is changed until God Mode triggers it. */
export async function repairApplicationNumberRouting(connectionId: string) {
  await requireSuperAdmin();
  if (!connectionId) return { error: "Sélectionnez d'abord une connexion vocale." };
  const numbers = await prisma.phoneNumber.findMany({
    where: { telnyxId: { not: { startsWith: "mock-" } } },
    select: { id: true, telnyxId: true },
  });
  const telnyx = await getConfiguredTelnyxClient();
  let repaired = 0;
  const failures: string[] = [];
  for (const number of numbers) {
    try {
      await ensureTelnyxNumberCodeControlled({
        telnyx,
        telnyxNumberId: number.telnyxId,
        connectionId,
        messagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID?.trim(),
      });
      repaired++;
    } catch {
      failures.push(number.id);
    }
  }
  return { success: true, repaired, failures };
}

// 3. Fetch Balance from Telnyx API
export async function fetchTelnyxBalance() {
  await requireSuperAdmin();

  try {
    const apiKey = await configuredApiKey();
    const res = await fetch("https://api.telnyx.com/v2/balance", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { error: `Failed to fetch balance: ${res.status} ${errorText}` };
    }

    const data = await res.json();
    return { data: data.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

// -----------------------------------------------------
// OUTBOUND VOICE PROFILES MANAGEMENT
// -----------------------------------------------------

export async function fetchOutboundProfiles() {
  await requireSuperAdmin();
  try {
    const apiKey = await configuredApiKey();
    const res = await fetch("https://api.telnyx.com/v2/outbound_voice_profiles", {
      headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data: data.data || [] };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createOutboundProfile(profileData: any) {
  await requireSuperAdmin();
  try {
    const apiKey = await configuredApiKey();
    const payload = outboundVoiceProfilePayload(profileData);
    const res = await fetch("https://api.telnyx.com/v2/outbound_voice_profiles", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data: data.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateOutboundProfile(profileId: string, profileData: any) {
  await requireSuperAdmin();
  try {
    const apiKey = await configuredApiKey();
    const payload = outboundVoiceProfilePayload(profileData);
    const res = await fetch(`https://api.telnyx.com/v2/outbound_voice_profiles/${profileId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data: data.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function fetchCredentialConnections() {
  await requireSuperAdmin();
  try {
    const apiKey = await configuredApiKey();
    const res = await fetch("https://api.telnyx.com/v2/credential_connections", {
      headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data: data.data || [] };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function assignOutboundProfileToConnection(connectionId: string, profileId: string | null) {
  await requireSuperAdmin();
  try {
    const apiKey = await configuredApiKey();
    const res = await fetch(`https://api.telnyx.com/v2/credential_connections/${connectionId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        outbound: {
          outbound_voice_profile_id: profileId
        }
      })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data: data.data };
  } catch (error: any) {
    return { error: error.message };
  }
}
// 4. Fetch Messaging Profiles
export async function fetchMessagingProfiles() {
  await requireSuperAdmin();
  
  try {
    const apiKey = await configuredApiKey();
    const res = await fetch("https://api.telnyx.com/v2/messaging_profiles", {
      headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    return { data: data.data };
  } catch (e: any) {
    return { error: e.message };
  }
}

// 5. Fetch Call Control Applications
export async function fetchCallControlApps() {
  await requireSuperAdmin();
  
  try {
    const apiKey = await configuredApiKey();
    const res = await fetch("https://api.telnyx.com/v2/call_control_applications", {
      headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    return { data: data.data };
  } catch (e: any) {
    return { error: e.message };
  }
}

// 6. Fetch Organizations for dropdown
export async function getOrganizationsList() {
  await requireSuperAdmin();
  try {
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, slug: true }
    });
    return { data: orgs };
  } catch (e: any) {
    return { error: e.message };
  }
}

// 7. Search Global Numbers
export async function searchGlobalNumbers(countryCode: string) {
  await requireSuperAdmin();
  try {
    const apiKey = await configuredApiKey();
    const res = await fetch(`https://api.telnyx.com/v2/available_phone_numbers?filter[country_code]=${countryCode}&filter[limit]=10`, {
      headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    return { data: data.data };
  } catch (e: any) {
    return { error: e.message };
  }
}

// 8. Purchase and Assign Number
export async function purchaseAndAssignNumber(phoneNumber: string, organizationId: string) {
  await requireSuperAdmin();
  const canonicalPhoneNumber = canonicalizePhoneNumber(phoneNumber);
  if (!canonicalPhoneNumber) return { error: "Le numéro doit être au format E.164 valide." };
  try {
    // The stored God Mode key and connection are authoritative. The legacy
    // browser-supplied key argument is intentionally ignored.
    const result = await purchaseTelnyxNumber({
      organizationId,
      phoneNumber: canonicalPhoneNumber,
      requireApprovedKyc: true,
    });

    revalidatePath("/god-mode/telnyx");
    return { success: true, data: result };
  } catch (e: any) {
    return { error: e.message };
  }
}

// 9. Fetch Recent Messages (Diagnostics)
export async function fetchRecentMessages() {
  await requireSuperAdmin();
  try {
    const apiKey = await configuredApiKey();
    const res = await fetch("https://api.telnyx.com/v2/messages?page[size]=15", {
      headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    return { data: data.data };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function listVoiceUsers() {
  await requireSuperAdmin();
  const users = await prisma.user.findMany({
    where: { organizationId: { not: null } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isCallable: true,
      organizationId: true,
      telnyxTelephonyCredentialId: true,
      telnyxCredentialConnectionId: true,
      organization: { select: { name: true } },
    },
    orderBy: [{ organization: { name: "asc" } }, { email: "asc" }],
  });
  return {
    data: users.map((user) => ({
      ...user,
      // Never expose provider credential material beyond the opaque ID/status.
      credentialStatus: user.telnyxTelephonyCredentialId?.startsWith("provisioning:")
        ? "PROVISIONING"
        : user.telnyxTelephonyCredentialId ? "ACTIVE" : "NOT_PROVISIONED",
    })),
  };
}

export async function setUserVoiceAccess(userId: string, enabled: boolean) {
  await requireSuperAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telnyxTelephonyCredentialId: true },
  });
  if (!user) return { error: "Utilisateur introuvable." };

  const credentialId = user.telnyxTelephonyCredentialId;
  if ((!enabled || credentialId) && credentialId && !credentialId.startsWith("provisioning:")) {
    try {
      const apiKey = await configuredApiKey();
      const response = await fetch(`https://api.telnyx.com/v2/telephony_credentials/${credentialId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });
      if (!response.ok && response.status !== 404) throw new Error(`HTTP ${response.status}`);
    } catch (error: any) {
      return { error: `Telnyx n'a pas pu révoquer le credential : ${error.message}` };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isCallable: enabled,
      telnyxTelephonyCredentialId: null,
      telnyxCredentialConnectionId: null,
    },
  });
  revalidatePath("/god-mode/telnyx");
  return { success: true };
}
