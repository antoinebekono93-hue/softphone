import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { calComApiKey, calComEventId } = await req.json();

    const updatedOrg = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        calComApiKey: calComApiKey ?? undefined,
        calComEventId: calComEventId ?? undefined
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Settings Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
