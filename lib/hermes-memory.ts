/**
 * Hermes Memory Engine
 * Mémoire sémantique persistante pour les agents IA autonomes.
 *
 * Architecture :
 *   - Les conversations/procédures sont encodées en vecteurs (embeddings OpenAI)
 *   - Stockées dans Redis sous forme de Hash avec leur embedding JSON
 *   - Recherche par cosine similarity en JS (compatible Upstash sans Redis Stack)
 *   - Self-Improving Loop : après résolution, l'agent génère et stocke une SKILL
 */

import { redis } from './redis';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemoryType = 'SKILL' | 'FACT' | 'PROCEDURE' | 'ESCALATION';

export interface HermesMemory {
  id: string;
  content: string;
  embedding: number[];
  type: MemoryType;
  agentId: string;
  organizationId: string;
  timestamp: string;
  metadata: Record<string, unknown>;
  score?: number; // filled during search
}

// ─── Embedding ────────────────────────────────────────────────────────────────

/**
 * Génère un embedding vectoriel via OpenAI text-embedding-3-small (1536 dims).
 * Retourne null si la clé API est absente.
 */
export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[HermesMemory] OPENAI_API_KEY manquant — embedding désactivé');
    return null;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000), // limite de tokens
      }),
    });

    if (!res.ok) {
      console.error('[HermesMemory] Erreur embedding API:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.data?.[0]?.embedding ?? null;
  } catch (err) {
    console.error('[HermesMemory] Erreur embedText:', err);
    return null;
  }
}

// ─── Cosine Similarity ────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Store Memory ─────────────────────────────────────────────────────────────

/**
 * Stocke une mémoire dans Redis avec son embedding.
 * Clé : `memory:{orgId}:{uuid}`
 * Index : SADD `memory-index:{orgId}` → liste de toutes les clés de l'org
 */
export async function storeMemory(
  organizationId: string,
  agentId: string,
  type: MemoryType,
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<string | null> {
  if (!redis) return null;

  const embedding = await embedText(content);
  if (!embedding) return null;

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const key = `memory:${organizationId}:${id}`;

  const memoryData = {
    id,
    content,
    embedding: JSON.stringify(embedding),
    type,
    agentId,
    organizationId,
    timestamp: new Date().toISOString(),
    metadata: JSON.stringify(metadata),
  };

  // Stocker le hash
  await redis.hset(key, memoryData);
  // TTL de 90 jours (en secondes)
  await redis.expire(key, 60 * 60 * 24 * 90);
  // Ajouter à l'index de l'organisation
  await redis.sadd(`memory-index:${organizationId}`, key);

  console.log(`[HermesMemory] Mémoire stockée: ${key} (type: ${type})`);
  return id;
}

// ─── Query Memory ─────────────────────────────────────────────────────────────

/**
 * Recherche sémantique dans la mémoire Redis de l'organisation.
 * Retourne les topK mémoires les plus similaires à la query.
 * Seuil minimum de similarité : 0.70
 */
export async function queryRedisMemory(
  organizationId: string,
  query: string,
  topK = 3,
  minScore = 0.70
): Promise<HermesMemory[]> {
  if (!redis) return [];

  const queryEmbedding = await embedText(query);
  if (!queryEmbedding) return [];

  // Récupérer toutes les clés de mémoire pour cette organisation
  const keys = await redis.smembers(`memory-index:${organizationId}`);
  if (!keys || keys.length === 0) return [];

  const results: HermesMemory[] = [];

  // Calcul cosine similarity pour chaque mémoire
  for (const key of keys as string[]) {
    try {
      const data = await redis.hgetall(key) as Record<string, string> | null;
      if (!data || !data.embedding) continue;

      const storedEmbedding: number[] = JSON.parse(data.embedding);
      const score = cosineSimilarity(queryEmbedding, storedEmbedding);

      if (score >= minScore) {
        results.push({
          id: data.id,
          content: data.content,
          embedding: storedEmbedding,
          type: data.type as MemoryType,
          agentId: data.agentId,
          organizationId: data.organizationId,
          timestamp: data.timestamp,
          metadata: data.metadata ? JSON.parse(data.metadata) : {},
          score,
        });
      }
    } catch (err) {
      console.error(`[HermesMemory] Erreur lecture clé ${key}:`, err);
    }
  }

  // Trier par score décroissant et retourner les topK
  return results
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, topK);
}

// ─── Self-Improving Loop ──────────────────────────────────────────────────────

/**
 * Génère une SKILL (procédure réutilisable) après une résolution réussie.
 * L'agent LLM synthétise la conversation en une fiche de procédure Markdown.
 * Cette fiche est ensuite vectorisée et stockée dans Redis.
 */
export async function generateAndStoreSkill(
  organizationId: string,
  agentId: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  resolutionContext?: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || conversationHistory.length < 2) return null;

  const transcript = conversationHistory
    .map(m => `${m.role === 'user' ? 'CLIENT' : 'AGENT'}: ${m.content}`)
    .join('\n');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Tu es un archiviste expert en service client. 
Analyse la conversation ci-dessous et génère une fiche de procédure réutilisable au format JSON strict.

Format attendu:
{
  "title": "Titre court et descriptif du problème résolu",
  "category": "support|vente|facturation|technique|autre",
  "trigger": "Description du déclencheur (quand utiliser cette procédure)",
  "procedure": "Procédure détaillée en Markdown (étapes numérotées)",
  "key_phrases": ["phrase clé 1", "phrase clé 2"],
  "resolved": true
}

Sois concis et actionnable. La procédure doit être directement applicable par un agent IA.`,
          },
          {
            role: 'user',
            content: `CONVERSATION:\n${transcript}\n\nCONTEXTE DE RÉSOLUTION: ${resolutionContext || 'Le client semble satisfait.'}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error('[HermesMemory] Erreur génération skill:', res.status);
      return null;
    }

    const data = await res.json();
    const skill = JSON.parse(data.choices[0].message.content);

    if (!skill.title || !skill.procedure) return null;

    // Contenu à vectoriser : titre + déclencheur + procédure
    const skillContent = `# ${skill.title}\n\n**Catégorie:** ${skill.category}\n**Déclencheur:** ${skill.trigger}\n\n## Procédure\n${skill.procedure}\n\n**Mots-clés:** ${(skill.key_phrases || []).join(', ')}`;

    const memId = await storeMemory(
      organizationId,
      agentId,
      'SKILL',
      skillContent,
      { title: skill.title, category: skill.category, key_phrases: skill.key_phrases }
    );

    console.log(`[HermesMemory] ✅ Nouvelle SKILL générée et stockée: "${skill.title}" (id: ${memId})`);
    return memId;

  } catch (err) {
    console.error('[HermesMemory] Erreur generateAndStoreSkill:', err);
    return null;
  }
}

// ─── Format for Injection ─────────────────────────────────────────────────────

/**
 * Formate les mémoires récupérées pour injection dans le System Prompt de l'assistant.
 */
export function formatMemoriesForPrompt(memories: HermesMemory[]): string {
  if (memories.length === 0) return '';

  const sections = memories.map((m, i) => {
    const score = m.score ? ` (pertinence: ${Math.round(m.score * 100)}%)` : '';
    return `### Procédure ${i + 1}${score}\n${m.content}`;
  });

  return `\n\n---\n## 📚 MÉMOIRE PROCÉDURALE (procédures similaires résolues)\n\nCes procédures ont été identifiées comme pertinentes pour la demande actuelle. Applique-les si applicable :\n\n${sections.join('\n\n---\n\n')}\n---\n`;
}
