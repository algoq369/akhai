import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { getStageIds, setStageIds } from '@/lib/db/canvas-stage';
import { CanvasStageSchema } from '@/lib/route-schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const user = token ? getUserFromSession(token) : null;
  if (!user) return NextResponse.json({ stageIds: [] });
  try {
    const stageIds = getStageIds(user.id);
    return NextResponse.json({ stageIds });
  } catch (error) {
    console.error('canvas-stage GET error:', error);
    return NextResponse.json({ stageIds: [] });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const user = token ? getUserFromSession(token) : null;
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const parsed = CanvasStageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const stageIds = parsed.data.stageIds.slice(0, 5);
    setStageIds(user.id, stageIds);
    return NextResponse.json({ stageIds, ok: true });
  } catch (error) {
    console.error('canvas-stage POST error:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
