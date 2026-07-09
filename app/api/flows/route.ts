import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const flows = await prisma.whatsAppFlow.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(flows);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    // Initial flow data structure with a basic trigger node
    const initialNodes = [
      {
        id: "trigger-1",
        type: "triggerNode",
        position: { x: 250, y: 100 },
        data: { label: "Nouveau Message Entrant" }
      }
    ];

    const flow = await prisma.whatsAppFlow.create({
      data: {
        name,
        organizationId: session.user.organizationId,
        nodes: JSON.parse(JSON.stringify(initialNodes)),
        edges: []
      }
    });

    return NextResponse.json(flow);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
