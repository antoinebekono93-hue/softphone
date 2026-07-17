import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ai-team?error=${error}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ai-team?error=MissingParams`);
    }

    // Decode state
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    const { orgId, empId, provider } = decodedState;

    if (!orgId || !empId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ai-team?error=InvalidState`);
    }

    const clientId = process.env.META_APP_ID;
    const clientSecret = process.env.META_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`;

    // 1. Exchange code for User Access Token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
    
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Meta Token Error:", tokenData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ai-team?error=TokenExchangeFailed`);
    }

    const userAccessToken = tokenData.access_token;

    // 2. Fetch Pages for this user to get a Page Access Token
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`;
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ai-team?error=NoPagesFound`);
    }

    // Default to the first page for simplicity in this MVP
    const firstPage = pagesData.data[0];
    const pageAccessToken = firstPage.access_token;
    const pageId = firstPage.id;
    const pageName = firstPage.name;

    // 3. Save to Prisma
    // First, check if a SocialAccount already exists for this employee and provider
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        organizationId: orgId,
        aiEmployeeId: empId,
        provider: provider
      }
    });

    if (existingAccount) {
      await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          accountId: pageId,
          accountName: pageName,
          accessToken: pageAccessToken,
          status: "ACTIVE"
        }
      });
    } else {
      await prisma.socialAccount.create({
        data: {
          provider: provider,
          accountId: pageId,
          accountName: pageName,
          accessToken: pageAccessToken,
          status: "ACTIVE",
          organizationId: orgId,
          aiEmployeeId: empId
        }
      });
    }

    // Success redirect
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ai-team?success=social_connected`);
  } catch (error) {
    console.error("Erreur Meta Callback:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ai-team?error=CallbackError`);
  }
}
