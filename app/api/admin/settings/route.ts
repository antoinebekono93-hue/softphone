import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: { id: "default" } });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[/api/admin/settings GET] Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Idéalement, vérifier session.user.role === 'ADMIN'
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      smsRate,
      callRatePerMinute,
      aiAgentRatePerMinute,
      whatsappRate,
      phoneNumberRate,
      eSimRate
    } = body;

    const settings = await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {
        smsRate,
        callRatePerMinute,
        aiAgentRatePerMinute,
        whatsappRate,
        phoneNumberRate,
        eSimRate
      },
      create: {
        id: "default",
        smsRate,
        callRatePerMinute,
        aiAgentRatePerMinute,
        whatsappRate,
        phoneNumberRate,
        eSimRate
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[/api/admin/settings POST] Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
