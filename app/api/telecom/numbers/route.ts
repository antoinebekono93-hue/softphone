import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canonicalizePhoneNumber } from "@/lib/phone-number";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.organizationId) {
      return NextResponse.json({ data: [] });
    }

    // A softphone credential must never be able to choose another colleague's
    // DID as caller ID.  Team inventory remains available through the secured
    // dashboard action; this endpoint is deliberately for the current caller.
    const numbers = await prisma.phoneNumber.findMany({
      where: {
        organizationId: session.user.organizationId,
        assignedUserId: session.user.id,
        status: "ACTIVE",
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

    const callerIds = numbers.flatMap((number) => {
      const canonical = canonicalizePhoneNumber(number.number);
      // Fail closed: an invalid legacy value cannot become a browser caller ID.
      return canonical ? [{ ...number, number: canonical }] : [];
    });

    return NextResponse.json({ data: callerIds });
  } catch (error) {
    console.error("Error fetching user numbers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
