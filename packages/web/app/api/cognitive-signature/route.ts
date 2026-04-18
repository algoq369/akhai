/**
 * POST /api/cognitive-signature
 * Per-exchange cognitive signature extraction with SQLite cache.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import {
  extractCognitiveSignature,
  restructureThinkingIntoLenses,
  COGNITIVE_PROMPT_VERSION,
} from '@/lib/cognitive/llm-extractor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SignatureRequest {
  queryId: string;
  query: string;
  response: string;
  sessionHistory?: Array<{ role: string; content: string }>;
  rawThinking?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignatureRequest = await request.json();
    const { queryId, query, response, sessionHistory = [], rawThinking } = body;

    if (!queryId || !response) {
      return NextResponse.json({
        inline_dialogue: [],
        short_metadata_summary: '',
        short_output_summary: '',
        source: 'none',
      });
    }

    // 1. Check cache
    const row = db
      .prepare('SELECT cognitive_signature, cognitive_signature_version FROM queries WHERE id = ?')
      .get(queryId) as
      | { cognitive_signature: string | null; cognitive_signature_version: number }
      | undefined;

    if (row?.cognitive_signature && row.cognitive_signature_version === COGNITIVE_PROMPT_VERSION) {
      const cached = JSON.parse(row.cognitive_signature);
      console.log(
        `[Cognitive] queryId=${queryId} source=cache lenses=${cached.inline_dialogue?.length || 0}`
      );
      return NextResponse.json({ ...cached, source: 'cache' });
    }

    // 2. LLM extraction — use restructure path when raw thinking available
    try {
      const sig =
        rawThinking && rawThinking.length > 100
          ? await restructureThinkingIntoLenses({ rawThinking, query, response })
          : await extractCognitiveSignature({ query, response, sessionHistory });

      // Cache in DB
      db.prepare(
        'UPDATE queries SET cognitive_signature = ?, cognitive_signature_version = ? WHERE id = ?'
      ).run(JSON.stringify(sig), COGNITIVE_PROMPT_VERSION, queryId);

      console.log(
        `[Cognitive] queryId=${queryId} source=${sig.source} lenses=${sig.inline_dialogue.length}`
      );
      return NextResponse.json(sig);
    } catch (llmErr) {
      console.warn(`[Cognitive] LLM failed: ${(llmErr as Error).message?.slice(0, 100)}`);
    }

    // 3. Fallback: empty (enrichment, never critical)
    return NextResponse.json({
      inline_dialogue: [],
      short_metadata_summary: '',
      short_output_summary: '',
      source: 'none',
    });
  } catch (err) {
    console.error('[Cognitive] Fatal error:', (err as Error).message);
    return NextResponse.json({
      inline_dialogue: [],
      short_metadata_summary: '',
      short_output_summary: '',
      source: 'none',
    });
  }
}
