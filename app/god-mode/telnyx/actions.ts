"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Get or Create System Settings
export async function getSystemSettings() {
  let settings = await prisma.systemSettings.findUnique({
    where: { id: "default" }
  });

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: { id: "default" }
    });
  }

  return settings;
}

// 2. Save API Key
export async function saveTelnyxApiKey(apiKey: string) {
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { telnyxApiKey: apiKey },
    create: { id: "default", telnyxApiKey: apiKey }
  });
  revalidatePath("/god-mode/telnyx");
}

// 3. Fetch Balance from Telnyx API
export async function fetchTelnyxBalance(apiKey: string) {
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

// 4. Fetch Messaging Profiles
export async function fetchMessagingProfiles(apiKey: string) {
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
  if (!apiKey) return { error: "No API Key" };
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
    if (org.walletBalance < NUMBER_COST) {
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
        phone_numbers: [{ phone_number: phoneNumber }]
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
          number: phoneNumber,
          telnyxId: orderData.data?.id || `manual-${Date.now()}`,
          status: "ACTIVE",
          organizationId: organizationId,
        }
      });

      await tx.organization.update({
        where: { id: organizationId },
        data: { walletBalance: { decrement: NUMBER_COST } }
      });

      await tx.walletTransaction.create({
        data: {
          organizationId: organizationId,
          amount: -NUMBER_COST,
          type: "DEBIT",
          description: `Purchase of Global Number ${phoneNumber}`
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
