import { NextRequest, NextResponse } from 'next/server';
import { tracker } from '@/lib/implementation-tracker';
import { ImplementationsCreateSchema, ImplementationsPatchSchema } from '@/lib/route-schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const sessionId = searchParams.get('session');

    if (sessionId) {
      const implementations = await tracker.getSessionProgress(sessionId);
      return NextResponse.json({ implementations });
    }

    if (status === 'pending') {
      const implementations = await tracker.getPending();
      return NextResponse.json({ implementations });
    }

    const implementations = await tracker.getAll();
    const progress = await tracker.getProgress();
    return NextResponse.json({ implementations, progress });
  } catch (error) {
    console.error('[API] Failed to fetch implementations:', error);
    return NextResponse.json({ error: 'Failed to fetch implementations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = ImplementationsCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const {
      featureName,
      featureType,
      description,
      sessionId,
      commandUsed,
      filesCreated,
      filesModified,
      linesAdded,
      linesModified,
      status,
      validationMessage,
    } = parsed.data;

    // Start the implementation record
    const id = await tracker.start({
      featureName,
      featureType,
      description,
      sessionId,
      commandUsed,
    });

    // Update files if provided
    if (filesCreated || filesModified || linesAdded !== undefined || linesModified !== undefined) {
      await tracker.updateFiles(id, {
        filesCreated,
        filesModified,
        linesAdded,
        linesModified,
      });
    }

    // If status is 'validated', validate immediately (CLI workflow)
    const finalStatus = status || 'pending';
    if (finalStatus === 'validated') {
      await tracker.validate(id, validationMessage || 'Validated via CLI');
    } else if (finalStatus === 'testing') {
      await tracker.markTesting(id);
    }

    return NextResponse.json({
      id,
      status: finalStatus,
      message: 'Implementation saved to memory',
    });
  } catch (error) {
    console.error('[API] Failed to create implementation:', error);
    return NextResponse.json({ error: 'Failed to create implementation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const parsed = ImplementationsPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { id, action, message, filesCreated, filesModified, linesAdded, linesModified } =
      parsed.data;

    if (action === 'validate') {
      await tracker.validate(id, message || 'Validated');
      return NextResponse.json({ success: true, status: 'validated' });
    }

    if (action === 'reject' || action === 'revert') {
      await tracker.revert(id, message || 'Rejected');
      return NextResponse.json({ success: true, status: 'reverted' });
    }

    if (action === 'testing') {
      await tracker.markTesting(id);
      return NextResponse.json({ success: true, status: 'testing' });
    }

    if (action === 'update-files') {
      await tracker.updateFiles(id, { filesCreated, filesModified, linesAdded, linesModified });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[API] Failed to update implementation:', error);
    return NextResponse.json({ error: 'Failed to update implementation' }, { status: 500 });
  }
}
