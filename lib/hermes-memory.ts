import { AgentMemory } from "@redis-iris/agent-memory";

const REDIS_AGENT_MEMORY_URL = process.env.REDIS_AGENT_MEMORY_URL || "";
const REDIS_AGENT_MEMORY_STORE_ID = process.env.REDIS_AGENT_MEMORY_STORE_ID || "";
const REDIS_AGENT_MEMORY_KEY = process.env.REDIS_AGENT_MEMORY_KEY || "";

export const agentMemory = (REDIS_AGENT_MEMORY_URL && REDIS_AGENT_MEMORY_STORE_ID && REDIS_AGENT_MEMORY_KEY)
  ? new AgentMemory({
      serverURL: REDIS_AGENT_MEMORY_URL,
      storeId: REDIS_AGENT_MEMORY_STORE_ID,
      apiKey: REDIS_AGENT_MEMORY_KEY,
    })
  : null;

export type MemoryType = 'SKILL' | 'FACT' | 'PROCEDURE' | 'ESCALATION';

export interface HermesMemory {
  id: string;
  content: string;
  type: MemoryType;
  agentId: string;
  organizationId: string;
  timestamp: string;
  metadata: Record<string, unknown>;
  score?: number; 
}

/**
 * Stocke une mémoire long-terme en utilisant l'Agent Memory (gère l'embedding automatiquement)
 */
export async function storeMemory(
  organizationId: string,
  agentId: string,
  type: MemoryType,
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<string | null> {
  if (!agentMemory) return null;

  const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    const memoryData = {
      organizationId,
      agentId,
      type,
      timestamp: new Date().toISOString(),
      content,
      ...metadata
    };

    await agentMemory.bulkCreateLongTermMemories({
      memories: [
        {
          id: memoryId,
          text: JSON.stringify(memoryData),
        }
      ]
    });
    return memoryId;
  } catch (err) {
    console.error('[HermesMemoryV2] Error storeMemory:', err);
    return null;
  }
}

/**
 * Recherche des mémoires similaires via la recherche sémantique native
 */
export async function searchSimilarMemories(
  organizationId: string,
  queryText: string,
  typeFilter?: MemoryType,
  limit: number = 5
): Promise<HermesMemory[]> {
  if (!agentMemory) return [];

  try {
    const results = await agentMemory.searchLongTermMemory({
      text: queryText,
    });

    // The Redis Agent Memory API returns an object with results, memories or hits
    const rawResults = (results as any).results || (results as any).memories || (results as any).hits || [];

    const parsedResults: HermesMemory[] = rawResults.map((r: any) => {
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(r.text || "{}");
      } catch (e) {
        parsedData = { content: r.text };
      }

      return {
        id: r.id,
        content: parsedData.content || r.text,
        type: (parsedData.type as MemoryType) || 'FACT',
        agentId: parsedData.agentId || '',
        organizationId: parsedData.organizationId || '',
        timestamp: parsedData.timestamp || '',
        metadata: parsedData,
        score: r.score || 0
      };
    });

    // Filter manually by orgId and type
    let filtered = parsedResults.filter(r => r.organizationId === organizationId);
    if (typeFilter) {
      filtered = filtered.filter(r => r.type === typeFilter);
    }

    return filtered.slice(0, limit);
  } catch (err) {
    console.error('[HermesMemoryV2] Error searchSimilarMemories:', err);
    return [];
  }
}

// ─── Session Memory (Short-Term) ──────────────────────────────────────────────

export async function addSessionEvent(
  sessionId: string,
  actorId: string,
  role: 'USER' | 'ASSISTANT' | 'SYSTEM',
  text: string
) {
  if (!agentMemory) return;
  try {
    await agentMemory.addSessionEvent({
      sessionId,
      actorId,
      role,
      content: [{ text }],
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[HermesMemoryV2] Error addSessionEvent:', err);
  }
}

export async function getSessionContext(sessionId: string): Promise<any> {
  if (!agentMemory) return null;
  try {
    const session = await agentMemory.getSessionMemory(sessionId);
    return session;
  } catch (err) {
    console.error('[HermesMemoryV2] Error getSessionContext:', err);
    return null;
  }
}

export async function queryRedisMemory(organizationId: string, agentId: string, queryText: string, limit: number = 3) {
  return await searchSimilarMemories(organizationId, queryText, undefined, limit);
}

export function formatMemoriesForPrompt(memories: HermesMemory[]) {
  return memories.map(m => `- [${m.type}] ${m.content}`).join("\n");
}

export async function generateAndStoreSkill(
  organizationId: string,
  employeeId: string,
  history: { role: string, content: string }[],
  reason: string
) {
  const content = `Skill learned from history: ${reason}\n` + history.map(h => `${h.role}: ${h.content}`).join("\n");
  await storeMemory(organizationId, employeeId, 'SKILL', content);
}