import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPusherServer } from "@/lib/pusher";
import { appCallChannels, APP_CALL_EVENTS } from "@/lib/app-call-channels";
import { createAppCallSession } from "@/lib/app-call-session";
import {
  evaluateAppCallPolicy,
  logAppCallDecision,
} from "@/lib/app-call-policy";
import { resolveCallDestination } from "@/lib/call-routing";

export const dynamic = "force-dynamic";

type CallInitRequest = { target: string };

/**
 * Initie un appel APP_TO_APP (WebRTC natif P2P, hors Telnyx/PSTN).
 *
 * Étapes :
 *  1. Résolution backend de la cible (même organisation, jamais soi-même).
 *  2. Snapshot du plan + évaluation des protections tech / fair-use.
 *  3. Création de la session AppCallSession (status=OFFERING).
 *  4. Notification de sonnerie sur le canal privé du callee.
 *
 * Aucune charge wallet : APP_TO_APP est commercialement illimité
 * (unlimitedCalls) et n'est JAMAIS facturé au wallet.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const callerId = session.user.id;
  const orgId = session.user.organizationId;

  let body: CallInitRequest;
  try {
    body = (await req.json()) as CallInitRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const target = (body.target ?? "").trim();
  if (!target) {
    return NextResponse.json({ error: "Target required" }, { status: 400 });
  }

  // 1) Résolution backend centralisée (source de vérité serveur).
  //    Ce endpoint est réservé APP_TO_APP : si la cible n'est pas un utilisateur
  //    plateforme, la décision est APP_TO_PSTN → on refuse ici (l'appel doit
  //    partir par le chemin Telnyx/PSTN dédié).
  const route = await resolveCallDestination({
    callerId,
    organizationId: orgId,
    target,
  });

  if (route.type === "ERROR") {
    await logAppCallDecision(orgId, callerId, "CALL_DENIED", {
      reason: route.reason,
      target,
    });
    const status =
      route.reason === "UNAUTHORIZED" ? 401 : route.reason === "EMPTY_TARGET" ? 400 : 403;
    return NextResponse.json({ error: route.reason }, { status });
  }

  if (route.type !== "APP_TO_APP") {
    // Une cible externe ne doit JAMAIS passer par ce chemin : l'appel doit être
    // routé APP_TO_PSTN (Telnyx), hors de ce endpoint.
    await logAppCallDecision(orgId, callerId, "CALL_DENIED", {
      reason: "NOT_APP_TO_APP_DESTINATION",
      target,
    });
    return NextResponse.json({ error: "NOT_APP_TO_APP_DESTINATION" }, { status: 422 });
  }

  const callee = route.user;
  if (!callee) {
    await logAppCallDecision(orgId, callerId, "CALL_DENIED", {
      reason: "CALLEE_NOT_FOUND",
      target,
    });
    return NextResponse.json({ error: "CALLEE_NOT_FOUND" }, { status: 404 });
  }

  // 2) Politique / snapshot plan + fair-use
  const policy = await evaluateAppCallPolicy(orgId);
  if (!policy.authorized) {
    await logAppCallDecision(orgId, callerId, "CALL_DENIED", {
      reason: policy.reason,
      target,
    });
    return NextResponse.json({ error: policy.reason }, { status: 403 });
  }

  // 3) Création de la session APP_TO_APP avec GARDE ATOMIQUE anti-occupation.
  //    Deux appels simultanés vers le même utilisateur : un seul obtient le slot,
  //    l'autre reçoit CALL_BUSY et sa tentative est terminée proprement.
  const created = await createAppCallSession({
    callerId,
    calleeId: callee.id,
    organizationId: orgId,
    maxConcurrentCalls: policy.maxConcurrentCalls,
  });

  if (created.status !== "CREATED") {
    await logAppCallDecision(orgId, callerId, "CALL_DENIED", {
      reason: created.reason,
      target,
      calleeId: callee.id,
    });
    // Le destinataire est déjà occupé → BUSY (pas une simple erreur de création).
    return NextResponse.json({ error: created.reason }, { status: 409 });
  }

  const appCallId = created.sessionId;
  await logAppCallDecision(orgId, callerId, "CALL_AUTHORIZED", {
    callId: appCallId,
    calleeId: callee.id,
    target,
    planId: policy.planId,
    unlimitedCalls: policy.unlimitedCalls,
    destination: target,
    callControlId: appCallId,
  });

  // 4) Sonnerie côté callee
  try {
    await getPusherServer()?.trigger(appCallChannels.user(callee.id), APP_CALL_EVENTS.INCOMING, {
      callId: appCallId,
      caller: {
        id: callerId,
        name: session.user.name ?? null,
        callUsername: null,
        callExtension: null,
      },
      fairUse: {
        maxCallDurationSeconds: policy.maxCallDurationSeconds,
      },
    });
  } catch (err) {
    console.error("[app-calls] ring trigger failed", err);
  }

  return NextResponse.json(
    {
      call: {
        id: appCallId,
        status: "OFFERING",
        callee: {
          id: callee.id,
          name: callee.name,
          callUsername: callee.callUsername,
          callExtension: callee.callExtension,
        },
      },
      fairUse: {
        maxCallDurationSeconds: policy.maxCallDurationSeconds,
      },
      signalingChannel: appCallChannels.call(appCallId),
    },
    { status: 201 }
  );
}

/**
 * Historique des appels APP_TO_APP de l'organisation courante.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const calls = await prisma.appCallSession.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      caller: { select: { id: true, name: true, callUsername: true } },
      callee: { select: { id: true, name: true, callUsername: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ calls });
}
