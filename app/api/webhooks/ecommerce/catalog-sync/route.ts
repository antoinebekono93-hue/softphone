import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
    }

    const store = await prisma.ecommerceStore.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // In a production app, verify HMAC signature here using store.webhookSecret

    const payload = await req.json();

    // Payload de type "Product" Shopify ou WooCommerce/Custom
    const productIdStr = payload.id?.toString();
    if (!productIdStr) {
      return NextResponse.json({ error: "No product ID in payload" }, { status: 400 });
    }

    const name = payload.title || payload.name || "Produit sans nom";
    const description = payload.body_html || payload.description || "";
    
    let price = parseFloat(payload.price || "0");
    let sku = payload.sku || "";
    let totalStock = parseInt(payload.stock_quantity || payload.inventory_quantity || "0", 10);

    // Shopify spécificités (Variants)
    if (payload.variants && Array.isArray(payload.variants) && payload.variants.length > 0) {
      price = parseFloat(payload.variants[0].price || price.toString());
      sku = payload.variants[0].sku || sku;
      totalStock = payload.variants.reduce((acc: number, variant: any) => {
        return acc + (variant.inventory_quantity || 0);
      }, 0);
    }

    // 1. Chercher si le produit existe déjà via son SKU et OrganizationId
    const existingProducts = await prisma.product.findMany({
      where: {
        organizationId: store.organizationId,
        sku: sku
      }
    });

    if (existingProducts.length > 0) {
      // Update the first matching product
      await prisma.product.update({
        where: { id: existingProducts[0].id },
        data: {
          name,
          description,
          price,
          stockLevel: totalStock
        }
      });
      console.log(`[Catalog] Produit mis à jour: ${sku} - Stock: ${totalStock}`);
    } else {
      // Create new product
      await prisma.product.create({
        data: {
          sku,
          name,
          description,
          price,
          stockLevel: totalStock,
          organizationId: store.organizationId
        }
      });
      console.log(`[Catalog] Nouveau produit ajouté: ${sku} - Stock: ${totalStock}`);
    }

    return NextResponse.json({ success: true, sku, stockLevel: totalStock });

  } catch (error) {
    console.error("[Catalog Sync Webhook Error]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
