import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId } = await req.json();

    if (!contactId) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id: contactId, organizationId: session.user.organizationId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Récupérer l'historique des messages
    const messages = await prisma.smsMessage.findMany({
      where: {
        contactId: contact.id,
        organizationId: session.user.organizationId,
      },
      orderBy: { sentAt: 'asc' },
      take: 50 // Analyser les 50 derniers messages
    });

    if (messages.length === 0) {
      return NextResponse.json({ summary: "Aucun message à résumer." });
    }

    const conversationText = messages.map(m => `[${m.direction === 'INBOUND' ? 'Client' : 'Agent'}] ${m.sentAt.toLocaleString()}: ${m.body}`).join('\n');

    // Moteur d'IA (Phase 4)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modèle rapide et économique
      messages: [
        { role: "system", content: "Tu es un assistant CRM expert. Résume la conversation WhatsApp suivante en 3 à 5 puces concises pour qu'un agent humain puisse comprendre le contexte en 5 secondes. Identifie l'intention principale et les problèmes rencontrés." },
        { role: "user", content: `Voici la conversation:\n\n${conversationText}` }
      ]
    });

    const summary = completion.choices[0]?.message?.content || "Impossible de générer le résumé.";

    // Stocker le résumé sur le Contact (Phase 4)
    await prisma.contact.update({
      where: { id: contact.id },
      data: { aiSummary: summary }
    });

    return NextResponse.json({ success: true, summary });

  } catch (error: any) {
    console.error("[AI Summarize Error]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
