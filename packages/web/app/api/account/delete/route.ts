import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-guard';
import { deleteAllUserData, hasActivePaidSubscription } from '@/lib/db/delete-account';
import { destroySession } from '@/lib/db/auth';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/account/delete — irreversible self-serve account + data deletion (makes the privacy
 * page's promise real). The user may ONLY delete THEIR OWN account: the userId comes from the
 * session, never the body. An explicit typed confirmation ({ confirm: "DELETE" }) is required so a
 * stray/CSRF-ish call can't fire. A still-billing paid subscription blocks deletion (cancel first).
 */
const BodySchema = z.object({
  confirm: z.literal('DELETE'),
});

export async function POST(request: NextRequest) {
  // Own-account-only: identity is the session, full stop. Anonymous → 401.
  const auth = requireAuth(request);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'confirmation_required', message: 'Send { "confirm": "DELETE" } to confirm this irreversible action.' },
      { status: 400 }
    );
  }

  // Never delete an account Stripe keeps charging.
  if (hasActivePaidSubscription(userId)) {
    return NextResponse.json(
      {
        error: 'active_subscription',
        message: 'Cancel your paid subscription first, then delete your account — this prevents you from being charged after deletion.',
      },
      { status: 409 }
    );
  }

  let result;
  try {
    result = deleteAllUserData(userId);
  } catch (e) {
    log('ERROR', 'ACCOUNT_DELETE', `transaction failed: ${(e as Error).message}`);
    return NextResponse.json({ error: 'deletion_failed' }, { status: 500 });
  }

  // Destroy the session server-side, then clear the cookie so the user is fully signed out.
  const token = request.cookies.get('session_token')?.value;
  if (token) {
    try {
      destroySession(token);
    } catch {}
  }
  log('INFO', 'ACCOUNT_DELETE', `user ${userId} deleted ${result.totalRows} rows across ${Object.keys(result.perTable).length} tables`);

  const response = NextResponse.json({
    success: true,
    deleted: result.perTable,
    totalRows: result.totalRows,
  });
  response.cookies.delete('session_token');
  return response;
}
