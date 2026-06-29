import { NextRequest, NextResponse } from 'next/server';
import { webSearchCore } from '@/lib/web-search-core';

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
    const { query, maxResults = 5 } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

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
