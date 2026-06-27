import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateVoiceToken } from "@/lib/twilio-tenant";

/**
 * GET /api/voice/token
 *
 * Generates a Twilio Access Token for the authenticated user.
 * The token is scoped to their organization's Twilio subaccount.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized — please log in" },
        { status: 401 }
      );
    }

    const identity = `org-${session.user.organizationId}-user-${session.user.id}`;

    const token = await generateVoiceToken(
      session.user.organizationId,
      session.user.id,
      identity
    );

    return NextResponse.json({
      token,
      identity,
    });
  } catch (error) {
    console.error("[Voice Token] Error generating token:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate token";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
