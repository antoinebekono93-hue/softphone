import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COUNTRIES = ["France", "États-Unis", "Côte d'Ivoire", "Sénégal", "Royaume-Uni", "Canada"];

export async function POST() {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    // Create 50 messages
    const mockMessages = Array.from({ length: 50 }).map((_, i) => {
      const type = Math.random() > 0.8 ? "MMS" : "SMS";
      const statusRoll = Math.random();
      let status = "DELIVERED";
      if (statusRoll > 0.95) status = "UNDELIVERED";
      else if (statusRoll > 0.85) status = "IN_FLIGHT";

      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const cost = type === "MMS" ? 0.02 + (Math.random() * 0.03) : 0.005 + (Math.random() * 0.01);
      
      const sentAt = new Date();
      sentAt.setDate(sentAt.getDate() - Math.floor(Math.random() * 30));

      return {
        telnyxMessageId: `msg_${Math.random().toString(36).substring(2, 10)}`,
        direction: Math.random() > 0.1 ? "OUTBOUND" : "INBOUND",
        body: type === "SMS" ? "Votre code de vérification est 1234." : "Voici la photo de votre livraison.",
        status,
        type,
        cost,
        country,
        fromNumber: "+15550000000",
        toNumber: `+${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        organizationId: org.id,
        sentAt
      };
    });

    await prisma.smsMessage.createMany({
      data: mockMessages as any
    });

    return NextResponse.json({ success: true, count: mockMessages.length });
  } catch (error) {
    console.error("Error mocking messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
