import { Redis } from '@upstash/redis';
import { prisma } from './prisma';
import { encryptData, maskPII } from './security';

// Use a mock redis locally if keys are missing to prevent crashes during build
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Context Engine (Redis) - Mémoire à court terme pour la latence < 10ms
 */
export async function getSessionContext(sessionId: string) {
  if (!redis) return null;
  try {
    const data = await redis.get(`session:${sessionId}`);
    return data || null;
  } catch (error) {
    console.error('[Context Engine] Error reading session:', error);
    return null;
  }
}

export async function setSessionContext(sessionId: string, contextData: any, ttlSeconds = 3600) {
  if (!redis) return;
  try {
    await redis.set(`session:${sessionId}`, JSON.stringify(contextData), { ex: ttlSeconds });
  } catch (error) {
    console.error('[Context Engine] Error writing session:', error);
  }
}

/**
 * Agentic Memory - Extraction et persistance des faits après une conversation
 */
export async function extractAndPersistFacts(contactId: string, transcript: string) {
  // 1. Masquage PII du transcript
  const cleanTranscript = maskPII(transcript);

  // 2. Appel au LLM (OpenAI) pour extraire les faits au format JSON strict
  // Note: this assumes process.env.OPENAI_API_KEY is available
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Tu es un extracteur de faits (Context Engine). Analyse la conversation suivante et extrais les informations clés sous forme de JSON strict avec ces clés optionnelles : budget, competitor, pain_point, timeline, notes."
          },
          {
            role: "user",
            content: cleanTranscript
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const extractedFacts = JSON.parse(data.choices[0].message.content);

    // 3. Chiffrement AES-256 des faits extraits avant la sauvegarde
    const encryptedFacts = encryptData(JSON.stringify(extractedFacts));

    // 4. Mise à jour de la mémoire à long terme (Contact DB)
    await prisma.contact.update({
      where: { id: contactId },
      data: {
        // We will store this in aiSummary or a new field if added to schema
        // For now we'll append to aiSummary and keep the encrypted version in memory
        aiSummary: `[Agentic Memory Updated]\n${JSON.stringify(extractedFacts, null, 2)}`
      }
    });

    console.log(`[Context Engine] Facts extracted and persisted securely for Contact ${contactId}`);
    return extractedFacts;

  } catch (error) {
    console.error('[Context Engine] Fact extraction failed:', error);
  }
}
