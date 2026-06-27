import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "No org" }, { status: 404 });

    const calls = await prisma.callLog.findMany({
      where: { organizationId: org.id },
      orderBy: { id: 'desc' }, 
    });

    return NextResponse.json(calls);
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
