import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/security";

export async function GET() {
  try {
    const guard = await requireSuperAdminApi();
    if (guard) return guard;

    let settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: {
        id: true, smsRate: true, callRatePerMinute: true, callBaseRatePerMinute: true,
        callMarkupPercent: true, aiAgentRatePerMinute: true, whatsappRate: true,
        phoneNumberRate: true, eSimRate: true, telnyxApiKey: true,
        telnyxConnectionId: true, updatedAt: true,
      },
    });
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: { id: "default" } });
    }

    const { telnyxApiKey, telnyxConnectionId, ...publicSettings } = settings;
    return NextResponse.json({
      ...publicSettings,
      telnyxApiKeyConfigured: Boolean(telnyxApiKey?.trim() || process.env.TELNYX_API_KEY?.trim()),
      telnyxConnectionConfigured: Boolean(telnyxConnectionId?.trim() || process.env.TELNYX_SIP_CONNECTION_ID?.trim()),
    });
  } catch (error) {
    console.error("[/api/admin/settings GET] Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireSuperAdminApi();
    if (guard) return guard;

    const body = await req.json();
    const {
      smsRate,
      callRatePerMinute,
      callBaseRatePerMinute,
      callMarkupPercent,
      aiAgentRatePerMinute,
      whatsappRate,
      phoneNumberRate,
      eSimRate
    } = body;

    // Backward compatibility for the legacy admin screen: its old single
    // "callRatePerMinute" input becomes the provider base at 0% margin.
    const baseRate = callBaseRatePerMinute ?? callRatePerMinute;
    const markupPercent = callMarkupPercent ?? 0;
    const settings = await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {
        smsRate,
        callRatePerMinute,
        callBaseRatePerMinute: baseRate,
        callMarkupPercent: markupPercent,
        aiAgentRatePerMinute,
        whatsappRate,
        phoneNumberRate,
        eSimRate
      },
      create: {
        id: "default",
        smsRate,
        callRatePerMinute,
        callBaseRatePerMinute: baseRate,
        callMarkupPercent: markupPercent,
        aiAgentRatePerMinute,
        whatsappRate,
        phoneNumberRate,
        eSimRate
      }
    });

    return NextResponse.json({ id: settings.id, updatedAt: settings.updatedAt });
  } catch (error) {
    console.error("[/api/admin/settings POST] Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
