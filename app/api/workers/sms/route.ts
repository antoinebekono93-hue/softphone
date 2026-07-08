import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Basic API Key authentication for the worker
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.WORKER_API_KEY || 'local-dev-key'}`) {
      // In production, configure WORKER_API_KEY
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: "Unauthorized worker" }, { status: 401 });
      }
    }

    const { phone, template, orgId } = await req.json();

    if (!phone || !template) {
      return NextResponse.json({ error: "Phone and template are required" }, { status: 400 });
    }

    let messageBody = "";
    if (template === "payment_confirmation") {
      messageBody = "Bonjour, votre paiement a bien été reçu. Merci de votre confiance !";
    } else if (template === "shipping_update") {
      messageBody = "Votre commande vient d'être expédiée. Vous recevrez un lien de suivi sous peu.";
    } else {
      messageBody = template; // Treat template as the raw message if not matching presets
    }

    console.log(`[Worker SMS] Envoi de SMS à ${phone}: ${messageBody}`);

    // Call Telnyx API to send SMS
    // Replace "YOUR_TELNYX_PHONE_NUMBER" with a dynamically resolved number based on orgId in production
    const telnyxRes = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`
      },
      body: JSON.stringify({
        from: "+15550000000", // Fallback or mock
        to: phone,
        text: messageBody
      })
    });

    if (!telnyxRes.ok) {
      const err = await telnyxRes.json();
      throw new Error(`Telnyx SMS error: ${JSON.stringify(err)}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Worker SMS] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
