// lib/tools/transactions.ts

export async function verifier_stock(skuId: string) {
  // In a real scenario, this queries PostgreSQL. We simulate it here.
  console.log(`[Tools] Vérification du stock pour ${skuId}...`);
  // Mock response
  const inStock = Math.random() > 0.2; // 80% chance in stock
  const price = Math.floor(Math.random() * 100) + 10;
  
  if (inStock) {
    return JSON.stringify({
      status: "available",
      sku: skuId,
      official_price: price,
      currency: "EUR",
      message: "Le produit est en stock. Ne mentionnez le prix que si l'utilisateur le demande, ou proposez un lien de paiement."
    });
  } else {
    return JSON.stringify({
      status: "out_of_stock",
      sku: skuId,
      message: "Désolé, ce produit est en rupture de stock."
    });
  }
}

export async function create_payment_link(skuId: string, customerEmail?: string) {
  // 1. Fetch official price from DB to prevent prompt injection.
  // We mock the DB fetch here:
  const officialPrice = Math.floor(Math.random() * 100) + 10;
  console.log(`[Tools] Création du lien Flutterwave pour ${skuId}. Prix officiel : ${officialPrice} EUR`);

  // 2. Call Flutterwave API (Simulated)
  // const fwResponse = await fetch('https://api.flutterwave.com/v3/payments', ...)
  
  const paymentLink = `https://flutterwave.com/pay/mock_${skuId}_${Date.now()}`;
  
  return JSON.stringify({
    success: true,
    payment_url: paymentLink,
    official_price_charged: officialPrice,
    currency: "EUR",
    message: "Le lien de paiement a été généré avec succès. Vous pouvez maintenant le fournir au client."
  });
}
