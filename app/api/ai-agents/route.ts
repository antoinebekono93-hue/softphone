import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    let orgId = session?.user?.organizationId;
    if (!orgId) {
      const defaultOrg = await prisma.organization.findFirst();
      if (defaultOrg) orgId = defaultOrg.id;
    }
    if (!orgId) return NextResponse.json({ error: "No org" }, { status: 404 });

    const agents = await prisma.voiceAIAgent.findMany({
      where: { organizationId: orgId },
      include: { phoneNumber: true }
    });
    
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: { organizationId: orgId }
    });

    return NextResponse.json({ agents, phoneNumbers });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await auth();
    let orgId = session?.user?.organizationId;
    if (!orgId) {
      const defaultOrg = await prisma.organization.findFirst();
      if (defaultOrg) orgId = defaultOrg.id;
    }
    if (!orgId) return NextResponse.json({ error: "No org" }, { status: 404 });

    const agent = await prisma.voiceAIAgent.create({
      data: {
        name: body.name,
        prompt: body.prompt,
        voice: body.voice,
        language: body.language,
        organizationId: orgId,
        phoneNumberId: body.phoneNumberId || null
      }
    });
    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
