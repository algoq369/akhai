import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { QueryAllSchema } from '@/lib/route-schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const parsed = QueryAllSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { query } = parsed.data;

    // Create comparison ID
    const comparisonId = nanoid(10);

    // Create queries for all 5 methodologies
    const methodologies = ['direct', 'cot', 'aot', 'tot', 'auto'] as const;
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
