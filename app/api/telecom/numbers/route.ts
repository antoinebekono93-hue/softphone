import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ data: [] });
    }

    const numbers = await prisma.phoneNumber.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      select: {
        id: true,
        number: true,
        telnyxId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ data: numbers });
  } catch (error) {
    console.error("Error fetching user numbers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
