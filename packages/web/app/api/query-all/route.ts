import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Create comparison ID
    const comparisonId = nanoid(10);

    // Create queries for all 5 methodologies
    const methodologies = ['direct', 'cot', 'aot', 'gtp', 'auto'] as const;
    const queries = await Promise.all(
      methodologies.map(async (methodology) => {
        const res = await fetch(`${request.nextUrl.origin}/api/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, methodology }),
        });

        if (!res.ok) {
          throw new Error(`Failed to create query for ${methodology}`);
        }

        const data = await res.json();
        return {
          methodology,
          queryId: data.queryId,
        };
      })
    );

    return NextResponse.json({
      comparisonId,
      query,
      queries,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
