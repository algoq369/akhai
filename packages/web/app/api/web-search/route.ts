import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { webSearchCore } from '@/lib/web-search-core';

export const WebSearchSchema = z.object({
  // simple-query's auto-search forwards the full user query (its schema caps at 10000)
  query: z.string().min(1).max(10000),
  maxResults: z.number().int().min(1).max(20).default(5),
});

export const dynamic = 'force-dynamic';

/**
 * Live Web Search API
 *
 * Thin HTTP wrapper over lib/web-search-core. Provider cascade (Brave → DDG →
 * honest-unavailable) lives in the core so it can also be called in-process by
 * the ReAct agent. Response shape is unchanged.
 *
 * Get free Brave key: https://brave.com/search/api/ → "Get Started Free"
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = WebSearchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { query, maxResults } = parsed.data;

    const { results, source, unavailable } = await webSearchCore(query, maxResults);

    return NextResponse.json({
      query,
      results,
      searchUnavailable: unavailable,
      timestamp: new Date().toISOString(),
      source,
    });
  } catch (error) {
    console.error(`[Search] Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    return NextResponse.json(
      {
        query: '',
        results: [],
        searchUnavailable: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
