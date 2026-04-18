/**
 * POST /api/conversation-synthesis
 * Chapter-structured conversation narrative with SQLite cache.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import crypto from 'crypto';
import { generateSynthesis, SYNTHESIS_PROMPT_VERSION } from '@/lib/cognitive/llm-extractor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SynthesisRequest {
  chatId: string;
  exchanges: Array<{
    queryId: string;
    query: string;
    responseSummary: string;
    metadataSummary: string;
  }>;
}

function computeHash(queryIds: string[]): string {
  return crypto.createHash('sha256').update(queryIds.join(':')).digest('hex').slice(0, 16);
}

export async function POST(request: NextRequest) {
  try {
    const body: SynthesisRequest = await request.json();
    const { chatId, exchanges } = body;

    if (!chatId || !exchanges || exchanges.length === 0) {
      return NextResponse.json({ chapters: [], source: 'none' });
    }

    const exchangesHash = computeHash(exchanges.map((e) => e.queryId));

    // 1. Check cache
    const row = db
      .prepare(
        'SELECT synthesis, exchanges_hash, version FROM conversation_syntheses WHERE chat_id = ?'
      )
      .get(chatId) as { synthesis: string; exchanges_hash: string; version: number } | undefined;

    if (row && row.exchanges_hash === exchangesHash && row.version === SYNTHESIS_PROMPT_VERSION) {
      const cached = JSON.parse(row.synthesis);
      console.log(
        `[Synthesis] chatId=${chatId} source=cache chapters=${cached.chapters?.length || 0}`
      );
      return NextResponse.json({ ...cached, source: 'cache' });
    }

    // 2. LLM generation
    try {
      const result = await generateSynthesis({ exchanges });

      // Cache
      db.prepare(
        "INSERT OR REPLACE INTO conversation_syntheses (chat_id, synthesis, exchanges_hash, version, updated_at) VALUES (?, ?, ?, ?, strftime('%s', 'now'))"
      ).run(chatId, JSON.stringify(result), exchangesHash, SYNTHESIS_PROMPT_VERSION);

      console.log(
        `[Synthesis] chatId=${chatId} source=${result.source} chapters=${result.chapters.length}`
      );
      return NextResponse.json(result);
    } catch (llmErr) {
      console.warn(`[Synthesis] LLM failed: ${(llmErr as Error).message?.slice(0, 100)}`);
    }

    // 3. Fallback
    return NextResponse.json({ chapters: [], source: 'none' });
  } catch (err) {
    console.error('[Synthesis] Fatal error:', (err as Error).message);
    return NextResponse.json({ chapters: [], source: 'none' });
  }
}
