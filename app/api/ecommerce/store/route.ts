import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const store = await prisma.ecommerceStore.findFirst({
      where: { organizationId: session.user.organizationId }
    });

    return NextResponse.json({ store });
  } catch (error) {
    console.error("[GET /api/ecommerce/store]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storeUrl, platform, isActive, aiDiscountEnabled, aiDiscountValue } = await req.json();

    const existingStore = await prisma.ecommerceStore.findFirst({
      where: { organizationId: session.user.organizationId }
    });

    let store;
    if (existingStore) {
      store = await prisma.ecommerceStore.update({
        where: { id: existingStore.id },
        data: {
          storeUrl,
          platform: platform || "SHOPIFY",
          isActive: isActive !== undefined ? isActive : true,
          aiDiscountEnabled: aiDiscountEnabled !== undefined ? aiDiscountEnabled : false,
          aiDiscountValue: aiDiscountValue || null
        }
      });
    } else {
      store = await prisma.ecommerceStore.create({
        data: {
          organizationId: session.user.organizationId,
          storeUrl,
          platform: platform || "SHOPIFY",
          isActive: true,
          aiDiscountEnabled: aiDiscountEnabled !== undefined ? aiDiscountEnabled : false,
          aiDiscountValue: aiDiscountValue || null
        }
      });
    }

    return NextResponse.json({ success: true, store });
  } catch (error) {
    console.error("[POST /api/ecommerce/store]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
