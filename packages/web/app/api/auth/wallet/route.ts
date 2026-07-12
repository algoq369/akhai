import { NextRequest, NextResponse } from 'next/server';
import { AuthWalletSchema } from '@/lib/route-schemas';
import { issueWalletChallenge } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/wallet
 * Initiate wallet authentication — issues a single-use server nonce and returns the message to
 * sign. The nonce is persisted server-side (wallet-verify B1 anti-replay); the client relays the
 * returned message verbatim to /api/auth/wallet/verify.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = AuthWalletSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { address } = parsed.data;

    const message = issueWalletChallenge(address);

    return NextResponse.json({
      message,
      address,
    });
  } catch (error) {
    console.error('Wallet auth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate wallet authentication' },
      { status: 500 }
    );
  }
}
