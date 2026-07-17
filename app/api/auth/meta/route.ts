import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const provider = searchParams.get("provider") || "FACEBOOK"; // FACEBOOK, INSTAGRAM, WHATSAPP

    if (!employeeId) {
      return NextResponse.json({ error: "ID Employé manquant" }, { status: 400 });
    }

    // Verify employee belongs to the org
    const employee = await prisma.aIEmployee.findUnique({
      where: { id: employeeId, organizationId: session.user.organizationId }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
    }

    const clientId = process.env.META_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`;
    
    // We encode state to pass multiple params safely
    const stateObj = {
      orgId: session.user.organizationId,
      empId: employeeId,
      provider: provider
    };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    // Scopes depending on the provider
    let scopes = ["public_profile", "email", "pages_show_list", "pages_messaging", "pages_manage_metadata"];
    
    if (provider === "INSTAGRAM") {
      scopes.push("instagram_basic", "instagram_manage_messages");
    }

    const scopeString = scopes.join(",");

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopeString}&response_type=code`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Erreur Meta Auth:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
