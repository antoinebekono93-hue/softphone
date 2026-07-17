import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    let orgId = session?.user?.organizationId;
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const agents = await prisma.aIEmployee.findMany({
      where: { organizationId: orgId },
      include: { voicePhoneNumber: true }
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
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const agent = await prisma.aIEmployee.create({
      data: {
        name: body.name,
        systemPrompt: body.prompt || "You are a helpful AI assistant.",
        voiceId: body.voice || "alloy",
        language: body.language || "fr-FR",
        organizationId: orgId,
        voicePhoneNumberId: body.phoneNumberId || null
      }
    });
    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
