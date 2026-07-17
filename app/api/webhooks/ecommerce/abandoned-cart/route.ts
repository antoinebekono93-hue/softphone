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
      where: { id: storeId },
      include: { organization: true }
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // In a real production scenario, we would verify Shopify HMAC here using store.webhookSecret

    const payload = await req.json();
    
    // Shopify abandoned cart payload contains phone number in customer or billing_address
    // WooCommerce sends it in billing.phone
    const phone = payload.customer?.phone || payload.billing_address?.phone || payload.billing?.phone;
    const cartId = payload.id?.toString();
    const totalPrice = parseFloat(payload.total_price || "0");
    const currency = payload.currency || "EUR";
    const checkoutUrl = payload.abandoned_checkout_url;
    
    if (!phone || !cartId) {
      return NextResponse.json({ error: "No phone number or cart ID found in payload" }, { status: 400 });
    }

    // 1. Find or Create Contact
    const contact = await prisma.contact.upsert({
      where: {
        organizationId_phone: {
          organizationId: store.organizationId,
          phone: phone
        }
      },
      update: {
        botMode: true, // Enable autonomous AI for this recovery
        name: payload.customer?.first_name ? `${payload.customer.first_name} ${payload.customer.last_name}` : undefined
      },
      create: {
        organizationId: store.organizationId,
        phone: phone,
        botMode: true,
        name: payload.customer?.first_name ? `${payload.customer.first_name} ${payload.customer.last_name}` : null
      }
    });

    // 2. Create or Update Cart
    const cart = await prisma.cart.upsert({
      where: {
        organizationId_externalCartId: {
          organizationId: store.organizationId,
          externalCartId: cartId
        }
      },
      update: {
        totalPrice,
        currency,
        checkoutUrl,
        status: "ABANDONED"
      },
      create: {
        organizationId: store.organizationId,
        externalCartId: cartId,
        contactId: contact.id,
        totalPrice,
        currency,
        checkoutUrl,
        status: "ABANDONED"
      }
    });

    // 3. Save Cart Items
    if (payload.line_items && Array.isArray(payload.line_items)) {
      // Clear old items to avoid duplicates if cart updated
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      
      const itemsToCreate = payload.line_items.map((item: any) => ({
        cartId: cart.id,
        productId: item.product_id?.toString() || "unknown",
        productName: item.title,
        quantity: item.quantity,
        price: parseFloat(item.price || "0")
      }));
      
      await prisma.cartItem.createMany({ data: itemsToCreate });
    }

    // 4. Send initial WhatsApp Template
    // We fetch our own local API to send the message to reuse existing Telnyx Logic
    // In Next.js App Router, we can just call the POST handler of our send API if we want, or do a fetch.
    // For simplicity, we do a fetch to localhost if we know the domain, but in production we might not.
    // Let's replicate the Telnyx sending logic for speed and reliability, or use the base URL.
    
    // Using Telnyx directly
    const account = await prisma.whatsAppAccount.findUnique({
      where: { organizationId: store.organizationId }
    });

    if (account?.phoneNumber) {
      const apiKey = process.env.TELNYX_API_KEY;
      const firstName = payload.customer?.first_name || "là";
      const itemsString = payload.line_items?.map((i:any) => i.title).join(", ") || "vos articles";

      // Envoi du message RAG initial
      const messageText = `Bonjour ${firstName} 👋\n\nVous avez oublié ${itemsString} dans votre panier. Souhaitez-vous de l'aide ou avez-vous une question sur un produit ? Répondez-moi ici !`;

      const response = await fetch('https://api.telnyx.com/v2/messages/whatsapp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          from: account.phoneNumber,
          to: phone,
          whatsapp_message: {
            type: 'text',
            text: { body: messageText, preview_url: false }
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // --- NOUVEAU: INJECTION DU CONTEXTE DANS LE THREAD OPENAI ---
        try {
          const OpenAI = (await import('openai')).default;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          
          let threadId = contact.openaiThreadId;
          if (!threadId) {
            const thread = await openai.beta.threads.create();
            threadId = thread.id;
            await prisma.contact.update({
              where: { id: contact.id },
              data: { openaiThreadId: threadId }
            });
          }

          // Injecter une note de système invisible pour l'utilisateur mais visible par l'IA
          let discountNote = "";
          if (store.aiDiscountEnabled && store.aiDiscountValue) {
            discountNote = `\nLe gérant de la boutique a autorisé une réduction de ${store.aiDiscountValue}. Si le client hésite à cause du prix ou des frais de port, tu es autorisé à lui offrir ce code promo pour conclure la vente.`;
          }

          const systemNote = `[SYSTÈME] Un événement de PANIER ABANDONNÉ vient de se produire.
Montant du panier : ${totalPrice} ${currency}.
Produits abandonnés : ${itemsString}.
Un message de relance vient d'être envoyé automatiquement au client : "${messageText}".
Ton rôle : Si le client répond, essaie de comprendre pourquoi il a abandonné son panier (prix, frais de port, hésitation) et offre de l'aide ou une réduction si nécessaire pour conclure la vente.${discountNote}`;

          await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: systemNote
          });
          console.log(`[Ecommerce] Contexte panier abandonné injecté dans le thread ${threadId}`);
        } catch (e) {
          console.error("[Ecommerce] Erreur injection contexte OpenAI:", e);
        }
        // -------------------------------------------------------------

        await prisma.smsMessage.create({
          data: {
            telnyxMessageId: data.data?.id || `wa_${Date.now()}`,
            direction: 'OUTBOUND',
            body: messageText,
            status: 'SENT',
            type: 'WHATSAPP',
            fromNumber: account.phoneNumber,
            toNumber: phone,
            organizationId: store.organizationId,
            contactId: contact.id
          }
        });
      } else {
        console.error("Telnyx send failed in webhook", await response.text());
      }
    }

    return NextResponse.json({ success: true, cartId: cart.id });

  } catch (error: any) {
    console.error("[Abandoned Cart Webhook Error]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
