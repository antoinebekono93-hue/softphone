import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { redis } from '@/lib/redis';
import { queryRedisMemory } from '@/lib/hermes-memory';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const topK = parseInt(searchParams.get('topK') || '10');
    const isStats = searchParams.get('stats') === '1';

    // --- Stats mode ---
    if (isStats) {
      if (!redis) return NextResponse.json({ total: 0, skills: 0, facts: 0 });

      const keys = await redis.smembers(`memory-index:${orgId}`) as string[];
      let skills = 0, facts = 0;

      for (const key of keys) {
        const type = await redis.hget(key, 'type') as string | null;
        if (type === 'SKILL') skills++;
        if (type === 'FACT') facts++;
      }

      return NextResponse.json({ total: keys.length, skills, facts });
    }

    // --- Search mode ---
    if (query) {
      const memories = await queryRedisMemory(orgId, "", query, topK);

      // Parse metadata JSON for each memory
      const formatted = memories.map((m: any) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        agentId: m.agentId,
        timestamp: m.timestamp,
        score: m.score,
        metadata: typeof m.metadata === 'string' ? JSON.parse(m.metadata as any) : m.metadata,
      }));

      return NextResponse.json({ memories: formatted });
    }

    // --- List all (no query) ---
    if (!redis) return NextResponse.json({ memories: [] });

    const keys = await redis.smembers(`memory-index:${orgId}`) as string[];
    const memories = [];

    for (const key of keys.slice(0, 50)) { // Cap at 50 for listing
      const data = await redis.hgetall(key) as Record<string, string> | null;
      if (!data) continue;
      memories.push({
        id: data.id,
        content: data.content,
        type: data.type,
        agentId: data.agentId,
        timestamp: data.timestamp,
        metadata: data.metadata ? JSON.parse(data.metadata) : {},
      });
    }

    // Sort by timestamp desc
    memories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ memories });
  } catch (error: any) {
    console.error('[Knowledge Memories]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!redis) return NextResponse.json({ error: 'Redis non configuré' }, { status: 503 });

    const orgId = session.user.organizationId;
    const { id } = await req.json();
    
    const key = `memory:${orgId}:${id}`;
    await redis.del(key);
    await redis.srem(`memory-index:${orgId}`, key);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
