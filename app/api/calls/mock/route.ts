import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SUMMARIES = [
  "Le client a demandé des informations sur les horaires d'ouverture. L'IA a répondu que c'était de 9h à 18h.",
  "Demande de support technique concernant la facturation. Appel transféré à l'agent.",
  "Le prospect est très intéressé par le forfait annuel. Prévoir de relancer mardi.",
  "Appel abandonné avant la connexion à un agent."
];

const TRANSCRIPTS = [
  "Client: Bonjour, quels sont vos horaires ?\nIA: Nous sommes ouverts de 9h à 18h.",
  "Client: J'ai un problème de facture.\nIA: Je vous transfère au service concerné.",
  "Client: Je voudrais un devis pour 50 licences.\nIA: Bien sûr, je note cela."
];

export async function POST() {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "No org" }, { status: 404 });

    const mockCalls = Array.from({ length: 20 }).map(() => {
      const isCompleted = Math.random() > 0.3;
      const status = isCompleted ? "COMPLETED" : (Math.random() > 0.5 ? "CANCELED" : "MISSED");
      const duration = isCompleted ? Math.floor(Math.random() * 300) + 30 : 0;
      
      const hasAi = isCompleted && Math.random() > 0.2;

      return {
        telnyxCallControlId: `call_${Math.random().toString(36).substring(2, 10)}`,
        direction: Math.random() > 0.5 ? "INBOUND" : "OUTBOUND",
        status,
        fromNumber: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        toNumber: `+336${Math.floor(10000000 + Math.random() * 90000000)}`,
        duration,
        transcriptionText: hasAi ? TRANSCRIPTS[Math.floor(Math.random() * TRANSCRIPTS.length)] : null,
        aiSummary: hasAi ? SUMMARIES[Math.floor(Math.random() * SUMMARIES.length)] : null,
        organizationId: org.id,
      };
    });

    await prisma.callLog.createMany({
      data: mockCalls as any
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
