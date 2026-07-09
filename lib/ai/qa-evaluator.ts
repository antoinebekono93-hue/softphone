import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

export async function evaluateCallQA(callLogId: string) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const callLog = await prisma.callLog.findUnique({
      where: { id: callLogId }
    });

    if (!callLog || !callLog.transcript) {
      console.log(`[QA] No transcript found for CallLog ${callLogId}. Skipping evaluation.`);
      return;
    }

    let transcriptSegments = [];
    try {
      transcriptSegments = typeof callLog.transcript === 'string' 
        ? JSON.parse(callLog.transcript) 
        : callLog.transcript;
    } catch (e) {
      console.error("[QA] Invalid JSON transcript format.");
      return;
    }

    if (!Array.isArray(transcriptSegments) || transcriptSegments.length === 0) {
      console.log(`[QA] Transcript array is empty. Skipping.`);
      return;
    }

    // Format the transcript into a readable string for the LLM
    const conversationText = transcriptSegments.map(seg => `${seg.role}: ${seg.text}`).join('\n');

    const systemPrompt = `Tu es un Superviseur Qualité B2B ultra exigeant.
Ta mission est d'évaluer l'Agent IA qui a mené cette conversation avec un client.

Critères d'évaluation :
1. Politesse et ton chaleureux.
2. Clarté des réponses.
3. Résolution de la demande du client ou progression vers l'objectif.

Retourne UNIQUEMENT un objet JSON valide avec cette structure stricte :
{
  "score": un entier de 1 à 10,
  "feedback": "Une phrase courte de retour constructif sur l'appel"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Voici la transcription de l'appel :\n\n${conversationText}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const resultText = response.choices[0].message.content;
    if (!resultText) throw new Error("Empty response from OpenAI");

    const result = JSON.parse(resultText);

    // Update the database with the QA results
    await prisma.callLog.update({
      where: { id: callLogId },
      data: {
        qaScore: result.score,
        qaFeedback: result.feedback
      }
    });

    console.log(`[QA] Evaluation complete for ${callLogId}. Score: ${result.score}/10`);

  } catch (error) {
    console.error(`[QA] Evaluation failed for call ${callLogId}:`, error);
  }
}
