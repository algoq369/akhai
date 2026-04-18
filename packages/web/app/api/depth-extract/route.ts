/**
 * POST /api/depth-extract
 * LLM-powered annotation extraction with SQLite cache + regex fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import {
  extractAnnotationsLLM,
  ANNOTATION_PROMPT_VERSION,
  type LLMAnnotation,
} from '@/lib/depth/llm-extractor';
import {
  detectAnnotations,
  DEFAULT_DEPTH_CONFIG,
  type DepthAnnotation,
} from '@/lib/depth-annotations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ExtractRequest {
  queryId: string;
  response: string;
  query: string;
}

function llmToDepthAnnotation(a: LLMAnnotation, idx: number): DepthAnnotation {
  return {
    id: `llm-${idx}`,
    type: 'detail',
    term: a.term,
    content: a.insight,
    position: 0,
    confidence: 0.95,
    expandable: true,
    expandQuery: `Who or what is ${a.term}? Full context and significance`,
    metadata: { layer: a.layer },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ExtractRequest = await request.json();
    const { queryId, response, query } = body;

    if (!queryId || !response) {
      return NextResponse.json({ annotations: [], source: 'none' });
    }

    // 1. Check cache
    const row = db
      .prepare('SELECT annotations, annotations_version FROM queries WHERE id = ?')
      .get(queryId) as { annotations: string | null; annotations_version: number } | undefined;

    if (row?.annotations && row.annotations_version === ANNOTATION_PROMPT_VERSION) {
      const cached: LLMAnnotation[] = JSON.parse(row.annotations);
      console.log(`[DepthExtract] queryId=${queryId} source=cache count=${cached.length}`);
      return NextResponse.json({
        annotations: cached.map(llmToDepthAnnotation),
        source: 'cache',
      });
    }

    // 2. Try LLM extraction
    try {
      const { annotations: llmAnns, source } = await extractAnnotationsLLM(response, query);

      // Cache in DB
      db.prepare('UPDATE queries SET annotations = ?, annotations_version = ? WHERE id = ?').run(
        JSON.stringify(llmAnns),
        ANNOTATION_PROMPT_VERSION,
        queryId
      );

      console.log(`[DepthExtract] queryId=${queryId} source=${source} count=${llmAnns.length}`);
      return NextResponse.json({
        annotations: llmAnns.map(llmToDepthAnnotation),
        source,
      });
    } catch (llmErr) {
      console.warn(`[DepthExtract] LLM failed, falling back to regex: ${(llmErr as Error).message?.slice(0, 100)}`);
    }

    // 3. Regex fallback (do NOT cache — should not displace real LLM results on retry)
    const regexAnns = detectAnnotations(response, DEFAULT_DEPTH_CONFIG);
    console.log(`[DepthExtract] queryId=${queryId} source=regex-fallback count=${regexAnns.length}`);
    return NextResponse.json({ annotations: regexAnns, source: 'regex-fallback' });
  } catch (err) {
    console.error('[DepthExtract] Fatal error:', (err as Error).message);
    return NextResponse.json({ annotations: [], source: 'none' });
  }
}
