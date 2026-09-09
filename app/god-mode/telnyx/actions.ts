"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { debitWalletAtomically } from "@/lib/billing";
import { requireSuperAdmin } from "@/lib/security";
import { canonicalizePhoneNumber } from "@/lib/phone-number";

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

  return settings;
}

// 2. Save API Key
export async function saveTelnyxApiKey(apiKey: string) {
  await requireSuperAdmin();
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { telnyxApiKey: apiKey },
    create: { id: "default", telnyxApiKey: apiKey },
    select: { id: true },
  });
  revalidatePath("/god-mode/telnyx");
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

async function telnyxPatch(apiKey: string, path: string, body: Record<string, unknown>) {
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

export async function updateCredentialConnection(apiKey: string, connectionId: string, settings: {
  webhook_event_url: string;
  webhook_event_failover_url?: string;
  webhook_api_version: "1" | "2";
  webhook_timeout_secs: number;
}) {
  await requireSuperAdmin();
  try {
    const data = await telnyxPatch(apiKey, `/credential_connections/${connectionId}`, {
      webhook_event_url: settings.webhook_event_url,
      webhook_event_failover_url: settings.webhook_event_failover_url || null,
      webhook_api_version: settings.webhook_api_version,
      webhook_timeout_secs: settings.webhook_timeout_secs,
      // Telnyx includes provider usage cost in the call lifecycle webhook,
      // making reconciliation visible in our audit trail.
      call_cost_in_webhooks: true,
    });
    return { data: data.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateCallControlApplication(apiKey: string, applicationId: string, settings: {
  application_name: string;
  webhook_event_url: string;
  webhook_event_failover_url?: string;
  webhook_api_version: "1" | "2";
  webhook_timeout_secs: number;
  active: boolean;
}) {
  await requireSuperAdmin();
  try {
    const data = await telnyxPatch(apiKey, `/call_control_applications/${applicationId}`, {
      ...settings,
      webhook_event_failover_url: settings.webhook_event_failover_url || null,
      call_cost_in_webhooks: true,
    });
    return { data: data.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

/** Explicit admin operation: reattach existing application numbers to the
 * selected voice connection. No number is changed until God Mode triggers it. */
export async function repairApplicationNumberRouting(apiKey: string, connectionId: string) {
  await requireSuperAdmin();
  if (!connectionId) return { error: "Sélectionnez d'abord une connexion vocale." };
  const numbers = await prisma.phoneNumber.findMany({
    where: { telnyxId: { not: { startsWith: "mock-" } } },
    select: { id: true, telnyxId: true },
  });
  let repaired = 0;
  const failures: string[] = [];
  for (const number of numbers) {
    try {
      await telnyxPatch(apiKey, `/phone_numbers/${number.telnyxId}`, { connection_id: connectionId });
      repaired++;
    } catch {
      failures.push(number.id);
    }
  }
  return { success: true, repaired, failures };
}

// 3. Fetch Balance from Telnyx API
export async function fetchTelnyxBalance(apiKey: string) {
  await requireSuperAdmin();
  if (!apiKey) return { error: "No API Key configured" };

  try {
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

export async function fetchOutboundProfiles(apiKey: string) {
  await requireSuperAdmin();
  if (!apiKey) return { error: "No API Key configured" };
  try {
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

export async function createOutboundProfile(apiKey: string, profileData: any) {
  await requireSuperAdmin();
  if (!apiKey) return { error: "No API Key configured" };
  try {
    const res = await fetch("https://api.telnyx.com/v2/outbound_voice_profiles", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data: data.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateOutboundProfile(apiKey: string, profileId: string, profileData: any) {
  await requireSuperAdmin();
  if (!apiKey) return { error: "No API Key configured" };
  try {
    const res = await fetch(`https://api.telnyx.com/v2/outbound_voice_profiles/${profileId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data: data.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function fetchCredentialConnections(apiKey: string) {
  await requireSuperAdmin();
  if (!apiKey) return { error: "No API Key configured" };
  try {
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

export async function assignOutboundProfileToConnection(apiKey: string, connectionId: string, profileId: string | null) {
  await requireSuperAdmin();
  if (!apiKey) return { error: "No API Key configured" };
  try {
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
export async function fetchMessagingProfiles(apiKey: string) {
  await requireSuperAdmin();
  if (!apiKey) return { error: "No API Key" };
  
  try {
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
export async function fetchCallControlApps(apiKey: string) {
  await requireSuperAdmin();
  if (!apiKey) return { error: "No API Key" };
  
  try {
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
export async function searchGlobalNumbers(apiKey: string, countryCode: string) {
  await requireSuperAdmin();
  if (!apiKey) return { error: "No API Key" };
  try {
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
export async function purchaseAndAssignNumber(apiKey: string, phoneNumber: string, organizationId: string) {
  await requireSuperAdmin();
  if (!apiKey) return { error: "No API Key" };
  const canonicalPhoneNumber = canonicalizePhoneNumber(phoneNumber);
  if (!canonicalPhoneNumber) return { error: "Le numéro doit être au format E.164 valide." };
  try {
    // 1. Verify Wallet Balance & KYC (Zero-Trust Guard)
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { walletBalance: true, name: true, kycStatus: true }
    });

    if (!org) return { error: "Organization not found" };

    if (org.kycStatus !== "APPROVED") {
      return { error: `KYC Compliance Blocked: Organization is currently ${org.kycStatus}. Identity verification must be APPROVED before purchasing numbers or sending campaigns.` };
    }

    const NUMBER_COST = 2.00; // Hardcoded markup cost for buying a number
    if (org.walletBalance.toNumber() < NUMBER_COST) {
      return { error: `Insufficient Funds. Wallet balance is $${org.walletBalance.toFixed(2)}, but number costs $${NUMBER_COST.toFixed(2)}.` };
    }

    // 2. Buy from Telnyx
    const res = await fetch("https://api.telnyx.com/v2/number_orders", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`, 
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone_numbers: [{ phone_number: canonicalPhoneNumber }]
      })
    });
    
    if (!res.ok) {
      const errText = await res.text();
      return { error: `Purchase failed: ${errText}` };
    }

    const orderData = await res.json();
    
    // 3. Save to DB and Deduct from Wallet (Atomic Transaction)
    await prisma.$transaction(async (tx) => {
      await tx.phoneNumber.create({
        data: {
          number: canonicalPhoneNumber,
          telnyxId: orderData.data?.id || `manual-${Date.now()}`,
          status: "ACTIVE",
          organizationId: organizationId,
        }
      });

      const debited = await debitWalletAtomically(tx, organizationId, NUMBER_COST);
      if (!debited) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      await tx.walletTransaction.create({
        data: {
          organizationId: organizationId,
          amount: -NUMBER_COST,
          type: "DEBIT",
          description: `Purchase of Global Number ${canonicalPhoneNumber}`
        }
      });
    });

    revalidatePath("/god-mode/telnyx");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

// 9. Fetch Recent Messages (Diagnostics)
export async function fetchRecentMessages(apiKey: string) {
  await requireSuperAdmin();
  if (!apiKey) return { error: "No API Key" };
  try {
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
