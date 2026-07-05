import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await req.json();

    const newFlow = await prisma.whatsAppFlow.create({
      data: {
        name: name || "Nouvelle Séquence",
        organizationId: session.user.organizationId,
        nodes: JSON.stringify([
          { id: '1', position: { x: 250, y: 50 }, data: { label: 'Déclencheur : Nouveau Contact' }, type: 'input' }
        ]),
        edges: JSON.stringify([])
      }
    });

    return NextResponse.json(newFlow);
  } catch (error: any) {
    console.error("Flow API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
