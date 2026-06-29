import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { accessToken, wabaId, phoneNumberId, phoneNumber } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    // Récupération de l'organisation de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: "Aucune organisation trouvée" }, { status: 400 });
    }

    // 1. [PLACEHOLDER] Appel à l'API Telnyx pour lier le compte WABA
    // ex: await fetch('https://api.telnyx.com/v2/whatsapp_embedded_signup_tokens', { ... })
    // Nous utiliserons le jeton Meta pour prouver l'autorisation à Telnyx.

    // 2. Enregistrement dans la base de données
    const waAccount = await prisma.whatsAppAccount.upsert({
      where: {
        organizationId: user.organizationId,
      },
      update: {
        accessToken: accessToken,
        wabaId: wabaId || "pending_waba",
        phoneNumberId: phoneNumberId || "pending_phone_id",
        phoneNumber: phoneNumber || "pending_number",
        status: "ACTIVE",
      },
      create: {
        organizationId: user.organizationId,
        accessToken: accessToken,
        wabaId: wabaId || "pending_waba",
        phoneNumberId: phoneNumberId || "pending_phone_id",
        phoneNumber: phoneNumber || "pending_number",
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, account: waAccount });
  } catch (error: any) {
    console.error("[/api/whatsapp/link-account] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
