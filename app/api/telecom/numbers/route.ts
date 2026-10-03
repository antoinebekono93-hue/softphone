import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOwnedPhoneNumbers } from "@/lib/account-context";
import { canonicalizePhoneNumber } from "@/lib/phone-number";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.organizationId) {
      return NextResponse.json({ data: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    // INVARIANT C — the DB relation is the only authority on caller-ID
    // eligibility. A softphone credential must never be able to choose another
    // colleague's DID, and a stale browser that still lists a revoked number
    // simply gets nothing back. Team inventory stays behind the secured
    // dashboard action; this endpoint is deliberately the current caller only.
    const numbers = await getOwnedPhoneNumbers(session.user.id, session.user.organizationId);

    const callerIds = numbers.flatMap((number) => {
      const canonical = canonicalizePhoneNumber(number.number);
      // Fail closed: an invalid legacy value cannot become a browser caller ID.
      return canonical ? [{ ...number, number: canonical }] : [];
    });

    return NextResponse.json(
      { data: callerIds },
      // The softphone polls this list: a cached answer would resurrect a
      // revoked number (or hide a freshly assigned one).
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Error fetching user numbers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}