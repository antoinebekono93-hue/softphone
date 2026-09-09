import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/security";
import { reconcilePstnProviderCost } from "@/lib/pstn-billing";

const TELNYX_DETAIL_RECORDS_URL = "https://api.telnyx.com/v2/detail_records";
const RECORD_TYPES = ["callcontrol-cdrs", "webrtc"] as const;

type ProviderCost = { cost: number; currency: string | null; billedSeconds: number | null };

function finiteCost(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function fetchTelnyxCost(apiKey: string, callControlId: string): Promise<ProviderCost | null> {
  const records = new Map<string, any>();
  let successfulQuery = false;

  for (const recordType of RECORD_TYPES) {
    const query = new URLSearchParams({
      "filter[record_type]": recordType,
      "filter[telnyx_call_control_id]": callControlId,
      "page[size]": "100",
    });
    const response = await fetch(`${TELNYX_DETAIL_RECORDS_URL}?${query}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      // Accounts differ in enabled CDR families. One unsupported family must
      // not prevent the other authoritative family from reconciling the call.
      console.warn("[Billing Sync] Telnyx CDR family unavailable", { recordType, status: response.status });
      continue;
    }
    successfulQuery = true;
    const payload = await response.json();
    for (const record of Array.isArray(payload?.data) ? payload.data : []) {
      if (record?.telnyx_call_control_id && record.telnyx_call_control_id !== callControlId) continue;
      const id = String(record?.id || record?.uuid || `${recordType}:${records.size}`);
      records.set(id, record);
    }
  }

  if (!successfulQuery) throw new Error("TELNYX_CDR_API_UNAVAILABLE");
  if (records.size === 0) return null;

  let cost = 0;
  let hasCost = false;
  let currency: string | null = null;
  let billedSeconds = 0;
  let hasBilledSeconds = false;
  for (const record of records.values()) {
    const recordCost = finiteCost(record?.cost);
    if (recordCost !== null) {
      cost += recordCost;
      hasCost = true;
    }
    if (!currency && typeof record?.currency === "string") currency = record.currency;
    const seconds = finiteCost(record?.billed_sec ?? record?.billable_time);
    if (seconds !== null) {
      billedSeconds += Math.round(seconds);
      hasBilledSeconds = true;
    }
  }
  return hasCost ? { cost, currency, billedSeconds: hasBilledSeconds ? billedSeconds : null } : null;
}

async function handle(req: Request) {
  if (!requireCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: { telnyxApiKey: true },
    });
    const apiKey = settings?.telnyxApiKey?.trim() || process.env.TELNYX_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: "TELNYX_API_KEY_NOT_CONFIGURED" }, { status: 503 });

    const candidates = await prisma.callLog.findMany({
      where: {
        isBilled: true,
        endedAt: { not: null, gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        providerReconciledAt: null,
      },
      select: { telnyxCallControlId: true },
      orderBy: { endedAt: "asc" },
      take: 100,
    });

    let reconciled = 0;
    let awaitingCdr = 0;
    const failures: Array<{ callControlId: string; error: string }> = [];
    for (const candidate of candidates) {
      try {
        const provider = await fetchTelnyxCost(apiKey, candidate.telnyxCallControlId);
        if (!provider) {
          awaitingCdr++;
          continue;
        }
        const result = await reconcilePstnProviderCost({
          callControlId: candidate.telnyxCallControlId,
          providerCost: provider.cost,
          providerCurrency: provider.currency,
          providerBilledSeconds: provider.billedSeconds,
        });
        if (result.reconciled) reconciled++;
      } catch (error) {
        failures.push({
          callControlId: candidate.telnyxCallControlId,
          error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        });
      }
    }

    return NextResponse.json({
      success: failures.length === 0,
      inspected: candidates.length,
      reconciled,
      awaitingCdr,
      failures,
    }, { status: failures.length > 0 ? 207 : 200 });
  } catch (error) {
    console.error("[Billing Sync]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const POST = handle;
export const GET = handle;
