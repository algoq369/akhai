import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { generateSynopsis } from '@/lib/side-canal';
import { SideCanalSynopsisSchema } from '@/lib/route-schemas';
import { requireAuth } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

/**
 * POST /api/side-canal/synopsis
 * Generate synopsis for a specific topic
 */
export async function POST(request: NextRequest) {
    const guard = requireAuth(request);
    if (guard.error) return guard.error;
  try {
    const token = request.cookies.get('session_token')?.value;
    const user = token ? getUserFromSession(token) : null;
    const userId = user?.id || null;

    const parsed = SideCanalSynopsisSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { topicId, queryIds } = parsed.data;

    // Generate synopsis for this topic
    const synopsis = await generateSynopsis(topicId, queryIds, userId);

    return NextResponse.json({ synopsis });
  } catch (error) {
    console.error('[Side Canal Synopsis] Error:', error);
    return NextResponse.json({ error: 'Failed to generate synopsis' }, { status: 500 });
  }
}
