import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const flow = await prisma.whatsAppFlow.findUnique({
      where: { id: resolvedParams.id, organizationId: session.user.organizationId }
    });

    if (!flow) return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    return NextResponse.json(flow);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const resolvedParams = await params;

    const flow = await prisma.whatsAppFlow.update({
      where: { id: resolvedParams.id, organizationId: session.user.organizationId },
      data: {
        name: data.name,
        isActive: data.isActive,
        nodes: data.nodes ? JSON.parse(JSON.stringify(data.nodes)) : undefined,
        edges: data.edges ? JSON.parse(JSON.stringify(data.edges)) : undefined
      }
    });

    return NextResponse.json(flow);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;

    await prisma.whatsAppFlow.delete({
      where: { id: resolvedParams.id, organizationId: session.user.organizationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
