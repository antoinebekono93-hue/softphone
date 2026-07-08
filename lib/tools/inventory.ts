import { prisma } from '@/lib/prisma';

export async function check_stock_and_price(organizationId: string, args: { product_name: string }) {
  try {
    const products = await prisma.product.findMany({
      where: {
        organizationId: organizationId,
        name: {
          contains: args.product_name,
          mode: 'insensitive'
        }
      },
      take: 5
    });

    if (products.length === 0) {
      return { 
        success: false, 
        message: `Aucun produit correspondant à '${args.product_name}' n'a été trouvé dans le catalogue.` 
      };
    }

    if (products.length === 1) {
      const p = products[0];
      return {
        success: true,
        product: {
          name: p.name,
          sku: p.sku,
          price: p.price,
          stockLevel: p.stockLevel,
          description: p.description
        },
        message: p.stockLevel > 0 
          ? `Le produit '${p.name}' est en stock (Quantité: ${p.stockLevel}). Son prix est de ${p.price}€.` 
          : `Le produit '${p.name}' est actuellement en rupture de stock. Son prix est de ${p.price}€.`
      };
    }

    // Multiple products found (search was broad)
    const results = products.map(p => `- ${p.name} (Prix: ${p.price}€, Stock: ${p.stockLevel > 0 ? p.stockLevel + ' en stock' : 'Rupture'})`).join('\n');
    return {
      success: true,
      message: `Plusieurs produits correspondent à '${args.product_name}' :\n${results}`,
      products: products.map(p => ({ name: p.name, price: p.price, stockLevel: p.stockLevel }))
    };

  } catch (error: any) {
    console.error("[Inventory] check_stock_and_price error:", error);
    return { error: error.message };
  }
}
