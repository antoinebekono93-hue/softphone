import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPusherServer } from "@/lib/pusher";
import { appCallChannels } from "@/lib/app-call-channels";

export const dynamic = "force-dynamic";

/**
 * Autorisation d'abonnement aux canaux privés (Pusher HTTP auth, mode AJAX).
 * pusher-js POST socket_id + channel_name (form-urlencoded).
 *
 * - private-user-{userId}  : uniquement l'utilisateur lui-même.
 * - private-call-{callId}  : uniquement le caller ou le callee de la session.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const form = await req.text();
  const params = new URLSearchParams(form);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
  }

  let authorized = false;

  if (channelName === appCallChannels.user(userId)) {
    // Le user ne peut s'abonner qu'à son propre canal privé
    authorized = true;
  } else if (channelName.startsWith("private-call-")) {
    const callId = channelName.replace("private-call-", "");
    try {
      const sessionRow = await prisma.appCallSession.findUnique({
        where: { id: callId },
        select: { callerId: true, calleeId: true, status: true },
      });
      if (
        sessionRow &&
        (sessionRow.callerId === userId || sessionRow.calleeId === userId) &&
        !["MISSED", "DECLINED", "FAILED"].includes(sessionRow.status)
      ) {
        authorized = true;
      }
    } catch {
      authorized = false;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const server = getPusherServer();
  if (!server) {
    return NextResponse.json({ error: "Pusher not configured" }, { status: 500 });
  }

  const authResponse = server.authorizeChannel(socketId, channelName);
  return new NextResponse(JSON.stringify(authResponse), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
